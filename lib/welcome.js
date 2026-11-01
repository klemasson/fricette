// E-mail de bienvenue : texte modifiable (table kv, clé « page:email-bienvenue »), sinon texte d'origine.
import { pageGet } from "./db";
import { renderMarkdown } from "./markdown";
import { DEFAULT_WELCOME } from "@/data/email-bienvenue";

export function welcomeContent() {
  return { ...DEFAULT_WELCOME, ...(pageGet("email-bienvenue") || {}) };
}

/** Markdown -> HTML adapté aux e-mails (styles en ligne, liens absolus). */
export function welcomeHtml(texte, site) {
  return renderMarkdown(texte)
    .replace(/<\/?section>/g, "")
    .replace(/href="\//g, `href="${site}/`)
    .replace(/<h2>/g, '<h2 style="font-size:22px;margin:22px 0 6px">')
    .replace(/<h3>/g, '<h3 style="font-size:17px;margin:20px 0 4px;color:#16181d">')
    .replace(/<p>/g, '<p style="margin:0 0 12px">')
    .replace(/<a /g, '<a style="color:#f2552c;font-weight:bold" ');
}
