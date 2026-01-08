"""
GitHub OAuth Service
Handles the OAuth 2.0 flow for GitHub integration.
"""

import os
import requests
from typing import Dict, Optional
from urllib.parse import urlencode

class GitHubAuthService:
    def __init__(self):
        self.client_id = os.getenv('GITHUB_CLIENT_ID')
        self.client_secret = os.getenv('GITHUB_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GITHUB_REDIRECT_URI', 'http://localhost:8080/deploy')
        self.auth_url = 'https://github.com/login/oauth/authorize'
        self.token_url = 'https://github.com/login/oauth/access_token'
        self.user_url = 'https://api.github.com/user'

    def get_authorization_url(self) -> str:
        """Generate the GitHub OAuth authorization URL"""
        if not self.client_id:
            raise ValueError("GITHUB_CLIENT_ID is not configured")
            
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': 'repo read:user',
            'state': 'random_state_string' # TODO: Implement proper state handling for security
        }
        return f"{self.auth_url}?{urlencode(params)}"

    def exchange_code_for_token(self, code: str) -> Dict:
        """Exchange the temporary code for an access token"""
        if not self.client_id or not self.client_secret:
            raise ValueError("GitHub credentials not configured")
            
        payload = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'redirect_uri': self.redirect_uri
        }
        
        headers = {'Accept': 'application/json'}
        
        response = requests.post(self.token_url, json=payload, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Failed to exchange token: {response.text}")
            
        data = response.json()
        
        if 'error' in data:
            raise Exception(f"GitHub OAuth error: {data['error']}")
            
        return {
            'access_token': data['access_token'],
            'token_type': data.get('token_type'),
            'scope': data.get('scope')
        }

    def get_user_info(self, access_token: str) -> Dict:
        """Fetch authenticated user info with the new token"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        response = requests.get(self.user_url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Failed to fetch user info: {response.status_code}")
            
        return response.json()
