from django_ratelimit.decorators import ratelimit
from django.http import HttpResponseForbidden
from django.core.cache import cache
import time
import logging

logger = logging.getLogger('payments')

class AbuseProtectionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.suspicious_user_agents = [
            'bot', 'crawler', 'spider', 'scraper', 'python', 'curl', 'wget'
        ]

    def __call__(self, request):
        # Check for suspicious user agents
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        if any(bot in user_agent for bot in self.suspicious_user_agents):
            # Allow legitimate bots like Googlebot
            if 'googlebot' not in user_agent and 'bingbot' not in user_agent:
                return HttpResponseForbidden("Access denied.")
        
        # Global rate limiting for all requests
        client_ip = self.get_client_ip(request)
        
        # Different limits for authenticated vs anonymous
        if request.user.is_authenticated:
            rate_limit = '100/m'  # Authenticated users
        else:
            rate_limit = '30/m'   # Anonymous users
        
        # Check rate limit
        cache_key = f"ratelimit_{client_ip}"
        requests = cache.get(cache_key, [])
        
        # Clean old requests (older than 1 minute)
        current_time = time.time()
        requests = [req_time for req_time in requests if current_time - req_time < 60]
        
        if len(requests) >= 30:  # 30 requests per minute for anonymous
            logger.warning(f"Rate limit exceeded for IP: {client_ip}, User-Agent: {user_agent}")
            return HttpResponseForbidden("Rate limit exceeded. Please try again later.")
        
        # Add current request
        requests.append(current_time)
        cache.set(cache_key, requests, 60)  # Cache for 1 minute
        
        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip