// src/utils/validation.js
const { BadRequestError } = require('common/core/error.response');

/**
 * CMS Service Validation Utilities
 * Centralized validation logic for consistency
 */

const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim().length === 0)) {
    throw new BadRequestError(`${fieldName} is required`);
  }
};

const validateString = (value, fieldName, minLength = 0, maxLength = Infinity) => {
  if (typeof value !== 'string') {
    throw new BadRequestError(`${fieldName} must be a string`);
  }
  
  if (value.length < minLength) {
    throw new BadRequestError(`${fieldName} must be at least ${minLength} characters long`);
  }
  
  if (value.length > maxLength) {
    throw new BadRequestError(`${fieldName} must not exceed ${maxLength} characters`);
  }
};

const validateNumber = (value, fieldName, min = -Infinity, max = Infinity) => {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new BadRequestError(`${fieldName} must be a valid number`);
  }
  
  if (num < min) {
    throw new BadRequestError(`${fieldName} must be at least ${min}`);
  }
  
  if (num > max) {
    throw new BadRequestError(`${fieldName} must not exceed ${max}`);
  }
  
  return num;
};

const validateEmail = (email) => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError('Please provide a valid email address');
  }
  
  return email.toLowerCase().trim();
};

const validateRating = (rating) => {
  if (!rating) return null;
  
  const num = validateNumber(rating, 'Rating', 1, 5);
  return Math.floor(num);
};

const validatePagination = (limit, offset) => {
  const limitNum = limit ? validateNumber(limit, 'Limit', 1, 100) : 20;
  const offsetNum = offset ? validateNumber(offset, 'Offset', 0) : 0;
  
  return { limit: limitNum, offset: offsetNum };
};

// Content validation
const validateContent = (content, minLength = 10, maxLength = 2000) => {
  validateRequired(content, 'Content');
  validateString(content, 'Content', minLength, maxLength);
  
  // Basic content sanitization
  return content.trim();
};

// Post-specific validations
const validatePostData = (title, content, contentType = 'html') => {
  validateRequired(title, 'Title');
  validateString(title, 'Title', 1, 255);
  
  const validatedContent = validateContent(content);
  
  const allowedContentTypes = ['html', 'markdown'];
  if (!allowedContentTypes.includes(contentType)) {
    throw new BadRequestError('Content type must be either html or markdown');
  }
  
  return {
    title: title.trim(),
    content: validatedContent,
    contentType
  };
};

// Feedback-specific validations
const validateFeedbackData = (data) => {
  const { authorName, authorEmail, content, rating, isAnonymous } = data;
  
  const validatedContent = validateContent(content);
  
  // Anonymous feedback requires author name
  if (isAnonymous) {
    validateRequired(authorName, 'Author name');
    validateString(authorName, 'Author name', 1, 100);
  }
  
  const validatedEmail = authorEmail ? validateEmail(authorEmail) : null;
  const validatedRating = rating ? validateRating(rating) : null;
  
  return {
    authorName: authorName ? authorName.trim() : null,
    authorEmail: validatedEmail,
    content: validatedContent,
    rating: validatedRating,
    isAnonymous: Boolean(isAnonymous)
  };
};

// Comment-specific validations
const validateCommentData = (content, postId, parentId = null) => {
  const validatedContent = validateContent(content, 1, 1000);
  
  validateRequired(postId, 'Post ID');
  
  if (parentId) {
    validateRequired(parentId, 'Parent comment ID');
  }
  
  return {
    content: validatedContent,
    postId,
    parentId
  };
};

module.exports = {
  validateRequired,
  validateString,
  validateNumber,
  validateEmail,
  validateRating,
  validatePagination,
  validateContent,
  validatePostData,
  validateFeedbackData,
  validateCommentData
};
