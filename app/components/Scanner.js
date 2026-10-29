"use client";
// Scanner de codes-barres : la caméra lit le code, Open Food Facts dit quel produit c'est,
// et l'ingrédient (avec sa quantité) arrive dans le frigo. Plusieurs produits à la suite.
import { useEffect, useRef, useState } from "react";

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];

export default function Scanner({ onAdd, onRemove, onClose }) {
  const video = useRef(null);
  const stopRef = useRef(() => {});
  const last = useRef({ code: "", t: 0 });
  const [state, setState] = useState("start"); // start | live | denied | nocam
  const [items, setItems] = useState([]); // {code, status: wait|ok|unknown|missing|error, ...}
  const [manual, setManual] = useState("");

  useEffect(() => {
    let cancelled = false;
    document.body.style.overflow = "hidden";
    (async () => {
      try {
        if ("BarcodeDetector" in window && (await window.BarcodeDetector.getSupportedFormats?.())?.includes("ean_13")) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false });
          if (cancelled) return stream.getTracks().forEach((t) => t.stop());
          video.current.srcObject = stream;
          await video.current.play();
          const det = new window.BarcodeDetector({ formats: FORMATS });
          let alive = true;
          const loop = async () => {
            if (!alive) return;
            try {
              const codes = await det.detect(video.current);
              if (codes[0]?.rawValue) found(codes[0].rawValue);
            } catch {}
            setTimeout(loop, 220);
          };
          loop();
          stopRef.current = () => { alive = false; stream.getTracks().forEach((t) => t.stop()); };
        } else {
          const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
          const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]]]);
          const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
          const controls = await reader.decodeFromConstraints({ video: { facingMode: "environment" }, audio: false }, video.current, (res) => {
            if (res) found(res.getText());
          });
          if (cancelled) return controls.stop();
          stopRef.current = () => controls.stop();
        }
        if (!cancelled) setState("live");
      } catch (e) {
        if (!cancelled) setState(e?.name === "NotAllowedError" || e?.name === "SecurityError" ? "denied" : "nocam");
      }
    })();
    const key = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => {
      cancelled = true;
      stopRef.current();
      window.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function found(code) {
    const now = Date.now();
    // Même produit resté devant la caméra : on ne le compte qu'une fois. Pour en ajouter
    // un deuxième identique, il suffit de l'écarter une seconde puis de le remontrer.
    const again = code === last.current.code && now - last.current.t < 1500;
    last.current = { code, t: now };
    if (again) return;
    try { navigator.vibrate?.(60); } catch {}
    lookup(code);
  }

  async function lookup(code) {
    const id = code + ":" + Date.now();
    setItems((l) => [{ id, code, status: "wait" }, ...l]);
    const set = (patch) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      const r = await fetch(`/api/barcode?code=${code}`);
      const d = await r.json();
      if (!r.ok) return set({ status: "error", error: d.error });
      if (!d.found) return set({ status: "missing" });
      onAdd({ nom: d.nom, qte: d.qte, unite: d.unite });
      set({ status: d.known ? "ok" : "unknown", ...d });
    } catch {
      set({ status: "error", error: "Connexion perdue." });
    }
  }

  function submitManual(e) {
    e.preventDefault();
    const code = manual.replace(/\D/g, "");
    if (code.length < 8) return;
    setManual("");
    lookup(code);
  }

  function undo(x) {
    onRemove({ nom: x.nom, qte: x.qte, unite: x.unite });
    setItems((l) => l.filter((y) => y.id !== x.id));
  }

  const close = () => onClose();

  const added = items.filter((x) => x.status === "ok" || x.status === "unknown").length;

  return (
    <div className="scan" role="dialog" aria-modal="true" aria-label="Scanner des codes-barres">
      <div className="scan-top">
        <div>
          <div className="label">Scanner des produits</div>
          <strong>{added ? `${added} produit${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""} au frigo` : "Vise le code-barres d'un produit"}</strong>
        </div>
        <button type="button" className="cta small" onClick={close}>Terminé</button>
      </div>

      <div className="scan-view">
        <video ref={video} playsInline muted />
        {state === "live" && <div className="scan-frame" aria-hidden="true"><span /></div>}
        {state === "start" && <p className="scan-msg">Ouverture de la caméra…</p>}
        {state === "denied" && <p className="scan-msg">La caméra est bloquée. Autorise-la dans les réglages du navigateur, ou tape le code sous l'image.</p>}
        {state === "nocam" && <p className="scan-msg">Pas de caméra disponible. Tape le numéro du code-barres ci-dessous.</p>}
      </div>

      <form className="scan-manual" onSubmit={submitManual}>
        <input inputMode="numeric" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="ou tape les chiffres du code-barres" aria-label="Numéro du code-barres" />
        <button className="btn" type="submit">OK</button>
      </form>

      <ul className="scan-list">
        {items.map((x) => (
          <li key={x.id} className={x.status}>
            {x.status === "wait" && <span>Recherche du produit {x.code}…</span>}
            {(x.status === "ok" || x.status === "unknown") && (
              <>
                <span>
                  <span><strong>✓ {x.nom}</strong>{x.qte ? ` · ${x.qte}${x.unite === "pièce" ? "" : " " + x.unite}` : ""}</span>
                  <small>{x.product}{x.status === "unknown" ? " · pas encore dans le carnet" : ""}</small>
                </span>
                <button type="button" className="link" onClick={() => undo(x)}>Annuler</button>
              </>
            )}
            {x.status === "missing" && <span>Produit {x.code} introuvable. Ajoute-le à la main.</span>}
            {x.status === "error" && <span>{x.error}</span>}
          </li>
        ))}
      </ul>
      <p className="scan-foot">Données produits : <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">Open Food Facts</a>. Les fruits et légumes en vrac s'ajoutent à la main.</p>
    </div>
  );
}
