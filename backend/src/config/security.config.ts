export const getSecurityConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", ...(isProduction ? [] : ["'unsafe-eval'"])],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: [
            "'self'",
            ...(isProduction 
              ? ['https://api.yourdomain.com'] 
              : ['http://localhost:3000', 'http://localhost:4200']
            ),
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          frameAncestors: [
            "'self'",
            ...(isProduction 
              ? ['https://parent.yourdomain.com'] 
              : ['http://localhost:8080']
            ),
          ],
        },
      },
      hsts: {
        maxAge: isProduction ? 31536000 : 0,
        includeSubDomains: isProduction,
        preload: isProduction,
      },
    },
  };
};

// Made with Bob
