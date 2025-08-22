import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import User model
import User from './models/User.js';
import Movie from './models/Movie.js';
import Review from './models/Review.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Serve static files: prefer client build (for Railway), fallback to /frontend
// const clientDistPath = path.join(__dirname, '../client/dist');
const frontendPath = path.join(__dirname, '../frontend');
// app.use(express.static(clientDistPath));
app.use(express.static(frontendPath));

// Simple session storage (in production, use Redis or a proper session store)
const sessions = new Map();

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  const session = sessions.get(sessionId);
  req.user = session.user;
  next();
};

// Connect to MongoDB with better error handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/movievault');
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Using mock database instead');
    return false;
  }
};

// Store connection status
let isMongoDBConnected = false;

// Connect to database and start server
connectDB().then(connected => {
  isMongoDBConnected = connected;

  app.listen(PORT, () => {
    console.log(`🎬 Movie Vault server running on port ${PORT}`);
    console.log(`📍 Access your app at: http://localhost:${PORT}`);
    console.log(isMongoDBConnected ? '✅ MongoDB connected successfully' : '⚠️  Using mock database');
  });
});

// Mock user database (fallback if MongoDB fails)
const users = [];
const movies = [];
const reviews = [];

// API Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      const user = await User.findOne({ username });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Create session
      const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessions.set(sessionId, {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username
        },
        createdAt: new Date()
      });

      res.json({
        success: true,
        message: 'Login successful!',
        sessionId: sessionId,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username
        }
      });
    } else {
      // Use mock database
      const user = users.find(u => u.username === username && u.password === password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Create session for mock user
      const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessions.set(sessionId, {
        user: {
          _id: user.id || 'mock-user-id',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username
        },
        createdAt: new Date()
      });

      res.json({
        success: true,
        message: 'Login successful! (mock database)',
        sessionId: sessionId,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.sessionId;
  
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, DOB, gender, phone, email, username, password } = req.body;

    // Input validation
    if (!firstName || !lastName || !DOB || !gender || !phone || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user with all fields
      const newUser = new User({
        firstName,
        lastName,
        DOB: new Date(DOB),
        gender,
        phone,
        email,
        username,
        password: hashedPassword
      });

      await newUser.save();

      res.status(201).json({
        success: true,
        message: 'User created successfully'
      });
    } else {
      // Use mock database
      if (users.find(u => u.email === email || u.username === username)) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }

      // Add to mock database
      const mockUser = { 
        id: Date.now().toString(),
        firstName, 
        lastName, 
        DOB, 
        gender, 
        phone, 
        email, 
        username, 
        password 
      };
      users.push(mockUser);

      res.status(201).json({
        success: true,
        message: 'User created successfully (mock database)'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Serve HTML pages
// Helper to check if any users exist
const usersExistInDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const count = await User.countDocuments({});
      return count > 0;
    }
    // mock db fallback
    return users.length > 0;
  } catch (e) {
    return false;
  }
};

app.get('/', async (req, res) => {
  // Always show login page first in this app's flow
  return res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
res.sendFile(path.join(__dirname, '../frontend/register.html'));

});

app.get('/watchlist', (req, res) => {
res.sendFile(path.join(__dirname, '../frontend/watchlist.html'));

});

app.get('/reviews', (req, res) => {
res.sendFile(path.join(__dirname, '../frontend/reviews.html'));

});

// Movie API endpoints

// Add movie to watchlist
app.post('/api/movies', authenticateUser, async (req, res) => {
  try {
    const { title, description, genres, releaseYear, rating, posterImage, notes, ottPlatforms } = req.body;
    const userId = req.user._id;

    // Input validation
    if (!title || !description || !genres || !releaseYear) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, genres, and release year are required'
      });
    }

    // Validate genres array
    if (!Array.isArray(genres) || genres.length === 0 || genres.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Genres must be an array with 1-5 genres'
      });
    }

    // Validate release year
    const year = parseInt(releaseYear);
    if (isNaN(year) || year < 1800 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Release year must be between 1800 and 2100'
      });
    }

    // Validate rating
    if (rating !== undefined && rating !== null) {
      const ratingValue = parseFloat(rating);
      if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 11) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 0 and 11'
        });
      }
    }

    // Validate OTT platforms
    if (ottPlatforms !== undefined && ottPlatforms !== null) {
      if (!Array.isArray(ottPlatforms)) {
        return res.status(400).json({
          success: false,
          message: 'OTT platforms must be an array'
        });
      }
    }

    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      const newMovie = new Movie({
        title,
        description,
        genres: genres,
        releaseYear: parseInt(releaseYear),
        rating: rating ? parseFloat(rating) : 0,
        posterImage: posterImage || '',
        ottPlatforms: ottPlatforms || [],
        addedBy: userId,
        notes: notes || ''
      });

      await newMovie.save();

      res.status(201).json({
        success: true,
        message: 'Movie added to watchlist successfully',
        movie: newMovie
      });
    } else {
      // Use mock database
      const newMovie = {
        id: Date.now().toString(),
        title,
        description,
        genres: genres,
        releaseYear: parseInt(releaseYear),
        rating: rating ? parseFloat(rating) : 0,
        posterImage: posterImage || '',
        ottPlatforms: ottPlatforms || [],
        addedBy: userId,
        addedAt: new Date(),
        isWatched: false,
        notes: notes || ''
      };

      movies.push(newMovie);

      res.status(201).json({
        success: true,
        message: 'Movie added to watchlist successfully (mock database)',
        movie: newMovie
      });
    }
  } catch (error) {
    console.error('Add movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding movie'
    });
  }
});

