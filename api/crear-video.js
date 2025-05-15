import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Solo se permite POST" });
  }

  const { imageUrl, audioBase64 } = req.body;

  if (!imageUrl || !audioBase64) {
    return res.status(400).json({ error: "Faltan datos: imageUrl o audioBase64" });
  }

  const imgPath = "/tmp/image.png";
  const audioPath = "/tmp/audio.mp3";
  const outputPath = "/tmp/video.mp4";

  try {
    // Descargar imagen desde URL
    const imageBuffer = await fetch(imageUrl).then(res => res.arrayBuffer());
    await fs.writeFile(imgPath, Buffer.from(imageBuffer));

    // Guardar audio base64
    const audioBuffer = Buffer.from(audioBase64, "base64");
    await fs.writeFile(audioPath, audioBuffer);

    // Comando para combinar usando ffmpeg
    const command = `ffmpeg -loop 1 -y -i ${imgPath} -i ${audioPath} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p ${outputPath}`;

    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) return reject(stderr);
        resolve(stdout);
      });
    });

    // Leer video generado
    const videoBuffer = await fs.readFile(outputPath);
    res.setHeader("Content-Type", "video/mp4");
    return res.send(videoBuffer);
  } catch (err) {
    console.error("❌ Error en crear-video:", err);
    return res.status(500).json({ error: "Error al generar video", detalle: err.toString() });
  }
}
