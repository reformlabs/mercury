const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 3000;

app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/convert', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Dosya yüklenmedi.' });
  }
  console.log('Yüklenen dosya tipi:', req.file.mimetype);
  console.log('Yüklenen dosya boyutu:', req.file.size);
  try {
    const allowedExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
    const fileName = req.file.originalname.toLowerCase();
    const isImageMime = req.file.mimetype.startsWith('image/');
    const isImageExt = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!isImageMime && !isImageExt) {
      return res.status(400).json({ success: false, message: 'Sadece görüntü dosyası yükleyin.' });
    }
    console.log('Sharp ile dönüştürülüyor...');

    const allowedFormats = ['png', 'jpg', 'jpeg', 'webp', 'tiff'];
    const format = req.body.format ? req.body.format.toLowerCase() : 'png';
    if (!allowedFormats.includes(format)) {
      return res.status(400).json({ success: false, message: 'Desteklenmeyen format. Desteklenenler: png, jpg, jpeg, webp, tiff' });
    }

    const width = req.body.width ? parseInt(req.body.width) : null;
    const height = req.body.height ? parseInt(req.body.height) : null;

    let image = sharp(req.file.buffer);
    if (width || height) {
      image = image.resize(width, height, { fit: 'inside' });
    }

    let buffer;
    switch (format) {
      case 'jpg':
      case 'jpeg':
        buffer = await image.jpeg().toBuffer();
        break;
      case 'png':
        buffer = await image.png().toBuffer();
        break;
      case 'webp':
        buffer = await image.webp().toBuffer();
        break;
      case 'tiff':
        buffer = await image.tiff().toBuffer();
        break;
      default:
        buffer = await image.png().toBuffer();
    }

    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const outputName = baseName + '.' + format;
    res.set('Content-Type', `image/${format === 'jpg' ? 'jpeg' : format}`);
    res.set('Content-Disposition', `attachment; filename="${outputName}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Sharp hatası:', err);
    res.status(500).json({ success: false, message: 'Dönüştürme sırasında hata oluştu.', error: err.message });
  }
});

app.post('/convert-video', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Video dosyası yüklenmedi.' });
  }
  console.log('Yüklenen video tipi:', req.file.mimetype);
  console.log('Yüklenen video boyutu:', req.file.size);
  
  try {
    const allowedVideoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'];
    const fileName = req.file.originalname.toLowerCase();
    const isVideoMime = req.file.mimetype.startsWith('video/');
    const isVideoExt = allowedVideoExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isVideoMime && !isVideoExt) {
      return res.status(400).json({ success: false, message: 'Sadece video dosyası yükleyin.' });
    }

    const allowedVideoFormats = ['mp3', 'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'];
    const format = req.body.format ? req.body.format.toLowerCase() : 'mp3';
    if (!allowedVideoFormats.includes(format)) {
      return res.status(400).json({ success: false, message: 'Desteklenmeyen format. Desteklenenler: mp3, mp4, avi, mov, mkv, wmv, flv, webm' });
    }

    console.log('FFmpeg ile dönüştürülüyor...');

    const inputPath = path.join(__dirname, 'temp_input_' + Date.now() + path.extname(fileName));
    const outputPath = path.join(__dirname, 'temp_output_' + Date.now() + '.' + format);

    fs.writeFileSync(inputPath, req.file.buffer);

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat(format)
        .on('end', () => {
          console.log('Video dönüştürme tamamlandı');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg hatası:', err);
          reject(err);
        })
        .save(outputPath);
    });

    const outputBuffer = fs.readFileSync(outputPath);
    
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const outputName = baseName + '.' + format;
    
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'mkv': 'video/x-matroska',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm'
    };

    res.set('Content-Type', mimeTypes[format] || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${outputName}"`);
    res.send(outputBuffer);

    setTimeout(() => {
      try {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      } catch (err) {
        console.error('Geçici dosya silme hatası:', err);
      }
    }, 1000);

  } catch (err) {
    console.error('Video dönüştürme hatası:', err);
    res.status(500).json({ success: false, message: 'Video dönüştürme sırasında hata oluştu.', error: err.message });
  }
});

app.post('/download-video', express.json(), async (req, res) => {
  const url = req.body.url;
  if (!url) {
    return res.status(400).json({ success: false, message: 'Video URL gerekli.' });
  }

  const tempDir = os.tmpdir();
  const outPath = path.join(tempDir, `downloaded_${Date.now()}.mp4`);

  const cmd = `yt-dlp -f best -o "${outPath}" "${url}"`;
  console.log('Komut:', cmd);

  exec(cmd, { timeout: 120000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('yt-dlp hata:', error, stderr);
      return res.status(500).json({ success: false, message: 'Video indirilemedi.', error: stderr || error.message });
    }
    fs.readFile(outPath, (err, data) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'İndirilen dosya okunamadı.' });
      }
      res.set('Content-Type', 'video/mp4');
      res.set('Content-Disposition', 'attachment; filename="video.mp4"');
      res.send(data);

      fs.unlink(outPath, () => {});
    });
  });
});

app.listen(port, () => {
  console.log(`Convertor API çalışıyor: http://localhost:${port}`);
  console.log('Görüntü dönüştürme: POST /convert');
  console.log('Video dönüştürme: POST /convert-video');
}); 