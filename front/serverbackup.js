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


passport.serializeUser((user, done) => {
    done(null, user.id);  // Storing user.id in the session
});

passport.deserializeUser((id, done) => {
    done(null, { id: id });  // Retrieving user.id from the session
});

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
        // Initialize user session properties
        req.session.hasAddedMovie = false;
        req.session.hasVoted = false;
        // Successful authentication, redirect to voting page.
        res.redirect('/vote');
    }
);

app.get('/vote', async (req, res) => {
    const userId = req.user.id.toString();

    try {
        const movies = await Movie.find({});

        let movieListHtml = movies.map(movie => {
            let deleteButton = movie.creator.toString() === userId.toString() ? `<button onclick="location.href='/delete-movie/${movie._id}'">Delete</button>` : '';
            return `
                <div>
                    ${movie.title} - Votes: ${movie.votes}
                    <form action="/vote/${movie._id}" method="post" style="display:inline;">
                        <button type="submit">Votar</button>
                    </form>
                    ${deleteButton}
                </div>
            `;
        }).join('');

        let html = `
            <link rel="stylesheet" href="/styles.css">
            <div class="container">
                <h2>Vota la pelicula</h2>
                ${movieListHtml}
                <h2>Propon una pelicula nueva</h2>
                <form action="/add-movie" method="post">
                    <input type="text" name="movieName" placeholder="Nombre de la pelicula" required>
                    <button type="submit">Añadir</button>
                </form>
            </div>
        `;

        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching movies');
    }
});

app.post('/vote/:movieId', async (req, res) => {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(403).send('You need to be logged in to perform this action.');
    }
    const userId = req.user.id.toString();
    // Check user's session
    if (req.session.hasAddedMovie || req.session.hasVoted) {
        return res.send('You have already suggested a movie or voted.');
    }
    try {
        const movie = await Movie.findById(req.params.movieId);
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        // Check if user has already voted for this movie
        if (movie.voters.includes(userId)) {
            return res.send('You have already voted for this movie.');
        }
        movie.votes += 1;
        movie.voters.push(userId);
        await movie.save();
        // Update user's session
        req.session.hasVoted = true;
        res.redirect('/vote');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error voting for movie');
    }
});

app.post('/add-movie', async (req, res) => {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(403).send('You need to be logged in to perform this action.');
    }
    const userId = req.user.id.toString();
    const movieTitle = req.body.movieName;

    // Check user's session
    if (req.session.hasAddedMovie || req.session.hasVoted) {
        return res.send('You have already suggested a movie or voted.');
    }
    try {
        const newMovie = new Movie({
            title: movieTitle,
            votes: 0,  // Set initial votes to 0
            creator: userId
        });
        await newMovie.save();
        // Update user's session
        req.session.hasAddedMovie = true;
        res.redirect('/vote');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving movie suggestion');
    }
});

app.get('/delete-movie/:movieId', async (req, res) => {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
        return res.status(403).send('You need to be logged in to perform this action.');
    }
    const userId = req.user.id.toString();
    try {
        const movie = await Movie.findById(req.params.movieId);
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        // Check if the logged-in user is the creator of the movie
        if (movie.creator.toString() !== userId) {
            return res.status(403).send('You are not authorized to delete this movie.');
        }
        await movie.deleteOne();
        // Reset user's session properties
        req.session.hasAddedMovie = false;
        req.session.hasVoted = false;

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
