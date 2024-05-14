// src/OrbitError.js
/**
 * Custom error class for handling Orbit API errors.
 */
export default class OrbitError extends Error {
  /**
   * Creates an instance of OrbitError.
   * @param {string} message - The error message.
   * @param {Object} [options] - Additional error options.
   * @param {Error} [options.originalError] - The original error object.
   * @param {Object} [options.data] - Additional data related to the error.
   */
  constructor(message, { originalError, data } = {}) {
    super(message);
    this.name = 'OrbitError';
    if (originalError && originalError.response) {
      this.statusCode = originalError.response.status;
      this.responseBody = originalError.response.data;
    }
    this.data = data;
  }
}
