/* eslint-disable no-unused-vars */
// test/WebSocketManager.test.js
 
/* global describe, it, beforeEach, afterEach */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import debug from 'debug';

import { expect } from 'chai';
import sinon from 'sinon';
import WebSocketManager from '../src/WebSocketManager.js';

const debugStub = debug('websocket:manager'); // Use the same namespace as in WebSocketManager.js

describe('WebSocketManager', () => {
  let wsMock;
  // let debugStub;

  beforeEach(() => {
    // Mock the WebSocket class
    wsMock = sinon.stub(WebSocketManager.prototype, 'connect');

    // Stub the debug function
    // debugStub = sinon.stub().returns(() => {}); // Mock debug function
  });

  afterEach(() => {
    // Restore the original implementation after each test
    sinon.restore();
  });

  it('should instantiate with valid parameters', () => {
    const wsManager = new WebSocketManager(
      'wss://api.orbitbhyve.com/v1/events',
      {},
      debugStub,
      25000,
    );

    expect(wsManager.url).to.equal('wss://api.orbitbhyve.com/v1/events');
    // Add assertions for other parameters...
  });

  it('should connect to WebSocket server', () => {
    const wsManager = new WebSocketManager(
      'wss://api.orbitbhyve.com/v1/events',
      {},
      debugStub,
      25000,
    );

    expect(wsMock.calledOnce).to.be.true;
  });

  // it('should attempt to reconnect after closing', function (done) {
  //   this.timeout(5000); // Extend timeout for asynchronous operations

  //   const wsManager = new WebSocketManager('wss://api.orbitbhyve.com/v1/events', {}, debugStub);

  //   // Mock the stream after the WebSocketManager is instantiated
  //   wsManager.stream = new EventEmitter();
  //   wsManager.stream.readyState = WebSocket.OPEN;

  //   // Attach the spy after instantiating and setting the mock
  //   sinon.spy(wsManager, 'handleReconnect');

  //   // Trigger the 'close' event
  //   wsManager.stream.emit('close', 1000, 'Normal Closure');

  //   // Since handleReconnect sets a timeout, use setTimeout to delay assertion
  //   setTimeout(() => {
  //     expect(wsManager.handleReconnect).to.be.calledOnce;
  //     done();
  //   }, 1000); // Delay slightly longer than any possible immediate asynchronous delays
  // });

  it('should start ping interval and send ping messages', () => {
    const wsManager = new WebSocketManager(
      'wss://api.orbitbhyve.com/v1/events',
      {},
      debugStub,
    );
    wsManager.stream = new EventEmitter();
    wsManager.stream.readyState = WebSocket.OPEN;
    wsManager.stream.send = sinon.stub();

    const clock = sinon.useFakeTimers();
    sinon.spy(wsManager, 'send');

    wsManager.startPing();
    clock.tick(wsManager.pingInterval);

    expect(wsManager.send).to.have.been.calledOnceWith({ event: 'ping' });
    clock.restore();
  });

  it('should clear listeners and stop ping on close', () => {
    const wsManager = new WebSocketManager(
      'wss://api.orbitbhyve.com/v1/events',
      {},
      debugStub,
    );
    wsManager.stream = new EventEmitter();
    wsManager.stream.readyState = WebSocket.OPEN;
    wsManager.stream.close = sinon.stub();

    sinon.spy(wsManager, 'clearListeners');
    sinon.spy(wsManager, 'stopPing');

    wsManager.close();

    expect(wsManager.stopPing).to.have.been.calledOnce;
    expect(wsManager.clearListeners).to.have.been.calledOnce;
  });
});
