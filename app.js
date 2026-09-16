const path = require('path');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const Movie = require('./movie');

const app = express();
const port = process.env.PORT || 5050;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/moviehunter';
const templatePath = path.join(__dirname, 'index.ejs');

app.use(express.urlencoded({ extended: false }));
app.get('/sty.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'sty.css'));
});

app.get('/moviepage', async (req, res) => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const query = {};
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        const movies = await Movie.find(query).sort({ title: 1 }).lean();
        const html = await ejs.renderFile(templatePath, {
            movies,
            search,
            error: req.query.error || ''
        });
        res.send(html);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/movies', async (req, res) => {
    const { title, poster, rating, reviewAuthor, reviewText } = req.body;
    const reviews = reviewText?.trim()
        ? [{ author: reviewAuthor?.trim() || 'Anonymous', text: reviewText.trim() }]
        : [];
    try {
        await Movie.create({
            title: title?.trim(),
            poster: poster?.trim(),
            rating: rating?.trim(),
            reviews
        });
        res.redirect('/moviepage');
    } catch (error) {
        console.error('Error adding movie:', error);
        res.redirect(`/moviepage?error=${encodeURIComponent('Please provide a title, poster URL, and rating.')}`);
    }
});

app.post('/movies/:id/reviews', async (req, res) => {
    const { reviewAuthor, reviewText } = req.body;
    if (!reviewText?.trim()) {
        return res.redirect(`/moviepage?error=${encodeURIComponent('Write a review before submitting it.')}`);
    }
    try {
        await Movie.findByIdAndUpdate(req.params.id, {
            $push: { reviews: { author: reviewAuthor?.trim() || 'Anonymous', text: reviewText.trim() } }
        });
        res.redirect('/moviepage');
    } catch (error) {
        console.error('Error adding review:', error);
        res.redirect(`/moviepage?error=${encodeURIComponent('That review could not be added.')}`);
    }
});

async function startServer() {
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB at ${mongoUri}`);
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/moviepage`);
    });
}

startServer().catch((error) => {
    console.error('Unable to start the application:', error.message);
    process.exitCode = 1;
});