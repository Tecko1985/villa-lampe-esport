# E-Sport Heiligenstadt

Ideenpapier als Webseite: ein gemeinsames E-Sport-Angebot von **Villa Lampe** und **1. SC 1911 Heiligenstadt** für junge Menschen in Heilbad Heiligenstadt.

- Eine Datei: `index.html` (HTML, CSS und etwas JS, keine Abhängigkeiten außer Google Fonts)
- Stil angelehnt an villa-lampe.de (Rot `#d90f16`), ergänzt um die SC-Farbe Indigo `#282562`
- Bilder in `img/`: Wappen, Favicons, Link-Vorschau `og.png` (1200×630)
- Druckversion eingebaut: Button „Als PDF speichern“ bzw. Strg+P

Status: **Entwurf** – per `noindex` aus Suchmaschinen herausgehalten. Vor dem offiziellen Start die Zeile `<meta name="robots" …>` in `index.html` entfernen.

Lokal ansehen: `index.html` im Browser öffnen.

## Weihnachts-Cup 2026 (`weihnachtscup/`)

Anmeldeseite für das 2-gegen-2-Turnier in EA SPORTS FC 27.

- `weihnachtscup/index.html` – Seite mit Formular, Live-Plätzen, Teamliste, Abmeldung
- `weihnachtscup/backend/anmeldung.gs` – Google-Apps-Script, speichert in einer Google-Tabelle
- `weihnachtscup/backend/EINRICHTUNG.md` – Schritt-für-Schritt-Anleitung zum Freischalten
- `weihnachtscup/qr/` – QR-Codes für den Flyer (SVG für Druck, PNG, gebrandete Karte)
