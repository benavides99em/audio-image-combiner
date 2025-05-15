import { execSync } from "child_process"
import fs from "fs"
import axios from "axios"

export default async function handler(req, res) {
  const { imageUrl, audioBase64 } = req.body

  if (!imageUrl || !audioBase64) {
    return res.status(400).json({ error: "Faltan datos" })
  }

  try {
    const imagePath = "/tmp/image.png"
    const audioPath = "/tmp/audio.mp3"
    const videoPath = "/tmp/video.mp4"

    const img = await axios.get(imageUrl, { responseType: "arraybuffer" })
    fs.writeFileSync(imagePath, img.data)
    fs.writeFileSync(audioPath, Buffer.from(audioBase64, "base64"))

    execSync(
      `ffmpeg -loop 1 -i ${imagePath} -i ${audioPath} -c:v libx264 -tune stillimage -c:a aac -b:a 192k -shortest -pix_fmt yuv420p ${videoPath}`
    )

    const videoBuffer = fs.readFileSync(videoPath)
    res.setHeader("Content-Type", "video/mp4")
    res.send(videoBuffer)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Error al generar el video" })
  }
}
