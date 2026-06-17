const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function analyzeVideo(videoBuffer, mimeType, startTime, endTime, maxRetries = 3) {
    const videoBase64 = videoBuffer.toString("base64");

    const prompt = `
    Je bent een professionele voetbalanalist. Analyseer de geüploade videoclip.
    
    BELANGRIJKE INSTRUCTIE: Analyseer UITSLUITEND het fragment van de video dat begint op seconde ${startTime} en eindigt op seconde ${endTime}. Negeren alle acties en frames buiten dit specifieke tijdsbestek.
    
    Identificeer zowel AANVALLENDE aspecten (balbezit, positiespel, kansen creëren) als VERDEDIGENDE aspecten (restverdediging, druk op de bal, compactheid) in dit fragment.
    
    Retourneer je antwoord UITSLUITEND in een geldig JSON-array van objecten. Elk object moet de volgende keys hebben:
    - "timestamp": Het exacte tijdstip in de video (bijv. "00:12") waarop de actie plaatsvindt.
    - "type": Het type van de situatie. Dit MAG ALLEEN "aanvallend" OF "verdedigend" zijn.
    - "title": Korte titel van het moment (bijv. "Kansrijke omschakeling", "Slechte restverdediging").
    - "tip": Concrete tactische aanwijzing voor de speler/het team gebaseerd op dit fragment.
    `;

    for (let poging = 1; poging <= maxRetries; poging++) {
        try {
            console.log(`Verzoek naar AI sturen voor fragment ${startTime}s-${endTime}s... (Poging ${poging}/${maxRetries})`);
            
            // GEÜPDATE NAAR GEMINI 3.5 FLASH
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: videoBase64
                        }
                    },
                    { text: prompt }
                ]
            });

            const rawText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(rawText);

        } catch (error) {
            if (error.status === 503 || (error.message && error.message.includes('503'))) {
                console.warn(`⚠️ Servers druk. Poging ${poging} mislukt.`);
                if (poging === maxRetries) {
                    throw new Error('AI-servers overbelast. Probeer het zo opnieuw.');
                }
                await delay(poging * 2000);
            } else {
                throw error;
            }
        }
    }
}

module.exports = { analyzeVideo };