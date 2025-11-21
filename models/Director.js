const mongoose = require('mongoose');

const directorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama sutradara wajib diisi']
  },
  birthYear: {
    type: Number,
    required: [true, 'Tahun lahir wajib diisi']
  }
}, {
  timestamps: true 
});

const Director = mongoose.model('Director', directorSchema);

module.exports = Director;
