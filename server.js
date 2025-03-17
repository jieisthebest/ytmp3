const express = require('express');
const ffmpeg =require('fluent-ffmpeg');
const ytdl = require('@distube/ytdl-core');
const ffmpegPath = process.env.FFMPEG_PATH || require('ffmpeg-static'); // Use env var or fallback
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');
console.log(ffmpeg.path); 
const app = express();
const PORT = process.env.PORT||3000;


//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.post('/download',(req,res) => {
    //Check link exists and is youtube link
    const url = req.body.url;
    const check = ytdl.validateURL(url);
    if (check!=true) {
        console.log("Invalid URL provided");
        return res.redirect('/');
    }

    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
    res.setHeader('Content-Type', 'audio/mpeg');
    
    
    const audioStream = ytdl(url,{filter:'audioonly', quality:'highestaudio'});
    
    audioStream.on('error', (err) => {
        console.error(`Error while fetching audio: ${err.message}`);
        audioStream.destroy();
        res.status(500).send("Error while fetching audio. Please try again with a valid YouTube link.");
    });
    
    ffmpeg(audioStream)
        .audioCodec('libmp3lame')
        .withOutputFormat('mp3')
        .on('error',(err) => {
            console.error(`Error while converting: ${err.message}`);
            res.status(500).send("Error while converting");
            audioStream.destroy();
        })
        .pipe(res, {end: true});
});

    
    //allow user to download the file
   

app.listen(PORT,() => {
    console.log(`server is running at http://localhost:${PORT}`)
});
