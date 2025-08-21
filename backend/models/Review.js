import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  genres: { type: [String], default: [] },
  releaseYear: { type: Number, required: true },
  posterImage: { type: String, default: '' },
  ottPlatforms: { type: [String], default: [] },
  reviewText: { type: String, default: '', trim: true, maxlength: 5000 },
  ratingStars: { type: Number, required: true, min: 1, max: 5 },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceMovieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  reviewPros: { type: String, default: '', trim: true, maxlength: 2000 },
  reviewCons: { type: String, default: '', trim: true, maxlength: 2000 },
  isSpoiler: { type: Boolean, default: false },
  recommended: { type: Boolean, default: true }
}, { timestamps: true });

reviewSchema.index({ reviewedBy: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;


