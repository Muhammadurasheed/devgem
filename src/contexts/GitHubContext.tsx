import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

interface GitHubUser {
    login: string;
    name: string;
    avatar_url: string;
    email?: string;
}

interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    clone_url: string;
    language: string;
    stargazers_count: number;
    private: boolean;
    default_branch: string;
}

interface GitHubContextType {
    token: string | null;
    user: GitHubUser | null;
    repositories: GitHubRepo[];
    isLoading: boolean;
    isConnected: boolean;
    connect: (token: string) => Promise<boolean>;
    disconnect: () => void;
    fetchRepositories: () => Promise<void>;
    validateToken: (token: string) => Promise<boolean>;
    getToken: () => string | null;
}

const GitHubContext = createContext<GitHubContextType | null>(null);

export const GITHUB_TOKEN_KEY = 'servergem_github_token';
export const GITHUB_USER_KEY = 'servergem_github_user';

export function GitHubProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize from localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem(GITHUB_TOKEN_KEY);
        const savedUser = localStorage.getItem(GITHUB_USER_KEY);

        if (savedToken) {
            setToken(savedToken);
            setIsConnected(true);
        }

        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Failed to parse saved user:', e);
                localStorage.removeItem(GITHUB_USER_KEY);
            }
        }
    }, []);

    // Validate token with GitHub API
    const validateToken = useCallback(async (tokenToValidate: string): Promise<boolean> => {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${tokenToValidate}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                const githubUser: GitHubUser = {
                    login: userData.login,
                    name: userData.name || userData.login,
                    avatar_url: userData.avatar_url,
                    email: userData.email
                };

                setUser(githubUser);
                localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(githubUser));
                return true;
            } else {
                console.error('Token validation failed:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Error validating token:', error);
            return false;
        }
    }, []);

    // Connect with GitHub token
    const connect = useCallback(async (githubToken: string) => {
        setIsLoading(true);
        try {
            const isValid = await validateToken(githubToken);

            if (isValid) {
                setToken(githubToken);
                setIsConnected(true);
                localStorage.setItem(GITHUB_TOKEN_KEY, githubToken);
                toast.success('Successfully connected to GitHub!');
                return true;
            } else {
                toast.error('Invalid GitHub token. Please check and try again.');
                return false;
            }
        } catch (error) {
            console.error('Connection error:', error);
            toast.error('Failed to connect to GitHub');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [validateToken]);

    // Disconnect from GitHub
    const disconnect = useCallback(() => {
        setToken(null);
        setUser(null);
        setRepositories([]);
        setIsConnected(false);
        localStorage.removeItem(GITHUB_TOKEN_KEY);
        localStorage.removeItem(GITHUB_USER_KEY);
        toast.success('Disconnected from GitHub');
    }, []);

    // Fetch user repositories
    const fetchRepositories = useCallback(async () => {
        if (!token) {
            // Don't show toast on auto-fetch attempts if silent, usage depends on call site
            // But for explicit calls (RepoSelector), we want feedback.
            // We'll keep it simple for now.
            return;
        }

        setIsLoading(true);
        try {
            const perPage = 100;
            let allRepos: GitHubRepo[] = [];
            let page = 1;
            let hasMore = true;

            while (hasMore && page <= 3) {
                const response = await fetch(
                    `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const repos = await response.json();
                if (repos.length < perPage) {
                    hasMore = false;
                }

                allRepos = [...allRepos, ...repos];
                page++;
            }

            setRepositories(allRepos);
            // toast.success(`Loaded ${allRepos.length} repositories`); // Optional: avoid spam
        } catch (error) {
            console.error('Error fetching repositories:', error);

            // Handle 401 Unauthorized (Expired Token)
            if (error instanceof Error && error.message.includes('401')) {
                toast.error('GitHub session expired. Please reconnect.');
                disconnect(); // This will now update GLOBAL state!
            } else {
                toast.error('Failed to load repositories');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, disconnect]);

    const getToken = useCallback(() => token, [token]);

    return (
        <GitHubContext.Provider value={{
            token,
            user,
            repositories,
            isLoading,
            isConnected,
            connect,
            disconnect,
            fetchRepositories,
            validateToken,
            getToken
        }}>
            {children}
        </GitHubContext.Provider>
    );
}

export function useGitHubContext() {
    const context = useContext(GitHubContext);
    if (!context) {
        throw new Error('useGitHubContext must be used within a GitHubProvider');
    }
    return context;
}
