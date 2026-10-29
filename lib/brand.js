// Logo Fricette : un frigo-tomate souriant avec sa feuille, et la tomate sur le « i ».
export const ICON_SVG = (body = "#f2552c") => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path d="M50 22 C 44 8, 30 8, 26 14 C 34 17, 42 20, 50 22 Z" fill="#3aa864"/>
<path d="M50 22 C 58 6, 74 8, 78 13 C 68 17, 59 20, 50 22 Z" fill="#2f8f55"/>
<rect x="47.5" y="10" width="5" height="14" rx="2.5" fill="#2f8f55"/>
<rect x="18" y="22" width="64" height="72" rx="20" fill="${body}"/>
<rect x="18" y="47" width="64" height="4" fill="#fff" opacity=".85"/>
<rect x="68" y="30" width="5" height="11" rx="2.5" fill="#fff"/>
<rect x="68" y="57" width="5" height="16" rx="2.5" fill="#fff"/>
<circle cx="37" cy="64" r="4" fill="#fff"/><circle cx="54" cy="64" r="4" fill="#fff"/>
<path d="M35 76 Q 45.5 85 56 76" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
</svg>`;

export const TOMATO_SVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="20" cy="23" r="15" fill="#f2552c"/><path d="M20 9 C 17 4, 11 5, 10 8 C 14 9, 17 10, 20 9 Z" fill="#3aa864"/><path d="M20 9 C 23 4, 29 5, 30 8 C 26 9, 23 10, 20 9 Z" fill="#3aa864"/><rect x="19" y="3" width="2.4" height="7" rx="1.2" fill="#2f8f55"/></svg>`;
