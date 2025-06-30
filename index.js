const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

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
    const pngBuffer = await sharp(req.file.buffer).png().toBuffer();
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', 'attachment; filename=converted.png');
    res.send(pngBuffer);
  } catch (err) {
    console.error('Sharp hatası:', err);
    res.status(500).json({ success: false, message: 'Dönüştürme sırasında hata oluştu.', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Convertor API çalışıyor: http://localhost:${port}`);
}); 