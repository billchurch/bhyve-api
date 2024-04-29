// OrbitError.js
class OrbitError extends Error {
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

module.exports = OrbitError;
