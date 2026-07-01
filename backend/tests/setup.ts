// Runs before any test module (and therefore before any `src/` import).
// `src/env.ts` reads and validates these at import time, so they must exist
// first. NODE_ENV must NOT be "production" or the weak-secret guard throws.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://x:x@localhost:5432/x";
process.env.JWT_SECRET = "test-secret-that-is-long-enough-1234";
