export class RedisUnavailableError extends Error {
  constructor(message = 'Redis unavailable') {
    super(message);
    this.name = 'RedisUnavailableError';
  }
}
