const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Mongoose Movie Schema
const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    votes: {
        type: Number,
        default: 0
    },
    voters: [{
        type: String
    }],
    creator: String  // New field to store the creator's ID
});

const Movie = mongoose.model('Movie', movieSchema);

// Passport setup for 42 API authentication
passport.use(new OAuth2Strategy({
    authorizationURL: 'https://api.intra.42.fr/oauth/authorize',
    tokenURL: 'https://api.intra.42.fr/oauth/token',
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/42/callback'
}, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

app.use(session({
    secret: 'Pistolas',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/auth/42', passport.authenticate('oauth2'));

app.get('/auth/42/callback', 
    passport.authenticate('oauth2', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/vote');
    }
);

app.get('/vote', async (req, res) => {
    const userId = req.user.id;

    try {
        const movies = await Movie.find({});

        let movieListHtml = movies.map(movie => {
            let deleteButton = movie.creator === userId ? `<button onclick="location.href='/delete-movie/${movie._id}'">Delete</button>` : '';
            return `
                <div>
                    ${movie.title} - Votes: ${movie.votes}
                    <button onclick="location.href='/vote/${movie._id}'">Vote</button>
                    ${deleteButton}
                </div>
            `;
        }).join('');

        let html = `
            <link rel="stylesheet" href="/styles.css">
            <div class="container">
                <h2>Vote for a Movie</h2>
                ${movieListHtml}
                <h2>Suggest a New Movie</h2>
                <form action="/add-movie" method="post">
                    <input type="text" name="movieName" placeholder="Enter movie name" required>
                    <button type="submit">Suggest</button>
                </form>
            </div>
        `;

        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching movies');
    }
});

app.get('/vote/:movieId', async (req, res) => {
    const userId = req.user.id;

    try {
        const movie = await Movie.findById(req.params.movieId);
        if (!movie) {
            return res.status(404).send('Movie not found');
        }

        if (movie.voters.includes(userId)) {
            return res.send('You have already voted for this movie.');
        }

        movie.votes += 1;
        movie.voters.push(userId);
        await movie.save();

        res.redirect('/vote');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing vote');
    }
});

app.post('/add-movie', async (req, res) => {
    const userId = req.user.id;
    const movieTitle = req.body.movieName;

    try {
        const existingMovie = await Movie.findOne({ 'voters.0': userId });
        if (existingMovie) {
            return res.send('You have already suggested a movie.');
        }

        const newMovie = new Movie({
            title: movieTitle,
            votes: 1,
            voters: [userId],
            creator: userId  // Store the creator's ID
        });

        await newMovie.save();
        res.redirect('/vote');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving movie suggestion');
    }
});

app.get('/delete-movie/:movieId', async (req, res) => {
    const userId = req.user.id;

    try {
        const movie = await Movie.findById(req.params.movieId);
        if (!movie) {
            return res.status(404).send('Movie not found');
        }

        if (movie.creator !== userId) {
            return res.status(403).send('You are not authorized to delete this movie.');
        }

        await movie.remove();
        res.redirect('/vote');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting movie');
    }
});

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
