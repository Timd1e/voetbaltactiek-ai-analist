# Multimodale AI Video-Analist

Een ontkoppelde full-stack webapplicatie die korte voetbalwedstrijd- of trainingsclips analyseert met behulp van Multimodal GenAI (Gemini 3.5 Flash) en de resultaten interactief terugkoppelt.

## Mappenstructuur
- `/backend`: Node.js/Express server voor videoverwerking en de regie over de AI-dataflow.
- `/frontend`: HTML5, CSS en Javascript dashboard met videospeler en klikbare tijdlijn.

## Lokaal opstarten

### 1. Backend configureren
1. Ga naar de backend map: `cd backend`
2. Maak een `.env` bestand aan met daarin je `GEMINI_API_KEY`.
3. Installeer de packages: `npm install`
4. Start de server: `npm start` (draait standaard op `http://localhost:3000`)

### 2. Frontend starten
1. Open het bestand `frontend/index.html` direct in je browser (bijvoorbeeld via Live Server in VS Code).
2. Upload een `.mp4` bestand, klik op 'Analyseer' en wacht op het resultaat.