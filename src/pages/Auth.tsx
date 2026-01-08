/**
 * DevGem Authentication
 * Google-tier premium login experience with GitHub OAuth
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGitHub } from '@/hooks/useGitHub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Github, 
  Mail, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  Clock,
  ChevronRight
} from 'lucide-react';
import Logo from '@/components/Logo';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, loading: authLoading } = useAuth();
  const { 
    initiateOAuth, 
    handleOAuthCallback, 
    isLoading: githubLoading, 
    isConnected,
    user: githubUser 
  } = useGitHub();
  
  const [mode, setMode] = useState<'initial' | 'email-signin' | 'email-signup'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);

  // Handle OAuth callback from GitHub
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !isProcessingOAuth) {
      setIsProcessingOAuth(true);
      handleOAuthCallback(code).then((success) => {
        // Clear the URL params
        window.history.replaceState({}, '', '/auth');
        if (success) {
          navigate('/deploy');
        }
        setIsProcessingOAuth(false);
      });
    }
  }, [searchParams, handleOAuthCallback, navigate, isProcessingOAuth]);

  // Redirect if already connected
  useEffect(() => {
    if (isConnected && githubUser && !isProcessingOAuth) {
      navigate('/deploy');
    }
  }, [isConnected, githubUser, navigate, isProcessingOAuth]);

  const handleGitHubAuth = async () => {
    await initiateOAuth();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'email-signup') {
        await signUp(email, password, displayName);
        toast.success('Account created! Welcome to DevGem');
      } else {
        await signIn(email, password);
        toast.success('Welcome back!');
      }
      navigate('/deploy');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    }
  };

  const features = [
    { icon: Zap, text: "Deploy in 3 minutes", color: "text-yellow-400" },
    { icon: Shield, text: "Enterprise-grade security", color: "text-emerald-400" },
    { icon: Clock, text: "Zero configuration", color: "text-blue-400" },
  ];

  if (isProcessingOAuth || githubLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <Logo size={80} />
          </div>
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Authenticating with GitHub...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 rounded-full blur-[150px]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 xl:p-16">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <Logo size={48} />
              <span className="text-2xl font-bold gradient-text">DevGem</span>
            </motion.div>
          </div>
          
          <div className="space-y-8 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h1 className="text-5xl xl:text-6xl font-bold leading-tight">
                Deploy to
                <span className="block gradient-text">Google Cloud</span>
                <span className="block text-muted-foreground/80">in one chat</span>
              </h1>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Skip the YAML. Skip the CLI. Just tell DevGem what you want, 
              and watch your app go live on Cloud Run in minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col gap-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className={`p-2 rounded-lg bg-muted/50 ${feature.color}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="text-foreground/80">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center gap-6"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 border-2 border-background flex items-center justify-center"
                >
                  <span className="text-xs font-medium">👤</span>
                </div>
              ))}
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">Trusted by developers</p>
              <p className="text-muted-foreground">building the future</p>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Logo size={48} />
                <span className="text-2xl font-bold gradient-text">DevGem</span>
              </div>
              <p className="text-muted-foreground">Deploy to Google Cloud in one chat</p>
            </div>

            {/* Auth Card */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-xl opacity-50" />
              
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
                <AnimatePresence mode="wait">
                  {mode === 'initial' && (
                    <motion.div
                      key="initial"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Welcome to DevGem</h2>
                        <p className="text-muted-foreground text-sm">
                          Connect your GitHub to start deploying
                        </p>
                      </div>

                      {/* GitHub OAuth Button - Primary */}
                      <Button
                        onClick={handleGitHubAuth}
                        disabled={githubLoading}
                        className="w-full h-14 text-base font-medium gap-3 bg-[#24292e] hover:bg-[#1a1e22] text-white border-0 shadow-lg shadow-black/20 transition-all hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5"
                        size="lg"
                      >
                        {githubLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Github className="w-5 h-5" />
                        )}
                        Continue with GitHub
                        <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                      </Button>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Access to private repos • No PAT required • OAuth 2.0 secured</span>
                      </div>

                      {/* Divider */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-3 text-muted-foreground">
                            or continue with email
                          </span>
                        </div>
                      </div>

                      {/* Email Options */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setMode('email-signin')}
                          className="h-12 border-border/50 hover:bg-muted/50 hover:border-primary/30"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Sign In
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setMode('email-signup')}
                          className="h-12 border-border/50 hover:bg-muted/50 hover:border-primary/30"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Sign Up
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {(mode === 'email-signin' || mode === 'email-signup') && (
                    <motion.div
                      key="email-form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">
                          {mode === 'email-signup' ? 'Create your account' : 'Welcome back'}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                          {mode === 'email-signup' 
                            ? 'Start deploying in minutes' 
                            : 'Sign in to continue to DevGem'
                          }
                        </p>
                      </div>

                      <form onSubmit={handleEmailSubmit} className="space-y-4">
                        {mode === 'email-signup' && (
                          <div className="space-y-2">
                            <Label htmlFor="displayName" className="text-sm font-medium">
                              Display Name
                            </Label>
                            <Input
                              id="displayName"
                              type="text"
                              placeholder="John Doe"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              disabled={authLoading}
                              className="h-12 bg-muted/30 border-border/50 focus:border-primary/50"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={authLoading}
                            className="h-12 bg-muted/30 border-border/50 focus:border-primary/50"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium">
                            Password
                          </Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={authLoading}
                            minLength={6}
                            className="h-12 bg-muted/30 border-border/50 focus:border-primary/50"
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-12 text-base font-medium"
                          disabled={authLoading}
                        >
                          {authLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              {mode === 'email-signup' ? 'Create Account' : 'Sign In'}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </form>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-3 text-muted-foreground">
                            or
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGitHubAuth}
                          disabled={githubLoading}
                          className="w-full h-12 gap-2 border-border/50 hover:bg-muted/50"
                        >
                          <Github className="w-5 h-5" />
                          Continue with GitHub
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setMode('initial')}
                          className="w-full text-muted-foreground hover:text-foreground"
                        >
                          ← Back to options
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              By continuing, you agree to DevGem's Terms of Service and Privacy Policy
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
