export function enhancedSecurityHeaders(req, res, next) {
  if (!res.getHeader('Permissions-Policy')) {
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  if (!res.getHeader('Feature-Policy')) {
    res.setHeader('Feature-Policy', 'geolocation none; microphone none; camera none');
  }

  if (!res.getHeader('X-Permitted-Cross-Domain-Policies')) {
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  }

  next();
}
