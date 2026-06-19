const { GoogleGenAI } = require('@google/genai');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- CONTEXT INJECTION: Laad de voetbaltheorie in bij het opstarten ---
let voetbalKennis = "";
try {
    const theoriePath = path.join(__dirname, 'voetbaltheorie.txt');
    if (fs.existsSync(theoriePath)) {
        voetbalKennis = fs.readFileSync(theoriePath, 'utf8');
        console.log("⚽ Tactische database (voetbaltheorie.txt) succesvol ingeladen!");
    } else {
        console.warn("⚠️ Waarschuwing: voetbaltheorie.txt niet gevonden in backend/services/. Maak dit bestand aan voor betere analyses.");
    }
} catch (err) {
    console.error("Fout bij het laden van voetbaltheorie.txt:", err);
}

async function analyzeVideo(videoBuffer, mimeType, startTime, endTime, focus = 'algemeen') {
    const videoBase64 = videoBuffer.toString("base64");

    const focusPrompts = {
        algemeen: "Identificeer zowel AANVALLENDE aspecten (balbezit, positiespel) als VERDEDIGENDE aspecten (restverdediging, compactheid).",
        drukzetten: "Focus specifiek op het DRUKZETTEN. Let op de momenten van jagen, het sluiten van de passlijnen en de onderlinge afstanden bij balverlies.",
        omschakeling: "Focus specifiek op de OMSCHAKELING. Let op hoe snel het team omschakelt van verdediging naar aanval (en andersom).",
        positionering: "Focus specifiek op de INDIVIDUELE POSITIONERING. Let op de veldbezetting en het vrijlopen tussen de linies."
    };

    const prompt = `
    Je bent een professionele voetbalanalist op UEFA Pro niveau. Analyseer de geüploade videoclip volgens professionele standaarden.
    Analyseer UITSLUITEND het fragment van de video dat begint op seconde ${startTime} en eindigt op seconde ${endTime}.
    TACTISCHE FOCUS: ${focusPrompts[focus]}
    
    ${voetbalKennis ? `GEBRUIK DE VOLGENDE TACTISCHE RICHTLIJNEN EN SPELPRINCIPES ALS LEIDRAAD VOOR JE ANALYSE:\n${voetbalKennis}\n` : ''}
    
    Retourneer je antwoord UITSLUITEND in een geldig JSON-object met exact deze structuur:
    {
      "summary": "Een korte, lopende tekst in verhaalvorm (maximaal 4 zinnen) die de algemene tactische rode draad van dit fragment samenvat op basis van de meegegeven spelprincipes.",
      "highlights": [
        {"timestamp": "00:12", "type": "aanvallend", "title": "Titel van het moment", "tip": "Jouw tactische tip gebaseerd op de theorie"}
      ]
    }
    `;

    async function runGemini() {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [
                { inlineData: { mimeType: mimeType, data: videoBase64 } },
                { text: prompt }
            ]
        });
        // FIX: Deze vervanging staat nu weer veilig en ononderbroken op één enkele regel code
        const rawText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(rawText);
    }

    async function runOpenAI() {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${videoBase64}` } }
                    ],
                },
            ],
        });
        return JSON.parse(response.choices[0].message.content);
    }

    console.log(`Multi-model consensus gestart voor ${startTime}s-${endTime}s...`);
    
    try {
        const [geminiResult, openaiResult] = await Promise.all([
            runGemini().catch(err => { console.error("Gemini fout:", err); return { summary: "", highlights: [] }; }),
            runOpenAI().catch(err => { console.error("OpenAI fout:", err); return { summary: "", highlights: [] }; })
        ]);

        const gecombineerdeHighlights = [...(geminiResult.highlights || []), ...(openaiResult.highlights || [])];
        const uniekeHighlights = Array.from(new Map(gecombineerdeHighlights.map(item => [item.title + item.timestamp, item])).values());
        const eindSamenvatting = openaiResult.summary || geminiResult.summary || "Er kon geen overkoepelende samenvatting worden gegenereerd.";

        return {
            summary: eindSamenvatting,
            highlights: uniekeHighlights
        };
    } catch (err) {
        console.error("Consensus systeem faal:", err);
        throw new Error('Multi-model analyse mislukt.');
    }
}

module.exports = { analyzeVideo };