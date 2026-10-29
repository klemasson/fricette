// En-tête et pied de page des pages secondaires (recette, ingrédients, courses).
import { Ico } from "./bits";
import { CoursesLink, PageView, AccountLink } from "./Live";
import Newsletter from "./Newsletter";
import Logo from "./Logo";

export function SiteHeader() {
  return (
    <header className="in">
      <nav className="nav">
        <Logo />
        <div className="nav-right">
          <a className="nav-link hide-sm" href="/avec">Idées par ingrédient</a>
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
      <div className="in">
        <span>fricette · fait avec amour et des restes</span>
        <span className="foot-links">
          <a href="/avec">Idées par ingrédient</a>
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
