// test/OrbitError.test.js

import test from 'node:test';
import assert from 'node:assert';
import OrbitError from '../src/OrbitError.js';

test('OrbitError', async (t) => {
  await t.test('should instantiate with a message and no additional data', () => {
    const errorMessage = 'An error occurred.';
    const orbitError = new OrbitError(errorMessage);

    assert.strictEqual(orbitError.message, errorMessage);
    assert.strictEqual(orbitError.name, 'OrbitError');
    assert.strictEqual(orbitError.statusCode, undefined);
    assert.strictEqual(orbitError.responseBody, undefined);
    assert.strictEqual(orbitError.data, undefined);
  });

  await t.test('should instantiate with a message and original error data', () => {
    const errorMessage = 'An error occurred.';
    const originalError = {
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
    };

    const orbitError = new OrbitError(errorMessage, { originalError });

    assert.strictEqual(orbitError.message, errorMessage);
    assert.strictEqual(orbitError.name, 'OrbitError');
    assert.strictEqual(orbitError.statusCode, 404);
    assert.deepStrictEqual(orbitError.responseBody, { message: 'Not found' });
    assert.strictEqual(orbitError.data, undefined);
  });

  await t.test('should allow accessing properties after instantiation', () => {
    const errorMessage = 'An error occurred.';
    const orbitError = new OrbitError(errorMessage);

    assert.strictEqual(orbitError.message, errorMessage);

    // Update properties after instantiation
    orbitError.name = 'CustomError';
    orbitError.statusCode = 500;
    orbitError.responseBody = { message: 'Internal Server Error' };
    orbitError.data = { additionalInfo: 'Some additional information' };

    assert.strictEqual(orbitError.name, 'CustomError');
    assert.strictEqual(orbitError.statusCode, 500);
    assert.deepStrictEqual(orbitError.responseBody, {
      message: 'Internal Server Error',
    });
    assert.deepStrictEqual(orbitError.data, {
      additionalInfo: 'Some additional information',
    });
  });
});
