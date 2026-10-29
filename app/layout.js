import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://fricette.ch"),
  title: "Fricette – ton frigo est plein d'idées",
  description:
    "Dis à Fricette ce qu'il y a dans ton frigo (et combien) : elle te trouve des recettes anti-gaspi, avec ce qu'il te manque.",
  openGraph: {
    title: "Fricette – ton frigo est plein d'idées",
    description: "Des recettes avec ce qu'il y a dans ton frigo. Anti-gaspi, rapide, et un peu dingue.",
    type: "website",
    locale: "fr_CH",
    siteName: "Fricette",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111113" },
  ],
};

const ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='#111'/><text x='32' y='47' text-anchor='middle' font-family='Arial Black, Arial, sans-serif' font-weight='900' font-size='44' fill='#ff4d2e' transform='rotate(-8 32 32)'>c</text></svg>`
  );

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href={ICON} />
      </head>
      <body>{children}</body>
    </html>
  );
}
