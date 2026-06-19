require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { analyzeVideo } = require('./services/aiService');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload-video', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Geen videobestand geüpload.' });
        }

        const { startTime, endTime, focus } = req.body;
        console.log(`Analyse aangevraagd: ${startTime}s tot ${endTime}s met focus: ${focus}`);

        const analysisResult = await analyzeVideo(req.file.buffer, req.file.mimetype, startTime, endTime, focus);
        
        res.json({ success: true, data: analysisResult });
    } catch (error) {
        console.error('Fout bij verwerken:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend draait op poort ${PORT}`));