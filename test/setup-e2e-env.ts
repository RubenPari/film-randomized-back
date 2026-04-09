/**
 * Ensures e2e runs satisfy ConfigModule Joi validation before AppModule loads.
 * Local .env may use a shorter JWT_SECRET during development.
 */
const E2E_JWT_FALLBACK = '0123456789abcdef0123456789abcdef0123456789ab';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = E2E_JWT_FALLBACK;
}
