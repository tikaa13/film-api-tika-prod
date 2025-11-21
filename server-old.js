require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const { authenticateToken, authorizeRole } = require('./middleware/auth.js');

const app = express();
const PORT = process.env.PORT || 3300;

app.use(cors());
app.use(express.json());

app.get('/status', (req, res) => {
  res.json({ ok: true, service: 'film-api' });
});

// === AUTH REGISTER USER ===
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: 'Gagal memproses pendaftaran' });

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const params = [username.toLowerCase(), hashedPassword, 'user'];

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(409).json({ error: 'Username sudah digunakan' });
        }
        return res.status(500).json({ error: 'Gagal menyimpan pengguna' });
      }

      res.status(201).json({ message: 'Registrasi berhasil', userId: this.lastID });
    });
  });
});

// === AUTH REGISTER ADMIN (khusus pengujian) ===
app.post('/auth/register-admin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: 'Gagal memproses pendaftaran admin' });

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    const params = [username.toLowerCase(), hashedPassword, 'admin'];

    db.run(sql, params, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Username admin sudah ada' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ message: 'Admin berhasil dibuat', userId: this.lastID });
    });
  });
});

// === LOGIN ROUTE ===
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password harus diisi' });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.get(sql, [username.toLowerCase()], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Kredensial tidak valid' });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ error: 'Kredensial tidak valid' });

      const payload = { user: { id: user.id, username: user.username, role: user.role } };

      jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) return res.status(500).json({ error: 'Gagal membuat token' });
        res.json({ message: 'Login berhasil', token });
      });
    });
  });
});

// === MOVIES CRUD ===
app.get('/movies', (req, res) => {
  db.all("SELECT * FROM movies ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/movies/:id', (req, res) => {
  db.get("SELECT * FROM movies WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.json(row);
  });
});

app.post('/movies', authenticateToken, (req, res) => {
  const { title, director, year } = req.body;
  if (!title || !director || !year) return res.status(400).json({ error: 'title, director, year wajib diisi' });

  const sql = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
  db.run(sql, [title, director, year], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, director, year });
  });
});

app.put('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  const { title, director, year } = req.body;
  const sql = 'UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?';
  db.run(sql, [title, director, year, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes == 0) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.json({ id: Number(req.params.id), title, director, year });
  });
});

app.delete('/movies/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  const sql = 'DELETE FROM movies WHERE id = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes == 0) return res.status(404).json({ error: 'Film tidak ditemukan' });
    res.status(204).send();
  });
});

// === DIRECTORS CRUD ===
app.get('/directors', (req, res) => {
  db.all("SELECT * FROM directors ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/directors/:id', (req, res) => {
  db.get("SELECT * FROM directors WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
    res.json(row);
  });
});

app.post('/directors', authenticateToken, (req, res) => {
  const { name, birthYear } = req.body;
  if (!name || !birthYear) return res.status(400).json({ error: 'name dan birthYear wajib diisi' });

  const sql = 'INSERT INTO directors (name, birthYear) VALUES (?, ?)';
  db.run(sql, [name, birthYear], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, name, birthYear });
  });
});

app.put('/directors/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  const { name, birthYear } = req.body;
  const sql = 'UPDATE directors SET name = ?, birthYear = ? WHERE id = ?';
  db.run(sql, [name, birthYear, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes == 0) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
    res.json({ id: Number(req.params.id), name, birthYear });
  });
});

app.delete('/directors/:id', [authenticateToken, authorizeRole('admin')], (req, res) => {
  const sql = 'DELETE FROM directors WHERE id = ?';
  db.run(sql, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes == 0) return res.status(404).json({ error: 'Sutradara tidak ditemukan' });
    res.status(204).send();
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rute tidak ditemukan' });
});

app.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
});
