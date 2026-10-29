// Mini-Markdown sûr pour les pages éditables : ## titres, ### sous-titres, listes « - », **gras**,
// *italique*, [liens](https://…). Tout le reste est affiché comme du texte (aucun HTML permis).
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/)[^)\s]+)\)/g, (_, t, u) => `<a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}>${t}</a>`);
}

/** Markdown -> HTML, découpé en sections à chaque titre ## (pour garder la mise en page). */
export function renderMarkdown(md) {
  const blocks = String(md || "").replace(/\r/g, "").split(/\n{2,}/);
  let html = "", open = false;
  for (const raw of blocks) {
    const lines = raw.split("\n");
    let buf = [], list = [];
    const flushP = () => { if (buf.length) { html += `<p>${buf.map(inline).join("<br>")}</p>`; buf = []; } };
    const flushL = () => { if (list.length) { html += `<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`; list = []; } };
    for (const line of lines) {
      const l = line.trimEnd();
      if (!l.trim()) continue;
      if (l.startsWith("## ")) { flushP(); flushL(); if (open) html += "</section>"; html += `<section><h2>${inline(l.slice(3))}</h2>`; open = true; continue; }
      if (l.startsWith("### ")) { flushP(); flushL(); html += `<h3>${inline(l.slice(4))}</h3>`; continue; }
      if (/^[-*] /.test(l)) { flushP(); list.push(l.slice(2)); continue; }
      flushL(); buf.push(l);
    }
    flushP(); flushL();
  }
  if (open) html += "</section>";
  return html;
}
