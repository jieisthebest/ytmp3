const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('@distube/ytdl-core');
const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg'; 
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Download convert endpoint
app.post('/download', (req, res) => {
    const url = req.body.url;

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
        console.error("Invalid URL provided");
        return res.status(400).send("Invalid YouTube URL. Please provide a valid one.");
    }

    try {
        // headers for MP3 download
        res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
        res.setHeader('Content-Type', 'audio/mpeg');

        // audio stream
        const audioStream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });

        audioStream.on('error', (err) => {
            console.error(`Error while fetching audio: ${err.message}`);
            res.status(500).send("Error while fetching audio. Please try again later.");
        });

        ffmpeg(audioStream)
            .audioCodec('libmp3lame')
            .format('mp3')
            .on('error', (err) => {
                console.error(`Error during conversion: ${err.message}`);
                res.status(500).end("Error during conversion. Please try again later.");
            })
            .pipe(res, { end: true });
    } catch (err) {
        console.error(`Unexpected error: ${err.message}`);
        res.status(500).send("An unexpected error occurred. Please try again.");
    }
});


app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});