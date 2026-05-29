from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter keyed by client IP. Used as a decorator on sensitive endpoints.
limiter = Limiter(key_func=get_remote_address, default_limits=[])
