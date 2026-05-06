// Server-only env access. Throws clearly if a required var is missing.

const required = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
};

const steamRealm = process.env.STEAM_REALM || "http://localhost:3000";

export const env = {
  STEAM_API_KEY: required("STEAM_API_KEY"),
  STEAM_REALM: steamRealm,
  STEAM_RETURN_URL: process.env.STEAM_RETURN_URL || `${steamRealm}/api/auth/steam/callback`,
  JWT_SECRET: required("JWT_SECRET"),
  // Chemin (relatif au cwd backend/) du build static frontend que Express sert.
  FRONTEND_DIST: process.env.FRONTEND_DIST || "../frontend/out",
  // SQLite DB file. Created on first open. Must be writable by the Node process.
  DB_PATH: process.env.DB_PATH || "./data/gauntlet.sqlite",
  // Twitch app credentials. Register at https://dev.twitch.tv/console/apps and
  // add both the localhost and production redirect URIs.
  TWITCH_CLIENT_ID: required("TWITCH_CLIENT_ID"),
  TWITCH_CLIENT_SECRET: required("TWITCH_CLIENT_SECRET"),
  TWITCH_REDIRECT_URI:
    process.env.TWITCH_REDIRECT_URI || `${steamRealm}/api/twitch/auth/callback`,
};
