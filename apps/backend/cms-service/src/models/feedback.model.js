// src/models/feedback.model.js
/**
 * Enhanced Feedback Model Schema
 * Supports both authenticated and anonymous users
 */

const FeedbackSchema = {
  id: 'uuid',
  // User info (for anonymous feedback)
  user_id: 'uuid', // nullable for anonymous
  author_name: 'string', // for anonymous users
  author_email: 'string', // for anonymous users (optional)
  author_avatar_url: 'string', // uploaded avatar image
  
  // Content
  content: 'text',
  rating: 'integer', // 1-5 star rating (optional)
  
  // Images
  images: 'json', // array of image URLs
  
  // Metadata
  is_approved: 'boolean',
  is_anonymous: 'boolean',
  ip_address: 'string', // for spam protection
  user_agent: 'string', // for analytics
  
  // Timestamps
  created_at: 'timestamp',
  updated_at: 'timestamp',
  approved_at: 'timestamp'
};

module.exports = FeedbackSchema;
