/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export 100% statique → `next build` génère frontend/out/ qu'Express sert tel quel.
  output: "export",
  // Pas d'optim Next.js Image en static export (le serveur d'optim n'existe plus).
  images: { unoptimized: true },
  // Slash final pour que `/lobby` → `/lobby/index.html`. Ça simplifie le service
  // par express.static() (pas de rewrite rules à écrire).
  trailingSlash: true,
  reactStrictMode: true,
};
export default nextConfig;
