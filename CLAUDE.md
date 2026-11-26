# Trainingskarte (iPhone-App)

## Ziel
Das Claude-Artefakt »Trainingskarte« als eigenständige App auf dem iPhone, ohne Claude-Konto:
Web-App, die man in Safari über »Zum Home-Bildschirm« installiert. Läuft offline.

## Aktueller Stand (24.11.2026)
- Fassung 1.0, auf dem Mac in iPhone-Größe geprüft (Browser auf Chrome-Basis). Auf einem echten iPhone noch nicht getestet.
- Online: https://bunsensbrenner.github.io/trainingskarte/ (GitHub Pages, Zweig main, öffentliches Projekt bunsensbrenner/trainingskarte).
- Veröffentlichen: VERSION in `sw.js` erhöhen, committen, `git push`. Das Programm gh liegt in `.werkzeug/` (nicht in Git).

## Dateien
- `index.html` Grundgerüst · `stil.css` Aussehen · `uebungen.js` Übungen, Figuren, Startpläne · `app.js` Funktionen
- `fig3d.js` 3D-Ansicht (Gliederpuppe zum Drehen), wird erst beim Antippen von »3D« geladen
- `lib/three.module.min.js` Three.js 0.170.0 (MIT, Lizenz in `lib/THREE-LICENSE.txt`), lokal gespeichert, damit nichts aus dem Internet geladen wird
- `sw.js` Offline-Teil · `manifest.webmanifest`, `icons/` für die Installation
- `Trainingskarte-Sicherung-Start.json` Daten aus dem Artefakt (persönlich, per .gitignore nicht in Git)

## Regeln
- Nach jeder Änderung die Nummer `VERSION` in `sw.js` erhöhen, sonst bekommt das Handy die neue Fassung nicht.
- Nie Sicherungsdateien oder persönliche Daten in Git aufnehmen: Der Programmcode wird öffentlich.
- Keine fremden Dienste oder Schriften: Die App darf laut Sicherheitsregel in `index.html` nur eigene Dateien laden.

## Entscheidungen
- Daten nur auf dem Gerät (localStorage, Schlüssel `tk3*`). Kein Abgleich zwischen Geräten, dafür Sicherungsdatei.
- Tauschen gilt standardmäßig nur heute (`swaps`), »Dauerhaft« ändert den Plan.
- Die getauschten Übungen in »Oberkörper« und »Ganzkörper« bleiben (so gewünscht).
- KI-Verfeinern über Kopieren und Einfügen, kein API-Schlüssel.
- Schrift: Systemschrift statt Manrope, damit nichts nachgeladen wird.
- Git-Autor ist hier neutral gesetzt, damit keine E-Mail öffentlich wird.

## Läufe aus Dateien (seit 1.1)
- Import von GPX, TCX, FIT, ZIP (Garmin »Original exportieren«) und der Garmin-Aktivitätenliste (CSV). Kein GPS in der App (Wunsch: Datei-Import statt Live-Tracking, weil der Bildschirm sonst an bleiben müsste).
- Gespeichert werden nur Datum, km, Zeit, Kilometerzeiten, Ø Puls, keine Wegpunkte.
- `testdaten/` enthält künstliche Testdateien (Berlin, keine echten Läufe). Mit echten Garmin-Dateien noch nicht geprüft; die CSV-Spaltennamen von Garmin sind geraten und werden nach Namen gesucht.

## 3D-Figuren (seit 1.2, im Aufbau)
- Die 3D-Puppe rechnet die Seitenansicht-Posen aus `uebungen.js` in den Raum um (Schulter-/Hüftbreite ergänzt). Extra-Angaben je Übung in `X3` in `fig3d.js`.
- Welche Übungen den 3D-Knopf haben, steht in `D3` in `app.js`. Stand: nur Goblet Squat (Schritt 1).
- Plan: 2) alle Übungen übernehmen und Geräte in 3D, 3) seitliche Übungen (Seitheben, Seitstütz, Butterfly, Abduktion …) von Hand in 3D, 4) kleine Figuren auf den Karten in 3D (Tempo prüfen), 5) online.

## Bekannte Grenzen
- Bei gesperrtem Handy klingelt der Timer nicht zuverlässig.
- Im Lautlos-Modus piept es nur mit der Einstellung »Auch im Lautlos-Modus« (kann Musik anhalten).
- Eigene Übungen haben keine animierte Figur.
- Profile lassen sich anlegen und umbenennen, aber nicht löschen.
