const mongoose = require('mongoose');

const postSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',  // This references the user who created the post
    },
    image: { type: String},
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        text: { type: String, required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String }],  // Array of tags, e.g., ["tech", "javascript", "frontend"]
    category: { type: String },  // Category, e.g., "Programming", "Lifestyle", etc.
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', postSchema);
