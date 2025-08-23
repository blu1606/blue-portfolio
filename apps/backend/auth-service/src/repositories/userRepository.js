// src/repositories/userRepository.js
const { ConflictRequestError } = require('common/core/error.response');

const createUserRepository = (supabase) => {
  const findByEmail = async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, account_locked, otp_hash, otp_generated_at, otp_attempts, reset_token, reset_token_expiry, session_version')
      .eq('email', email)
      .single();
      
    if (error && error.code === 'PGRST116') {
      return null; // User not found
    }
    if (error) {
      console.error('Database error finding user:', error);
      throw new Error('Failed to find user');
    }
    return data;
  };

  const findById = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, email_verified, account_locked, otp_hash, otp_generated_at, otp_attempts, reset_token, reset_token_expiry, session_version')
      .eq('id', userId)
      .single();
      
    if (error && error.code === 'PGRST116') {
      return null; // User not found
    }
    if (error) {
      console.error('Database error finding user:', error);
      throw new Error('Failed to find user');
    }
    return data;
  };

  const create = async (userData) => {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
      
    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new ConflictRequestError('Email already registered');
      }
      console.error('Database error creating user:', error);
      throw new Error('Failed to create user');
    }
    return data;
  };

  const updateOTPData = async (userId, otpData) => {
    const { error } = await supabase
      .from('users')
      .update(otpData)
      .eq('id', userId);
      
    if (error) {
      console.error('Database error updating OTP:', error);
      throw new Error('Failed to update OTP');
    }
  };

  const updatePassword = async (userId, updateData) => {
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: updateData.passwordHash,
        reset_token: null,
        reset_token_expiry: null,
        password_changed_at: new Date().toISOString(),
        ...updateData.additionalFields
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Database error updating password:', error);
      throw new Error('Failed to update password');
    }
  };

  return {
    findByEmail,
    findById,
    create,
    updateOTPData,
    updatePassword
  };
};

module.exports = { createUserRepository };