import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "./globals.css";
import { ServiceWorker } from "./components/Pwa";

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


export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/icons/favicon-64.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Fricette" />
      </head>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
