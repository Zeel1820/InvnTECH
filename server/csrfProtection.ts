import type { RequestHandler } from "express";

// CSRF protection middleware for state-changing requests
export const csrfProtection: RequestHandler = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Check CSRF token
  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromSession = (req.session as any)?.csrfToken;
  
  if (!tokenFromSession || tokenFromHeader !== tokenFromSession) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  
  next();
};