// Update movie in watchlist
app.put('/api/movies/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const {
      title,
      description,
      genres,
      releaseYear,
      rating,
      posterImage,
      ottPlatforms,
      notes
    } = req.body;

    // Basic validation
    if (!title || !description || !genres || !releaseYear) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, genres, and release year are required'
      });
    }

    if (!Array.isArray(genres) || genres.length === 0 || genres.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Genres must be an array with 1-5 genres'
      });
    }

    if (mongoose.connection.readyState === 1) {
      // MongoDB update with ownership constraint
      const updatedMovie = await Movie.findOneAndUpdate(
        { _id: id, addedBy: userId },
        {
          $set: {
            title,
            description,
            genres,
            releaseYear: parseInt(releaseYear),
            rating: rating ? parseFloat(rating) : 0,
            posterImage: posterImage || '',
            ottPlatforms: Array.isArray(ottPlatforms) ? ottPlatforms : [],
            notes: notes || ''
          }
        },
        { new: true, runValidators: true }
      );

      if (!updatedMovie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found or you do not have permission to update it'
        });
      }

      return res.json({
        success: true,
        message: 'Movie updated successfully',
        movie: updatedMovie
      });
    } else {
      // Mock DB update
      const index = movies.findIndex(m => (m.id === id || m._id === id) && m.addedBy === userId);
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found or you do not have permission to update it'
        });
      }

      movies[index] = {
        ...movies[index],
        title,
        description,
        genres,
        releaseYear: parseInt(releaseYear),
        rating: rating ? parseFloat(rating) : 0,
        posterImage: posterImage || '',
        ottPlatforms: Array.isArray(ottPlatforms) ? ottPlatforms : [],
        notes: notes || ''
      };

      return res.json({
        success: true,
        message: 'Movie updated successfully (mock database)',
        movie: movies[index]
      });
    }
  } catch (error) {
    console.error('Update movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating movie'
    });
  }
});

// Move a movie from watchlist to reviews with review details
app.post('/api/movies/:id/move-to-review', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { ratingStars, reviewText, reviewPros, reviewCons, isSpoiler, recommended } = req.body;

    // Validate review input
    const stars = parseInt(ratingStars, 10);
    if (!(stars >= 1 && stars <= 10)) {
      return res.status(400).json({
        success: false,
        message: 'ratingStars must be an integer between 1 and 11'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const movie = await Movie.findOne({ _id: id, addedBy: userId });
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found or you do not have permission to move it'
        });
      }

      const review = await Review.create({
        title: movie.title,
        description: movie.description,
        genres: movie.genres,
        releaseYear: movie.releaseYear,
        posterImage: movie.posterImage,
        ottPlatforms: movie.ottPlatforms || [],
        reviewText: reviewText || '',
        ratingStars: stars,
        imdbRating: 0,
        reviewedBy: userId,
        sourceMovieId: movie._id,
        reviewPros: reviewPros || '',
        reviewCons: reviewCons || '',
        isSpoiler: Boolean(isSpoiler),
        recommended: typeof recommended === 'boolean' ? recommended : true
      });

      await Movie.deleteOne({ _id: id, addedBy: userId });

      return res.status(201).json({
        success: true,
        message: 'Movie moved to reviews successfully',
        review
      });
    } else {
      const idx = movies.findIndex(m => (m.id === id || m._id === id) && m.addedBy === userId);
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found or you do not have permission to move it'
        });
      }

      const movie = movies[idx];
      const newReview = {
        id: Date.now().toString(),
        title: movie.title,
        description: movie.description,
        genres: movie.genres,
        releaseYear: movie.releaseYear,
        posterImage: movie.posterImage,
        ottPlatforms: movie.ottPlatforms || [],
        reviewText: reviewText || '',
        ratingStars: stars,
        imdbRating: 0,
        reviewedBy: userId,
        createdAt: new Date(),
        sourceMovieId: movie.id,
        reviewPros: reviewPros || '',
        reviewCons: reviewCons || '',
        isSpoiler: Boolean(isSpoiler),
        recommended: typeof recommended === 'boolean' ? recommended : true
      };
      reviews.push(newReview);
      movies.splice(idx, 1);

      return res.status(201).json({
        success: true,
        message: 'Movie moved to reviews successfully (mock database)',
        review: newReview
      });
    }
  } catch (error) {
    console.error('Move to review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while moving movie to reviews'
    });
  }
});

