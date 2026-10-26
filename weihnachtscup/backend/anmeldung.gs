/**
 * Weihnachts-Cup 2026 – Anmelde-Backend
 * Villa Lampe × 1. SC 1911 Heiligenstadt
 *
 * Speichert Anmeldungen in dieser Google-Tabelle und liefert der
 * Anmeldeseite die freien Plätze. Einrichtung: siehe EINRICHTUNG.md
 */

// ---------- Einstellungen ----------
const MAX_TEAMS        = 30;      // danach geht es auf die Warteliste
const ANMELDUNG_OFFEN  = true;    // false = Formular geschlossen
const ANMELDESCHLUSS   = '';      // z. B. '2026-12-17T23:59' – leer = kein Schluss
const BENACHRICHTIGUNG = true;    // Mail an Dich bei jeder An-/Abmeldung
const BLATT            = 'Anmeldungen';

const SPALTEN = ['Zeitpunkt', 'Code', 'Status', 'Teamname', 'Spieler 1', 'Alter 1',
                 'Spieler 2', 'Alter 2', 'Kontakt', 'Eltern einverstanden', 'Bemerkung'];
const S = { ZEIT: 0, CODE: 1, STATUS: 2, TEAM: 3, P1: 4, A1: 5, P2: 6, A2: 7, KONTAKT: 8, ELTERN: 9, BEM: 10 };
const ANGEMELDET = 'angemeldet', WARTELISTE = 'Warteliste', ABGEMELDET = 'abgemeldet';

// ---------- Einmal ausführen: Tabelle vorbereiten ----------
function einrichten() {
  const sh = blatt_();
  sh.getRange(1, 1, 1, SPALTEN.length).setValues([SPALTEN]).setFontWeight('bold')
    .setBackground('#282562').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  // Als Text speichern, damit z. B. 0151… nicht zur Zahl wird
  ['B:E', 'G:G', 'I:K'].forEach(r => sh.getRange(r).setNumberFormat('@'));
  sh.getRange('B:B').setFontFamily('Roboto Mono');
  sh.autoResizeColumns(1, SPALTEN.length);
}

// ---------- GET: Status für die Seite ----------
function doGet(e) {
  return json_(status_());
}

// ---------- POST: anmelden / abmelden ----------
function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, fehler: 'Ungültige Anfrage.' }); }

  // Spam-Falle: echtes Formular lässt dieses Feld leer
  if (d.website) return json_({ ok: true, code: 'XC-0000', status: ANGEMELDET });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return json_({ ok: false, fehler: 'Gerade viel los – bitte gleich nochmal versuchen.' });
  try {
    if (d.aktion === 'abmelden') return json_(abmelden_(d));
    return json_(anmelden_(d));
  } finally {
    lock.releaseLock();
  }
}

