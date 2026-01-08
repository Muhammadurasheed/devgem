"""
Rate Limiter for Gemini API Calls
Prevents quota exhaustion during heavy usage
"""

import time
import asyncio
from typing import Dict
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class RateLimitConfig:
    """Rate limit configuration"""
    requests_per_minute: int = 10
    requests_per_hour: int = 100
    cooldown_seconds: float = 6.0  # Minimum time between requests


class TokenBucketRateLimiter:
    """
    Token bucket rate limiter for API calls.
    Prevents quota exhaustion by limiting request frequency.
    """
    
    def __init__(self, config: RateLimitConfig = None):
        self.config = config or RateLimitConfig()
        self.tokens = self.config.requests_per_minute
        self.last_refill = time.time()
        self.request_history: list = []
        self._lock = asyncio.Lock()
    
    async def acquire(self, timeout: float = 30.0) -> bool:
        """
        Acquire permission to make an API call.
        Blocks until a token is available or timeout.
        
        Returns:
            True if permission granted, False if timed out
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            async with self._lock:
                self._refill_tokens()
                self._cleanup_history()
                
                # Check hourly limit
                hour_ago = datetime.now() - timedelta(hours=1)
                recent_requests = [t for t in self.request_history if t > hour_ago]
                
                if len(recent_requests) >= self.config.requests_per_hour:
                    wait_time = (self.request_history[0] + timedelta(hours=1) - datetime.now()).total_seconds()
                    print(f"[RateLimiter] ⚠️ Hourly limit reached. Wait {wait_time:.0f}s")
                    await asyncio.sleep(min(wait_time, 5.0))
                    continue
                
                # Check per-minute tokens
                if self.tokens >= 1:
                    self.tokens -= 1
                    self.request_history.append(datetime.now())
                    return True
            
            # Wait and retry
            await asyncio.sleep(self.config.cooldown_seconds)
        
        return False
    
    def _refill_tokens(self):
        """Refill tokens based on time elapsed"""
        now = time.time()
        elapsed = now - self.last_refill
        
        # Refill at rate of requests_per_minute / 60 per second
        refill_rate = self.config.requests_per_minute / 60.0
        new_tokens = elapsed * refill_rate
        
        self.tokens = min(self.tokens + new_tokens, self.config.requests_per_minute)
        self.last_refill = now
    
    def _cleanup_history(self):
        """Remove old entries from request history"""
        hour_ago = datetime.now() - timedelta(hours=1)
        self.request_history = [t for t in self.request_history if t > hour_ago]
    
    def get_status(self) -> Dict:
        """Get current rate limiter status"""
        self._refill_tokens()
        hour_ago = datetime.now() - timedelta(hours=1)
        recent_requests = [t for t in self.request_history if t > hour_ago]
        
        return {
            'available_tokens': int(self.tokens),
            'requests_this_hour': len(recent_requests),
            'hourly_limit': self.config.requests_per_hour,
            'can_proceed': self.tokens >= 1 and len(recent_requests) < self.config.requests_per_hour
        }


# Global rate limiter instance
_rate_limiter: TokenBucketRateLimiter = None


def get_rate_limiter() -> TokenBucketRateLimiter:
    """Get or create global rate limiter"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = TokenBucketRateLimiter()
    return _rate_limiter
