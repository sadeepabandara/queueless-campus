// Rate Limiting Middleware for Brute Force Prevention

// In-memory store for rate limiting (use Redis for production)
const loginAttempts = new Map();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const WINDOW_TIME = 15 * 60 * 1000; // 15 minutes window

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of loginAttempts.entries()) {
        if (now - data.lastAttempt > WINDOW_TIME) {
            loginAttempts.delete(key);
        }
    }
}, WINDOW_TIME);

// Get client IP
function getClientIP(req) {
    return req.ip || req.connection.remoteAddress || 
           req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           'unknown';
}

// Rate limiting middleware
exports.rateLimit = (req, res, next) => {
    const ip = getClientIP(req);
    const now = Date.now();
    
    const attemptData = loginAttempts.get(ip) || {
        attempts: 0,
        lastAttempt: now,
        lockedUntil: null
    };
    
    // Check if IP is locked
    if (attemptData.lockedUntil && now < attemptData.lockedUntil) {
        const remainingTime = Math.ceil((attemptData.lockedUntil - now) / 1000 / 60);
        return res.status(429).json({
            message: `Too many failed login attempts. Please try again in ${remainingTime} minutes.`,
            retryAfter: Math.ceil((attemptData.lockedUntil - now) / 1000),
            locked: true
        });
    }
    
    // Store attempt data
    attemptData.lastAttempt = now;
    loginAttempts.set(ip, attemptData);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', MAX_ATTEMPTS);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_ATTEMPTS - attemptData.attempts));
    res.setHeader('X-RateLimit-Reset', Math.ceil((attemptData.lastAttempt + WINDOW_TIME) / 1000));
    
    next();
};

// Record failed login attempt
exports.recordFailedAttempt = (req) => {
    const ip = getClientIP(req);
    const now = Date.now();
    
    const attemptData = loginAttempts.get(ip) || {
        attempts: 0,
        lastAttempt: now,
        lockedUntil: null
    };
    
    attemptData.attempts += 1;
    attemptData.lastAttempt = now;
    
    // Lock out if max attempts exceeded
    if (attemptData.attempts >= MAX_ATTEMPTS) {
        attemptData.lockedUntil = now + LOCKOUT_TIME;
        console.warn(`IP ${ip} locked out due to too many failed attempts`);
    }
    
    loginAttempts.set(ip, attemptData);
    
    return {
        attempts: attemptData.attempts,
        remaining: Math.max(0, MAX_ATTEMPTS - attemptData.attempts),
        locked: attemptData.lockedUntil !== null,
        lockedUntil: attemptData.lockedUntil
    };
};

// Record successful login - reset attempts
exports.recordSuccess = (req) => {
    const ip = getClientIP(req);
    loginAttempts.delete(ip);
    return true;
};

// Get attempt info for debugging
exports.getAttemptInfo = (req) => {
    const ip = getClientIP(req);
    return loginAttempts.get(ip) || null;
};

// Manual unlock (for admin purposes)
exports.unlockIP = (ip) => {
    if (loginAttempts.has(ip)) {
        const attemptData = loginAttempts.get(ip);
        attemptData.attempts = 0;
        attemptData.lockedUntil = null;
        loginAttempts.set(ip, attemptData);
        return true;
    }
    return false;
};

// Get all locked IPs (for monitoring)
exports.getLockedIPs = () => {
    const now = Date.now();
    const locked = [];
    for (const [ip, data] of loginAttempts.entries()) {
        if (data.lockedUntil && now < data.lockedUntil) {
            locked.push({
                ip,
                attempts: data.attempts,
                lockedUntil: new Date(data.lockedUntil).toISOString()
            });
        }
    }
    return locked;
};

module.exports = exports;
