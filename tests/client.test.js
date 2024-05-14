// tests/client.test.js
/* eslint-disable import/no-extraneous-dependencies */
/* global describe */

import { use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { describe } from 'mocha';
import bhyveMqtt from '../src/index.js';

use(sinonChai);

// Your tests
describe('bhyve-mqtt', () => {
  it('should do something', () => {
    // Your test logic here
  });
});
