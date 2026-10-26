# Anmeldung freischalten (ca. 5 Minuten)

Die Anmeldungen landen in einer Google-Tabelle in Deinem Google-Konto. Die Seite spricht über ein kleines Skript mit dieser Tabelle.

## 1. Tabelle anlegen
1. Auf [sheets.new](https://sheets.new) eine neue Tabelle anlegen, z. B. „Weihnachts-Cup 2026 – Anmeldungen“.
2. Menü **Erweiterungen → Apps Script** öffnen.

## 2. Skript einfügen
1. Den kompletten Inhalt von `anmeldung.gs` in den Editor kopieren (vorhandenen Code ersetzen) und speichern.
2. Oben in der Funktionsauswahl **`einrichten`** wählen und auf **Ausführen** klicken.
3. Google fragt nach Berechtigungen. Bestätigen („Erweitert → Zu … wechseln (unsicher)“ ist normal bei eigenen Skripten).
   → In der Tabelle gibt es jetzt das Blatt **Anmeldungen** mit Überschriften.

## 3. Als Web-App veröffentlichen
1. **Bereitstellen → Neue Bereitstellung**, Typ: **Web-App**.
2. *Ausführen als:* **Ich** · *Zugriff:* **Jeder**
3. **Bereitstellen** und die **Web-App-URL** kopieren (endet auf `/exec`).

## 4. URL in die Seite eintragen
In `weihnachtscup/index.html` ganz unten:

```js
const CONFIG = {
  api: 'https://script.google.com/macros/s/…/exec',   // ← hier einfügen
  datum: '',                                           // ← z. B. 'Samstag, 19.12.2026'
  …
```

Oder schick mir einfach die URL (und später das Datum), dann trage ich es ein.

## Einstellungen im Skript
Oben in `anmeldung.gs`:

| Einstellung | Bedeutung |
|---|---|
| `MAX_TEAMS` | Plätze, danach Warteliste (Standard 16) |
| `ANMELDUNG_OFFEN` | `false` schließt die Anmeldung sofort |
| `ANMELDESCHLUSS` | z. B. `'2026-12-17T23:59'` – danach automatisch zu |
| `BENACHRICHTIGUNG` | Mail an Dich bei jeder An- und Abmeldung |

**Wichtig:** Nach jeder Änderung am Skript unter **Bereitstellen → Bereitstellungen verwalten → Bearbeiten (Stift) → Version: Neue Version** neu bereitstellen. Die URL bleibt dabei gleich.

## Im Alltag
- Alle Anmeldungen siehst Du direkt in der Tabelle (Code, Status, Namen, Alter, Kontakt).
- Status-Spalte: `angemeldet` · `Warteliste` · `abgemeldet`. Du kannst sie auch von Hand ändern, die Seite übernimmt das.
- Meldet sich ein Team ab, rückt das erste Team der Warteliste automatisch nach. Du bekommst eine Mail mit dessen Kontakt, damit Du Bescheid geben kannst.
- Am Turniertag: Codes am Einlass mit der Tabelle abgleichen.
- Nach dem Turnier (spätestens 4 Wochen) die Tabelle löschen, so steht es im Datenschutzhinweis.
