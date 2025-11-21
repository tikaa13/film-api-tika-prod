require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const DB_SOURCE = process.env.DB_SOURCE;

const db = new sqlite3.Database(DB_SOURCE, (err) => {
  if (err) {
    console.error(err.message);
    throw err;
  } else {
    console.log('Terhubung ke basis data SQLite.');

    // Membuat tabel movies
    db.run(
      `CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        director TEXT NOT NULL,
        year INTEGER NOT NULL
      )`,
      (err) => {
        if (!err) {
          // Menambahkan data awal
          const insert = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
          db.run(insert, ["Parasite", "Bong Joon-ho", 2019]);
          db.run(insert, ["The Dark Knight", "Christopher Nolan", 2008]);
        }
      }
    );

    // Membuat tabel users (dengan kolom role)
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      )`,
      (err) => {
        if (err) {
          console.error("Gagal membuat tabel users:", err.message);
        } else {
          console.log("Tabel users siap digunakan (dengan kolom role).");
          // Kita tidak akan menambah data awal admin di sini
          // Kita akan membuatnya melalui endpoint khusus
        }
      }
    );

    // Membuat tabel directors
    db.run(
      `CREATE TABLE IF NOT EXISTS directors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        birthYear INTEGER
      )`,
      (err) => {
        if (!err) {
          // Menambahkan data awal
          const insert = 'INSERT INTO directors (name, birthYear) VALUES (?,?)';
          db.run(insert, ["Tika", 2006]);
          db.run(insert, ["Royyan", 2004]);
        }
      }
    );
  }
});

module.exports = db;
