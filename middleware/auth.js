const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// === Middleware Autentikasi ===
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Pastikan format "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Header otorisasi tidak valid atau token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid' });
    }

    // Simpan data user dari payload JWT
    req.user = decodedPayload.user; // berisi {id, username, role}
    next();
  });
}

// === Middleware Autorisasi ===
function authorizeRole(role) {
  return (req, res, next) => {
    // Middleware ini harus dijalankan SETELAH authenticateToken
    if (req.user && req.user.role === role) {
      next(); // peran cocok, lanjutkan
    } else {
      return res.status(403).json({ error: 'Akses Dilarang: Peran tidak memadai' });
    }
  };
}

module.exports = {
  authenticateToken,
  authorizeRole,
};
