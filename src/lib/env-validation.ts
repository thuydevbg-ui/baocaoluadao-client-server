/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 */

const REQUIRED_IN_PRODUCTION = [
  'DUMMY_BCRYPT_HASH',
  // Thêm các env vars khác nếu cần
];

const RECOMMENDED_IN_PRODUCTION = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
];

export function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Check required vars
    for (const varName of REQUIRED_IN_PRODUCTION) {
      if (!process.env[varName]) {
        console.error(`[ENV] CRITICAL: Required env var ${varName} is not set in production!`);
      }
    }
    
    // Warn about recommended vars
    for (const varName of RECOMMENDED_IN_PRODUCTION) {
      if (!process.env[varName]) {
        console.warn(`[ENV] WARNING: Recommended env var ${varName} is not set in production`);
      }
    }
  } else {
    // Development mode - warn about DUMMY_BCRYPT_HASH
    if (!process.env.DUMMY_BCRYPT_HASH) {
      console.warn(`[ENV] WARNING: DUMMY_BCRYPT_HASH not set. Using fallback hash.`);
    }
  }
}

export default validateEnvironment;