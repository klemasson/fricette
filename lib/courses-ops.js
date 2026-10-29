// Opérations sur une liste de courses, utilisées à l'identique sur l'appareil et sur le serveur
// (liste partagée) : deux personnes peuvent cocher en même temps sans s'écraser.
const str = (v, n) => String(v ?? "").slice(0, n);

export function cleanItem(x) {
  if (!x || typeof x !== "object" || !x.key || !x.nom) return null;
  return { key: str(x.key, 120), nom: str(x.nom, 80), quantite: str(x.quantite, 40), recette: str(x.recette, 120), recetteId: str(x.recetteId, 80), done: !!x.done };
}

export function applyOp(list, op) {
  const items = Array.isArray(list) ? list : [];
  switch (op?.op) {
    case "add": {
      const next = [...items];
      for (const raw of (op.items || []).slice(0, 100)) {
        const it = cleanItem(raw);
        if (it && !next.some((x) => x.key === it.key)) next.push(it);
      }
      return next.slice(0, 300);
    }
    case "toggle": return items.map((x) => (x.key === op.key ? { ...x, done: !!op.done } : x));
    case "remove": return items.filter((x) => x.key !== op.key);
    case "clearDone": return items.filter((x) => !x.done);
    case "clear": return [];
    default: return items;
  }
}
