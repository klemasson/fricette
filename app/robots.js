export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/stats", "/courses"] },
    sitemap: "https://fricette.ch/sitemap.xml",
    host: "https://fricette.ch",
  };
}
