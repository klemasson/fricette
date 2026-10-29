// Carte de recette qui mène à sa page (pages statiques).
import { artSvg } from "@/lib/art";

export default function LinkCard({ r }) {
  return (
    <a className="card link-card" href={`/recette/${r.id}`}>
      <div className="art">
        {r.photo
          ? <img src={r.photo} alt="" loading="lazy" width="640" height="448" />
          : <div className="fill" dangerouslySetInnerHTML={{ __html: artSvg(r.titre, []) }} />}
      </div>
      <div className="txt">
        <h3>{r.titre}</h3>
        <div className="meta">{[`${r.temps} min`, r.difficulte, `${r.portions} pers.`].join(" · ")}</div>
      </div>
    </a>
  );
}
