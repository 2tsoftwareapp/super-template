// Placeholder secrets shipped in .env.example / .env.development. They are fine for
// local development but MUST be replaced with real secrets in staging/production.
export const DEV_PLACEHOLDER_SECRETS = new Set([
  "replace-with-a-long-random-development-secret",
  "replace-with-another-long-random-development-secret",
]);
export const DEV_PLACEHOLDER_MFA_KEY =
  "0861abb090792515d50d973600fced671ad99f2edd463d5da88887d90d594f99";
// Must differ from DEV_PLACEHOLDER_MFA_KEY: the whole point of SSO_ENCRYPTION_KEY
// is a key lifecycle independent from the MFA key.
export const DEV_PLACEHOLDER_SSO_KEY =
  "6617b8fda13d6885a44e53dc00bfbfd997d0b25b3094cf2063a577eaec268788";
