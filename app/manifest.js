export default function manifest() {
  return {
    name: "Fricette – ton frigo est plein d'idées",
    short_name: "Fricette",
    description: "Des recettes avec ce qu'il y a dans ton frigo, avec les quantités. Anti-gaspi.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#f2552c",
    lang: "fr-CH",
    categories: ["food", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mon frigo", url: "/#frigo", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Liste de courses", url: "/courses", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Planning de la semaine", url: "/planning", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