// Reviews CRUD
app.get('/api/reviews', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    if (mongoose.connection.readyState === 1) {
      const userReviews = await Review.find({ reviewedBy: userId }).sort({ createdAt: -1 });
      return res.json({ success: true, reviews: userReviews });
    } else {
      const userReviews = reviews.filter(r => r.reviewedBy === userId);
      return res.json({ success: true, reviews: userReviews });
    }
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching reviews' });
  }
});

app.post('/api/reviews', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      genres,
      releaseYear,
      posterImage,
      ottPlatforms,
      reviewText,
      ratingStars,
      imdbRating,
      reviewPros,
      reviewCons,
      isSpoiler,
      recommended
    } = req.body;

    if (!title || !releaseYear) {
      return res.status(400).json({ success: false, message: 'Title and release year are required' });
    }
    
    // Validate release year
    const year = parseInt(releaseYear);
    if (isNaN(year) || year < 1800 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Release year must be between 1800 and 2100'
      });
    }
    
    const stars = parseInt(ratingStars, 10);
    if (!(stars >= 0 && stars <= 10)) {
      return res.status(400).json({ success: false, message: 'ratingStars must be 0-10' });
    }

    // Validate IMDb rating
    if (imdbRating !== undefined && imdbRating !== null) {
      const imdb = parseFloat(imdbRating);
      if (isNaN(imdb) || imdb < 0 || imdb > 10) {
        return res.status(400).json({ success: false, message: 'IMDb rating must be between 0 and 10' });
      }
    }

    // Validate OTT platforms
    if (ottPlatforms !== undefined && ottPlatforms !== null) {
      if (!Array.isArray(ottPlatforms)) {
        return res.status(400).json({
          success: false,
          message: 'OTT platforms must be an array'
        });
      }
    }

    if (mongoose.connection.readyState === 1) {
      const review = await Review.create({
        title,
        description: description || '',
        genres: Array.isArray(genres) ? genres : [],
        releaseYear: parseInt(releaseYear),
        posterImage: posterImage || '',
        ottPlatforms: Array.isArray(ottPlatforms) ? ottPlatforms : [],
        reviewText: reviewText || '',
        ratingStars: stars,
        imdbRating: imdbRating ? parseFloat(imdbRating) : 0,
        reviewedBy: userId,
        reviewPros: reviewPros || '',
        reviewCons: reviewCons || '',
        isSpoiler: Boolean(isSpoiler),
        recommended: typeof recommended === 'boolean' ? recommended : true
      });
      return res.status(201).json({ success: true, message: 'Review added successfully', review });
    } else {
      const newReview = {
        id: Date.now().toString(),
        title,
        description: description || '',
        genres: Array.isArray(genres) ? genres : [],
        releaseYear: parseInt(releaseYear),
        posterImage: posterImage || '',
        ottPlatforms: Array.isArray(ottPlatforms) ? ottPlatforms : [],
        reviewText: reviewText || '',
        ratingStars: stars,
        imdbRating: imdbRating ? parseFloat(imdbRating) : 0,
        reviewedBy: userId,
        createdAt: new Date(),
        reviewPros: reviewPros || '',
        reviewCons: reviewCons || '',
        isSpoiler: Boolean(isSpoiler),
        recommended: typeof recommended === 'boolean' ? recommended : true
      };
      reviews.push(newReview);
      return res.status(201).json({ success: true, message: 'Review added successfully (mock database)', review: newReview });
    }
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating review' });
  }
});

