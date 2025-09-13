const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/songs/'); // ఇక్కడ మార్పు
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// అన్ని పాటలను పొందడానికి
router.get('/', async (req, res) => {
  try {
    const songs = await Song.find().sort({ order: 1, title: 1 });
    const singers = await Song.distinct('singer');
    const songsWithFullUrl = songs.map(song => ({
      ...song._doc,
      audio_url: `http://localhost:5000/${song.audio_url}`
    }));
    res.json({ songs: songsWithFullUrl, singers: singers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// తాజా పాటను పొందడానికి
router.get('/latest', async (req, res) => {
  try {
    const latestSong = await Song.findOne().sort({ createdAt: -1 });
    if (latestSong) {
      const songWithFullUrl = {
        ...latestSong._doc,
        audio_url: `http://localhost:5000/${latestSong.audio_url}`
      };
      res.json(songWithFullUrl);
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// కొత్త పాటను జోడించడానికి
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const song = new Song({
      title: req.body.title,
      lyrics: req.body.lyrics,
      audio_url: req.file.path,
      singer: req.body.singer,
      category: req.body.category,
      order: req.body.order,
    });
    const newSong = await song.save();
    res.status(201).json(newSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;