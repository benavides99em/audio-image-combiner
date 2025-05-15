import { writeFile, readFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath);

export default async function handler(req, res) {
  try {
    const { imageUrl, audioBase64 } = req.body;

    if (!imageUrl || !audioBase64) {
      return res.status(400).json({ error: "Missing imageUrl or audioBase64" });
    }

    const tempDir = tmpdir();
    const imagePath = path.join(tempDir, 'image.png');
    const audioPath = path.join(tempDir, 'audio.mp3');
    const videoPath = path.join(tempDir, 'video.mp4');

    // Descargar imagen
    const response = await fetch(imageUrl);
    const imageStream = createWriteStream(imagePath);
    await pipeline(response.body, imageStream);

    // Guardar audio base64
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    await writeFile(audioPath, audioBuffer);

    // Generar video
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .loop(5)
        .input(audioPath)
        .audioCodec('aac')
        .videoCodec('libx264')
        .outputOptions('-shortest')
        .output(videoPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const videoBuffer = await readFile(videoPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(videoBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