function anmelden_(d) {
  if (!offen_()) return { ok: false, fehler: 'Die Anmeldung ist geschlossen.' };

  const t = {
    team:    text_(d.team, 2, 30),
    p1:      text_(d.p1, 2, 40),
    p2:      text_(d.p2, 2, 40),
    a1:      alter_(d.a1),
    a2:      alter_(d.a2),
    kontakt: text_(d.kontakt, 5, 80),
  };
  if (Object.values(t).some(v => v === null)) return { ok: false, fehler: 'Bitte alle Felder korrekt ausfüllen.' };
  if (d.datenschutz !== true) return { ok: false, fehler: 'Bitte dem Datenschutzhinweis zustimmen.' };
  const unter16 = t.a1 < 16 || t.a2 < 16;
  if (unter16 && d.eltern !== true) return { ok: false, fehler: 'Unter 16 brauchen wir das Einverständnis der Eltern.' };

  const sh = blatt_();
  if (sh.getLastRow() === 0) einrichten();
  const zeilen = daten_(sh);
  const aktiv = zeilen.filter(z => z[S.STATUS] !== ABGEMELDET);
  const name = t.team.toLowerCase();
  if (aktiv.some(z => String(z[S.TEAM]).toLowerCase() === name)) {
    return { ok: false, fehler: 'Diesen Teamnamen gibt es schon – nehmt bitte einen anderen.' };
  }

  const belegt = aktiv.filter(z => z[S.STATUS] === ANGEMELDET).length;
  const status = belegt < MAX_TEAMS ? ANGEMELDET : WARTELISTE;
  const vorhanden = new Set(zeilen.map(z => z[S.CODE]));
  let code; do { code = neuerCode_(); } while (vorhanden.has(code));

  // Führendes ' verhindert, dass Tabellen Eingaben als Formel ausführen
  const sicher = v => (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v;
  sh.appendRow([new Date(), code, status, sicher(t.team), sicher(t.p1), t.a1, sicher(t.p2), t.a2,
                sicher(t.kontakt), unter16 ? 'ja' : 'nicht nötig', '']);

  mail_(`Neue Anmeldung: ${t.team} (${status})`,
        `Team: ${t.team}\nSpieler: ${t.p1} (${t.a1}) & ${t.p2} (${t.a2})\nKontakt: ${t.kontakt}\nCode: ${code}\nStatus: ${status}\n\nBelegt: ${belegt + (status === ANGEMELDET ? 1 : 0)} von ${MAX_TEAMS}`);

  return { ok: true, code, status, team: t.team, ...status_() };
}

function abmelden_(d) {
  const code = String(d.code || '').trim().toUpperCase();
  const norm = v => String(v || '').replace(/^'/, '').replace(/\s+/g, '').toLowerCase();
  const kontakt = norm(d.kontakt);
  const sh = blatt_(), zeilen = daten_(sh);
  const i = zeilen.findIndex(z => z[S.CODE] === code && z[S.STATUS] !== ABGEMELDET);
  if (i < 0 || !kontakt || norm(zeilen[i][S.KONTAKT]) !== kontakt) {
    return { ok: false, fehler: 'Code und Kontakt passen nicht zusammen.' };
  }
  const warAngemeldet = zeilen[i][S.STATUS] === ANGEMELDET;
  sh.getRange(i + 2, S.STATUS + 1).setValue(ABGEMELDET);
  sh.getRange(i + 2, S.BEM + 1).setValue('selbst abgemeldet ' + Utilities.formatDate(new Date(), 'Europe/Berlin', 'dd.MM. HH:mm'));
  let nachgerueckt = '';

  // Erstes Team der Warteliste rückt nach
  if (warAngemeldet) {
    const w = zeilen.findIndex(z => z[S.STATUS] === WARTELISTE);
    if (w >= 0) {
      sh.getRange(w + 2, S.STATUS + 1).setValue(ANGEMELDET);
      sh.getRange(w + 2, S.BEM + 1).setValue('von Warteliste nachgerückt');
      nachgerueckt = `\n\nNachgerückt: ${zeilen[w][S.TEAM]} – Kontakt: ${zeilen[w][S.KONTAKT]} (bitte Bescheid geben!)`;
    }
  }
  mail_(`Abmeldung: ${zeilen[i][S.TEAM]}`, `Team ${zeilen[i][S.TEAM]} (${code}) hat sich abgemeldet.${nachgerueckt}`);
  return { ok: true, abgemeldet: true, ...status_() };
}

// ---------- Hilfsfunktionen ----------
function status_() {
  const zeilen = daten_(blatt_());
  const angemeldet = zeilen.filter(z => z[S.STATUS] === ANGEMELDET);
  return {
    ok: true,
    offen: offen_(),
    max: MAX_TEAMS,
    belegt: angemeldet.length,
    warteliste: zeilen.filter(z => z[S.STATUS] === WARTELISTE).length,
    teams: angemeldet.map(z => String(z[S.TEAM]).replace(/^'/, '')),
  };
}

function offen_() {
  if (!ANMELDUNG_OFFEN) return false;
  if (ANMELDESCHLUSS && new Date() > new Date(ANMELDESCHLUSS)) return false;
  return true;
}

function blatt_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(BLATT) || ss.insertSheet(BLATT);
}

function daten_(sh) {
  const n = sh.getLastRow() - 1;
  return n > 0 ? sh.getRange(2, 1, n, SPALTEN.length).getValues() : [];
}

function text_(v, min, max) {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  return s.length >= min && s.length <= max ? s : null;
}

function alter_(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 6 && n <= 99 ? n : null;
}

function neuerCode_() {
  const z = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 0/O, 1/I
  let c = 'XC-';
  for (let i = 0; i < 4; i++) c += z[Math.floor(Math.random() * z.length)];
  return c;
}

function mail_(betreff, text) {
  if (!BENACHRICHTIGUNG) return;
  try { MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '[Weihnachts-Cup] ' + betreff, text); } catch (err) {}
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
