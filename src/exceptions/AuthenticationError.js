const ClientError = require('./ClientError');

class AunthenticationError extends ClientError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

module.exports = AunthenticationError;
