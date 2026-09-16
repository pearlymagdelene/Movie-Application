const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    poster: { type: String, required: true },
    rating: { type: String, required: true },
    reviews: [{
        author: { type: String, trim: true, default: 'Anonymous' },
        text: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
