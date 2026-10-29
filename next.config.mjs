/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // L'hébergement mutualisé limite les ressources : on construit avec peu de tâches en parallèle.
  experimental: { cpus: 2 },
};

export default nextConfig;
