export const metadata = { title: "Hors ligne – Fricette", robots: { index: false } };

export default function Offline() {
  return (
    <main className="in listing" style={{ paddingTop: 48 }}>
      <h1>Pas de réseau</h1>
      <p className="lead">Fricette a besoin d'Internet pour cette page. Les pages et recettes déjà ouvertes restent disponibles : <a href="/">retour à l'accueil</a>, <a href="/courses">ta liste de courses</a>.</p>
    </main>
  );
}
