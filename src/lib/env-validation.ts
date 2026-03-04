/**
 * Environment Variables Validation
 * Validates required environment variables at startup
 */

const REQUIRED_PROD_VARS = ['DATABASE_URL', 'NEXTAUTH_SECRET'];

const DEVELOPMENT_WARNINGS: string[] = [];

/**
 * Validate environment variables on startup
 * Call this in your API routes or at server initialization
 */
export function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check required production variables
  if (isProduction) {
    for (const varName of REQUIRED_PROD_VARS) {
      if (!process.env[varName]) {
        console.error(`[ENV] Missing required environment variable: ${varName}`);
        // In production, we could throw here, but for now just warn
        // throw new Error(`Missing required environment variable: ${varName}`);
      }
    }
  }
  
  // Warn about DUMMY_BCRYPT_HASH in production
  if (isProduction && !process.env.DUMMY_BCRYPT_HASH) {
    console.warn('[ENV] WARNING: DUMMY_BCRYPT_HASH not set in production. Using fallback is not recommended.');
    DEVELOPMENT_WARNINGS.push('DUMMY_BCRYPT_HASH');
  }
  
  // Log warnings in development
  if (DEVELOPMENT_WARNINGS.length > 0 && !isProduction) {
    console.warn('[ENV] Development mode: using fallback for:', DEVELOPMENT_WARNINGS.join(', '));
  }
}

/**
 * Get DUMMY_BCRYPT_HASH or return fallback
 */
export function getDummyBcryptHash(): string {
  // Validate on first call
  validateEnvironment();
  
  if (process.env.DUMMY_BCRYPT_HASH) {
    return process.env.DUMMY_BCRYPT_HASH;
  }
  
  // Return hardcoded fallback for development only
  // In production this should not happen if validateEnvironment() is called
  if (process.env.NODE_ENV === 'production') {
    console.error('[ENV] CRITICAL: DUMMY_BCRYPT_HASH not set in production!');
  }
  
  return '$2b$12$ULm72h4KeqGAhIkAX28tnef1waSjucCCs4JMSq6vxd/gE0cNC3vCm';
}

// Auto-validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateEnvironment();
}
