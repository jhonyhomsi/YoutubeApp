const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json());
const path = require('path');

const staticDirectory = path.join(__dirname, 'data');
app.use('/data', express.static(staticDirectory));

const staticDirectory1 = path.join(__dirname, 'videos');
app.use('/videos', express.static(staticDirectory1));

app.post('/download', async (req, res) => {
  try {
    const { videoUrl, format: desiredFormat } = req.body;
    console.log(videoUrl);
    if (!videoUrl) {
      res.status(400).json({ error: 'Video URL is required' });
      return;
    }

    const info = await ytdl.getInfo(videoUrl);
    const format = ytdl.chooseFormat(info.formats, { quality: desiredFormat || 'highest', filter: 'audioandvideo' });

    if (!format) {
      res.status(400).json({ error: 'No available formats for the provided video URL' });
      return;
    }

    const fileExtension = format.container;
    const fileName = `video.${fileExtension}`;
    const filePath = `./videos/${fileName}`;

    const videoStream = ytdl(videoUrl, { format });
    const writeStream = fs.createWriteStream(filePath);

    let downloadedBytes = 0;
    const totalBytes = parseInt(format.contentLength);

    videoStream.on('progress', (chunkLength, downloaded, total) => {
      const percentage = Math.round((downloaded / total) * 100);
      if (percentage % 10 === 0 && percentage !== 100) {
        console.log(`Downloaded ${percentage}%`);

        // Emit progress to client using WebSocket
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ percentage }));
          }
        });
      }
      downloadedBytes += chunkLength;
    });

    videoStream.pipe(writeStream);

    writeStream.on('finish', () => {
      const fileUrl = `${req.protocol}://${req.get('host')}/videos/${fileName}`;
      res.status(200).json({ filePath: fileUrl });
    });

    writeStream.on('error', (error) => {
      console.error(error);
      res.status(500).json({ error: 'Failed to download the video' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download the video' });
  }
});

app.post('/formats', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      res.status(400).json({ error: 'Video URL is required' });
      return;
    }

    const info = await ytdl.getInfo(videoUrl);
    const formats = info.formats.map((format) => ({
      quality: format.qualityLabel,
      container: format.container,
      codecs: format.codecs,
    }));

    res.status(200).json({ formats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get the available formats' });
  }
});

const port = 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('Received message:', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});