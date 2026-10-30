// En-tête et pied de page des pages secondaires (recette, ingrédients, courses).
import { Ico } from "./bits";
import { CoursesLink, PageView, AccountLink } from "./Live";
import Newsletter from "./Newsletter";
import Logo from "./Logo";
import FootSocial from "./FootSocial";

export function SiteHeader() {
  return (
    <header className="in">
      <nav className="nav">
        <Logo />
        <div className="nav-right">
          <a className="nav-link" href="/?q=" aria-label="Chercher une recette"><svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg></a>
          <a className="nav-link hide-sm" href="/idees">Idées de recettes</a>
          <CoursesLink />
          <a className="nav-link hide-sm" href="/#frigo">Mon frigo</a>
          <AccountLink />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="in foot-news"><Newsletter /></div>
      <FootSocial />
      <div className="in">
        <span>fricette · fait avec amour et des restes</span>
        <span className="foot-links">
          <a href="/avec">Idées par ingrédient</a>
          <a href="/idees">Idées de recettes</a>
            <a href="/saison">Calendrier de saison</a>
            <a href="/realisations">Vos réalisations</a>
            <a href="/concours">Concours photo</a>
          <a href="/gestes">Gestes en vidéo</a>
          <a href="/planning">Planning</a>
          <a href="/courses">Liste de courses</a>
          <a href="/conditions">Conditions</a>
        </span>
      </div>
      <PageView />
    </footer>
  );
}
