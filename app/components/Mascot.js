// Le frigo-tomate de l'en-tête : il ouvre sa porte à l'arrivée et les ingrédients s'envolent autour,
// sans jamais bloquer la page (simple animation CSS, figée si « réduire les animations »).

const ITEMS = [
  // [couleur, forme, x, y, rotation, délai]
  ["#f2552c", "circle", -150, -170, -20, 0],
  ["#3aa864", "pill", 140, -190, 35, 0.05],
  ["#f5c518", "egg", -60, -250, 10, 0.1],
  ["#b9c8f5", "cube", 90, -260, -25, 0.12],
  ["#f39233", "tri", -190, -60, 15, 0.08],
  ["#4b74e6", "fish", 190, -70, -10, 0.15],
  ["#f59ab8", "half", 20, -300, 0, 0.18],
];

function Shape({ c, k }) {
  switch (k) {
    case "circle": return <svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="15" fill={c} /><path d="M20 8 C 16 3, 11 5, 10 8 C 14 9, 17 9, 20 8 Z M20 8 C 24 3, 29 5, 30 8 C 26 9, 23 9, 20 8 Z" fill="#3aa864" /></svg>;
    case "pill": return <svg viewBox="0 0 40 40"><rect x="4" y="14" width="32" height="12" rx="6" fill={c} /></svg>;
    case "egg": return <svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="15" ry="13" fill="#fff" stroke="#e7e6e1" /><circle cx="20" cy="21" r="6" fill={c} /></svg>;
    case "cube": return <svg viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="24" rx="5" fill={c} /></svg>;
    case "tri": return <svg viewBox="0 0 40 40"><path d="M20 4 L34 34 L6 34 Z" fill={c} /></svg>;
    case "fish": return <svg viewBox="0 0 40 40"><path d="M6 20 Q 18 6 30 20 Q 18 34 6 20 Z M30 20 L37 13 L37 27 Z" fill={c} /></svg>;
    default: return <svg viewBox="0 0 40 40"><path d="M6 24 A 14 14 0 0 1 34 24 Z" fill={c} /></svg>;
  }
}

export default function Mascot() {
  return (
    <div className="mascot" aria-hidden="true">
      <div className="intro-stage">
        <div className="intro-fridge">
          <div className="intro-inside">
            <span className="intro-light" />
            <span className="intro-shelf s1" /><span className="intro-shelf s2" />
          </div>
          <div className="intro-door">
            <span className="intro-handle h1" /><span className="intro-handle h2" />
            <span className="intro-line" />
            <span className="intro-face"><i /><i /><b /></span>
          </div>
          <span className="intro-leaf l1" /><span className="intro-leaf l2" /><span className="intro-stem" />
        </div>
        {ITEMS.map(([c, k, x, y, r, d], i) => (
          <span key={i} className="intro-item" style={{ "--x": `${x}px`, "--y": `${y}px`, "--r": `${r}deg`, "--d": `${d}s`, "--i": i }}><Shape c={c} k={k} /></span>
        ))}
      </div>
    </div>
  );
}
