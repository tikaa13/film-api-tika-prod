require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Movie = require('./models/Movie');
const Director = require('./models/Director');

connectDB();

const app = express();
const PORT = process.env.PORT || 3300;

app.use(cors());
app.use(express.json());

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ==================== STATUS ====================
app.get('/status', (_req, res) => {
  res.json({ ok: true, service: 'film-api' });
});

// ==================== MOVIES ====================

// GET all movies
app.get('/movies', async (_req, res, next) => {
  try {
    const movies = await Movie.find({});
    res.json({ success: true, count: movies.length, data: movies });
  } catch (err) { next(err); }
});

// GET movie by ID
app.get('/movies/:id', async (req, res, next) => {
  const id = req.params.id;
  if (!validateObjectId(id)) return res.status(400).json({ success: false, error: 'Format ID tidak valid' });

  try {
    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ success: false, error: 'Film tidak ditemukan' });
    res.json({ success: true, data: movie });
  } catch (err) { next(err); }
});

// POST create movie
app.post('/movies', async (req, res, next) => {
  const { title, director, year } = req.body;
  if (!title || !director || !year) return res.status(400).json({ success: false, error: 'title, director, dan year wajib diisi' });

  try {
    const newMovie = new Movie({ title, director, year });
    const savedMovie = await newMovie.save();
    res.status(201).json({ success: true, data: savedMovie });
  } catch (err) { next(err); }
});

// PUT update movie
app.put('/movies/:id', async (req, res, next) => {
  const id = req.params.id;
  const { title, director, year } = req.body;
  if (!validateObjectId(id)) return res.status(400).json({ success: false, error: 'Format ID tidak valid' });
  if (!title || !director || !year) return res.status(400).json({ success: false, error: 'title, director, dan year wajib diisi' });

  try {
    const updatedMovie = await Movie.findByIdAndUpdate(id, { title, director, year }, { new: true, runValidators: true });
    if (!updatedMovie) return res.status(404).json({ success: false, error: 'Film tidak ditemukan' });
    res.json({ success: true, data: updatedMovie });
  } catch (err) { next(err); }
});

// DELETE movie
app.delete('/movies/:id', async (req, res, next) => {
  const id = req.params.id;
  if (!validateObjectId(id)) return res.status(400).json({ success: false, error: 'Format ID tidak valid' });

  try {
    const deletedMovie = await Movie.findByIdAndDelete(id);
    if (!deletedMovie) return res.status(404).json({ success: false, error: 'Film tidak ditemukan' });
    res.json({ success: true, message: 'Film berhasil dihapus', data: deletedMovie });
  } catch (err) { next(err); }
});

// ==================== DIRECTORS ====================

// GET all directors
app.get('/directors', async (_req, res, next) => {
  try {
    const directors = await Director.find({}).sort({ name: 1 });
    res.json({ success: true, count: directors.length, data: directors });
  } catch (err) { next(err); }
});

// GET director by ID
app.get('/directors/:id', async (req, res, next) => {
  const id = req.params.id;
  if (!validateObjectId(id)) return res.status(400).json({ success: false, error: 'Format ID tidak valid' });

  try {
    const director = await Director.findById(id);
    if (!director) return res.status(404).json({ success: false, error: 'Sutradara tidak ditemukan' });
    res.json({ success: true, data: director });
  } catch (err) { next(err); }
});

// POST create director
app.post('/directors', async (req, res, next) => {
  const { name, birthYear } = req.body;
  if (!name || !birthYear) return res.status(400).json({ success: false, error: 'Nama dan tahun lahir harus diisi' });

  try {
    const newDirector = new Director({ name: name.trim(), birthYear: parseInt(birthYear) });
    const savedDirector = await newDirector.save();
    res.status(201).json({ success: true, message: 'Sutradara berhasil dibuat', data: savedDirector });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, error: 'Data sutradara tidak valid', details: Object.values(err.errors).map(v => v.message) });
    next(err);
  }
});

// PUT update director
app.put('/directors/:id', async (req, res, next) => {
  const id = req.params.id;
  const { name, birthYear } = req.body;
  if (!validateObjectId(id)) return res.status(400).json({ success: false, error: 'Format ID tidak valid' });
  if (!name || !birthYear) return res.status(400).json({ success: false, error: 'Nama dan tahun lahir harus diisi' });

  try {
    const updatedDirector = await Director.findByIdAndUpdate(id, { name: name.trim(), birthYear: parseInt(birthYear) }, { new: true, runValidators: true });
    if (!updatedDirector) return res.status(404).json({ success: false, error: 'Sutradara tidak ditemukan' });
    res.json({ success: true, message: 'Sutradara berhasil diupdate', data: updatedDirector });
  } catch (err) { next(err); }
});

// DELETE director
app.delete('/directors/:id', async (req, res, next) => {
  const id = req.params.id;
  if (!validateObjectId(id)) return res.status(400).json({ success: false, error: 'Format ID tidak valid' });

  try {
    const deletedDirector = await Director.findByIdAndDelete(id);
    if (!deletedDirector) return res.status(404).json({ success: false, error: 'Sutradara tidak ditemukan' });
    res.json({ success: true, message: 'Sutradara berhasil dihapus', data: deletedDirector });
  } catch (err) { next(err); }
});

// ==================== ERROR HANDLER ====================
app.use((_req, res) => res.status(404).json({ success: false, error: 'Rute tidak ditemukan' }));
app.use((err, _req, res, _next) => { console.error(err.stack); res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server' }); });

// ==================== START SERVER ====================
app.listen(PORT, () => console.log(`Server aktif di http://localhost:${PORT}`));
