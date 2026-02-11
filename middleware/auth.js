/**
 * Authentication Middleware
 * Validates API key from request headers
 */

export function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const serverApiKey = process.env.API_KEY;

    // Check if API key is configured
    if (!serverApiKey) {
        console.error('⚠️  SECURITY WARNING: API_KEY not configured in environment variables!');
        return res.status(500).json({
            message: 'error',
            error: 'Server configuration error'
        });
    }

    // Validate API key
    if (!apiKey || apiKey !== serverApiKey) {
        console.warn(`🚫 Unauthorized access attempt from IP: ${req.ip}`);
        return res.status(401).json({
            message: 'error',
            error: 'Unauthorized: Invalid or missing API key'
        });
    }

    // API key is valid, continue to next middleware
    next();
}

/**
 * Optional: Log successful authentications
 */
export function logAuthentication(req, res, next) {
    console.log(`✅ Authenticated request: ${req.method} ${req.path} from ${req.ip}`);
    next();
}