app.put('/api/reviews/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const {
      title,
      description,
      genres,
      releaseYear,
      posterImage,
      ottPlatforms,
      reviewText,
      ratingStars,
      imdbRating,
      reviewPros,
      reviewCons,
      isSpoiler,
      recommended
    } = req.body;

    // Validate release year
    const year = parseInt(releaseYear);
    if (isNaN(year) || year < 1800 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Release year must be between 1800 and 2100'
      });
    }
    
    const stars = parseInt(ratingStars, 10);
    if (!(stars >= 0 && stars <= 10)) {
      return res.status(400).json({ success: false, message: 'ratingStars must be 0-10' });
    }

    // Validate IMDb rating
    if (imdbRating !== undefined && imdbRating !== null) {
      const imdb = parseFloat(imdbRating);
      if (isNaN(imdb) || imdb < 0 || imdb > 10) {
        return res.status(400).json({ success: false, message: 'IMDb rating must be between 0 and 10' });
      }
    }

    // Validate OTT platforms
    if (ottPlatforms !== undefined && ottPlatforms !== null) {
      if (!Array.isArray(ottPlatforms)) {
        return res.status(400).json({
          success: false,
          message: 'OTT platforms must be an array'
        });
      }
    }

    if (mongoose.connection.readyState === 1) {
      const updated = await Review.findOneAndUpdate(
        { _id: id, reviewedBy: userId },
        {
          $set: {
            title,
            description: description || '',
            genres: Array.isArray(genres) ? genres : [],
            releaseYear: parseInt(releaseYear),
            posterImage: posterImage || '',
            ottPlatforms: Array.isArray(ottPlatforms) ? ottPlatforms : [],
            reviewText: reviewText || '',
            ratingStars: stars,
            imdbRating: imdbRating ? parseFloat(imdbRating) : 0,
            reviewPros: reviewPros || '',
            reviewCons: reviewCons || '',
            isSpoiler: Boolean(isSpoiler),
            recommended: typeof recommended === 'boolean' ? recommended : true
          }
        },
        { new: true, runValidators: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Review not found or no permission' });
      }
      return res.json({ success: true, message: 'Review updated successfully', review: updated });
    } else {
      const index = reviews.findIndex(r => (r.id === id || r._id === id) && r.reviewedBy === userId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Review not found or no permission' });
      }
      reviews[index] = {
        ...reviews[index],
        title,
        description: description || '',
        genres: Array.isArray(genres) ? genres : [],
        releaseYear: parseInt(releaseYear),
        posterImage: posterImage || '',
        ottPlatforms: Array.isArray(ottPlatforms) ? ottPlatforms : [],
        reviewText: reviewText || '',
        ratingStars: stars,
        imdbRating: imdbRating ? parseFloat(imdbRating) : 0,
        reviewPros: reviewPros || '',
        reviewCons: reviewCons || '',
        isSpoiler: Boolean(isSpoiler),
        recommended: typeof recommended === 'boolean' ? recommended : true
      };
      return res.json({ success: true, message: 'Review updated successfully (mock database)', review: reviews[index] });
    }
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating review' });
  }
});

app.delete('/api/reviews/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    if (mongoose.connection.readyState === 1) {
      const deleted = await Review.findOneAndDelete({ _id: id, reviewedBy: userId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Review not found or no permission' });
      }
      return res.json({ success: true, message: 'Review deleted successfully' });
    } else {
      const index = reviews.findIndex(r => (r.id === id || r._id === id) && r.reviewedBy === userId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Review not found or no permission' });
      }
      reviews.splice(index, 1);
      return res.json({ success: true, message: 'Review deleted successfully (mock database)' });
    }
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting review' });
  }
});
// Get all movies from watchlist
app.get('/api/movies', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    if (mongoose.connection.readyState === 1) {
      // Use MongoDB
      const userMovies = await Movie.find({ addedBy: userId }).sort({ addedAt: -1 });

      res.json({
        success: true,
        movies: userMovies
      });
    } else {
      // Use mock database
      const userMovies = movies.filter(movie => movie.addedBy === userId);

      res.json({
        success: true,
        movies: userMovies
      });
    }
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching movies'
    });
  }
});

// Delete movie from watchlist
app.delete('/api/movies/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (mongoose.connection.readyState === 1) {
      // Use MongoDB - ensure user can only delete their own movies
      const deletedMovie = await Movie.findOneAndDelete({ _id: id, addedBy: userId });

      if (!deletedMovie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found or you do not have permission to delete it'
        });
      }

      res.json({
        success: true,
        message: 'Movie removed from watchlist successfully'
      });
    } else {
      // Use mock database
      const movieIndex = movies.findIndex(movie => movie.id === id && movie.addedBy === userId);

      if (movieIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found or you do not have permission to delete it'
        });
      }

      movies.splice(movieIndex, 1);

      res.json({
        success: true,
        message: 'Movie removed from watchlist successfully (mock database)'
      });
    }
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting movie'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'MongoDB connected' : 'Using mock database';
  res.json({
    success: true,
    message: 'Server is running',
    database: dbStatus,
    usersCount: mongoose.connection.readyState === 1 ? 'N/A' : users.length,
    timestamp: new Date().toISOString()
  });
});