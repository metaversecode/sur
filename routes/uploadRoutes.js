const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { db, rtdb, initialized } = require('../config/firebase');

// Multer: memory storage — files stay in RAM for processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file (before compression)
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed'));
    }
  },
});

/**
 * Resize an image buffer and return a base64 data URL.
 * @param {Buffer} buffer  — raw image bytes from multer
 * @param {number} maxDim  — max width/height in pixels
 * @param {number} quality — JPEG quality 1-100
 */
async function toBase64(buffer, maxDim = 800, quality = 75) {
  const compressed = await sharp(buffer)
    .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();

  return `data:image/jpeg;base64,${compressed.toString('base64')}`;
}

// ── Render upload page ────────────────────────────────────
router.get('/upload', (req, res) => {
  res.render('upload', { error: null, success: null });
});

// ── Handle upload ─────────────────────────────────────────
router.post('/upload', upload.array('photos', 10), async (req, res) => {
  if (!initialized || !db || !rtdb) {
    return res.render('upload', {
      error: 'Database not connected. Please configure Firebase credentials in .env',
      success: null,
    });
  }

  try {
    const { name, instagramId } = req.body;

    if (!name || !name.trim()) {
      return res.render('upload', { error: 'Name is required', success: null });
    }

    if (!req.files || req.files.length === 0) {
      return res.render('upload', { error: 'At least one photo is required', success: null });
    }

    // ── Step 1: Process images ────────────────────────────
    // Create a small thumbnail for Firestore (search card preview)
    const thumbnail = await toBase64(req.files[0].buffer, 300, 60);

    // Create full-size versions for RTDB
    const fullPhotos = [];
    for (const file of req.files) {
      const b64 = await toBase64(file.buffer, 800, 75);
      fullPhotos.push(b64);
    }

    // ── Step 2: Save metadata + thumbnail to Firestore ────
    const personData = {
      name: name.trim(),
      nameLower: name.trim().toLowerCase(),
      instagramId: instagramId?.trim() || '',
      thumbnail,                        // small preview for search cards
      photoCount: fullPhotos.length,
      createdAt: new Date(),
    };

    const docRef = await db.collection('persons').add(personData);

    // ── Step 3: Save full photos to Realtime Database ─────
    await rtdb.ref(`photos/${docRef.id}`).set(fullPhotos);

    // ── Step 4: Update stats in RTDB ──────────────────────
    const totalRef = rtdb.ref('stats/totalRecords');
    await totalRef.transaction((current) => (current || 0) + 1);

    // Log recent upload
    await rtdb.ref('recentUploads').push({
      personId: docRef.id,
      name: name.trim(),
      photoCount: fullPhotos.length,
      uploadedAt: Date.now(),
    });

    res.render('upload', {
      error: null,
      success: `Record for "${name.trim()}" uploaded successfully with ${fullPhotos.length} photo(s)!`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.render('upload', {
      error: 'An error occurred during upload. Please try again.',
      success: null,
    });
  }
});

module.exports = router;
