// Server-only env access. Throws clearly if a required var is missing.

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

export const env = {
  STEAM_API_KEY: required("STEAM_API_KEY"),
  STEAM_REALM: process.env.STEAM_REALM || "http://localhost:3000",
  STEAM_RETURN_URL: process.env.STEAM_RETURN_URL || "http://localhost:3000/api/auth/steam/callback",
  JWT_SECRET: required("JWT_SECRET"),
  // Chemin (relatif au cwd backend/) du build static frontend que Express sert.
  FRONTEND_DIST: process.env.FRONTEND_DIST || "../frontend/out",
};
