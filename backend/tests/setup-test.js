import { beforeAll } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = 'mongodb://localhost:27017/test';
});