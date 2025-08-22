import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  genres: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0 && v.length <= 5; // Allow 1-5 genres
      },
      message: 'Movie must have at least 1 genre and maximum 5 genres'
    }
  },
  releaseYear: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 11,
    default: 0
  },
  posterImage: {
    type: String,
    default: ''
  },
  ottPlatforms: {
    type: [String],
    default: []
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isWatched: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Create index for better query performance
movieSchema.index({ addedBy: 1, addedAt: -1 });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;

