const express = require('express');
const router = express.Router();
const { db, rtdb, initialized } = require('../config/firebase');

// ── Search results page ───────────────────────────────────
router.get('/search', async (req, res) => {
  const query = req.query.q?.trim() || '';

  if (!query) {
    return res.redirect('/');
  }

  if (!initialized || !db) {
    return res.render('results', {
      persons: [],
      query,
      error: 'Database not connected. Please configure Firebase credentials in .env',
    });
  }

  try {
    const queryLower = query.toLowerCase();

    // Firestore prefix search on lowercased name
    const snapshot = await db
      .collection('persons')
      .where('nameLower', '>=', queryLower)
      .where('nameLower', '<=', queryLower + '\uf8ff')
      .limit(50)
      .get();

    const persons = [];
    snapshot.forEach((doc) => {
      persons.push({ id: doc.id, ...doc.data() });
    });

    // Log search count to Realtime Database
    if (rtdb) {
      const statsRef = rtdb.ref('stats/totalSearches');
      await statsRef.transaction((current) => (current || 0) + 1);
    }

    res.render('results', { persons, query, error: null });
  } catch (error) {
    console.error('Search error:', error);
    res.render('results', {
      persons: [],
      query,
      error: 'An error occurred while searching. Please try again.',
    });
  }
});

// ── Person detail page ────────────────────────────────────
router.get('/person/:id', async (req, res) => {
  if (!initialized || !db || !rtdb) {
    return res.status(503).render('index', {
      error: 'Database not connected. Please configure Firebase credentials.',
    });
  }

  try {
    // Get person metadata from Firestore
    const doc = await db.collection('persons').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).render('index', { error: 'Person not found' });
    }

    const person = { id: doc.id, ...doc.data() };

    // Get full photos from Realtime Database
    const photosSnap = await rtdb.ref(`photos/${req.params.id}`).once('value');
    person.photos = photosSnap.val() || [];

    // Increment view count in RTDB
    const viewRef = rtdb.ref(`views/${req.params.id}`);
    await viewRef.transaction((current) => (current || 0) + 1);

    res.render('person', { person });
  } catch (error) {
    console.error('Detail error:', error);
    res.status(500).render('index', { error: 'An error occurred' });
  }
});

module.exports = router;
