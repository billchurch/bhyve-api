// test/OrbitError.test.js
 
/* global describe, it */

import { expect } from 'chai';
import OrbitError from '../src/OrbitError.js';

describe('OrbitError', () => {
  it('should instantiate with a message and no additional data', () => {
    const errorMessage = 'An error occurred.';
    const orbitError = new OrbitError(errorMessage);

    expect(orbitError.message).to.equal(errorMessage);
    expect(orbitError.name).to.equal('OrbitError');
    expect(orbitError.statusCode).to.be.undefined;
    expect(orbitError.responseBody).to.be.undefined;
    expect(orbitError.data).to.be.undefined;
  });

  it('should instantiate with a message and original error data', () => {
    const errorMessage = 'An error occurred.';
    const originalError = {
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
    };

    const orbitError = new OrbitError(errorMessage, { originalError });

    expect(orbitError.message).to.equal(errorMessage);
    expect(orbitError.name).to.equal('OrbitError');
    expect(orbitError.statusCode).to.equal(404);
    expect(orbitError.responseBody).to.deep.equal({ message: 'Not found' });
    expect(orbitError.data).to.be.undefined;
  });

  it('should allow accessing properties after instantiation', () => {
    const errorMessage = 'An error occurred.';
    const orbitError = new OrbitError(errorMessage);

    expect(orbitError.message).to.equal(errorMessage);

    // Update properties after instantiation
    orbitError.name = 'CustomError';
    orbitError.statusCode = 500;
    orbitError.responseBody = { message: 'Internal Server Error' };
    orbitError.data = { additionalInfo: 'Some additional information' };

    expect(orbitError.name).to.equal('CustomError');
    expect(orbitError.statusCode).to.equal(500);
    expect(orbitError.responseBody).to.deep.equal({
      message: 'Internal Server Error',
    });
    expect(orbitError.data).to.deep.equal({
      additionalInfo: 'Some additional information',
    });
  });
});
