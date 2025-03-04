// test/WebSocketManager.test.js
import { strict as assert } from 'assert';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import debug from 'debug';
import { test } from 'node:test'; // Node.js native test runner
import WebSocketManager from '../src/WebSocketManager.js';

const debugStub = debug('websocket:manager');

// Comprehensive cleanup function for timers and connections
function cleanupResources(wsManager) {
  // Clean up timers
  if (wsManager && wsManager.pingIntervalId) {
    clearInterval(wsManager.pingIntervalId);
    wsManager.pingIntervalId = null;
  }
  
  // Clean up WebSocket
  if (wsManager && wsManager.stream) {
    wsManager.stream.removeAllListeners();
    if (typeof wsManager.stream.close === 'function') {
      wsManager.stream.close();
    }
    wsManager.stream = null;
  }
}

// Setup and teardown for each test
function setupTest() {
  const connectMock = {
    calls: [],
    restore: () => {}
  };
  
  // Save original connect method
  const originalConnect = WebSocketManager.prototype.connect;
  
  // Mock the connect method
  WebSocketManager.prototype.connect = function() {
    connectMock.calls.push(arguments);
    return this;
  };
  
  connectMock.restore = () => {
    WebSocketManager.prototype.connect = originalConnect;
  };
  
  return { connectMock };
}

function teardownTest(mocks, wsManager) {
  for (const mock of Object.values(mocks)) {
    if (mock && typeof mock.restore === 'function') {
      mock.restore();
    }
  }
  
  // Call our new cleanup function
  if (wsManager) {
    cleanupResources(wsManager);
  }
}

// Tests
test('WebSocketManager - should instantiate with valid parameters', () => {
  const { connectMock } = setupTest();
  let wsManager;

  try {
    wsManager = new WebSocketManager(
      'wss://api.orbitbhyve.com/v1/events',
      {},
      debugStub,
      25000,
    );

    assert.equal(wsManager.url, 'wss://api.orbitbhyve.com/v1/events');
    // Add assertions for other parameters as needed
  } finally {
    teardownTest({ connectMock }, wsManager);
  }
});

test('WebSocketManager - should connect to WebSocket server', () => {
  const { connectMock } = setupTest();
  let wsManager;

  try {
    wsManager = new WebSocketManager(
      'wss://api.orbitbhyve.com/v1/events',
      {},
      debugStub,
      25000,
    );

    assert.equal(connectMock.calls.length, 1, 'connect should be called once');
  } finally {
    teardownTest({ connectMock }, wsManager);
  }
});

test('WebSocketManager - should start ping interval and send ping messages', () => {
  const { connectMock } = setupTest();
  let wsManager;
  
  // Store original timer functions
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;

  try {
    wsManager = new WebSocketManager(
      'wss://api.orbitbhyve.com/v1/events',
      {},
      debugStub,
    );
    
    wsManager.stream = new EventEmitter();
    wsManager.stream.readyState = WebSocket.OPEN;
    wsManager.stream.send = () => {}; // Add mock send method to the stream
    
    // Mock the send method on WebSocketManager
    const sendSpy = {
      calls: [],
      restore: () => {}
    };
    
    const originalSend = wsManager.send;
    wsManager.send = function(...args) {
      sendSpy.calls.push(args);
      return originalSend.apply(this, args);
    };
    
    sendSpy.restore = () => {
      wsManager.send = originalSend;
    };
    
    // Mock setInterval to control time
    let intervalId = 999; // Dummy interval ID
    global.setInterval = (fn) => {
      // Execute the function immediately for testing purposes
      fn();
      return intervalId;
    };
    
    // Also mock clearInterval for cleanup
    global.clearInterval = () => {};
    
    wsManager.startPing();
    
    assert.equal(sendSpy.calls.length, 1, 'send should be called once');
    assert.deepEqual(sendSpy.calls[0][0], { event: 'ping' }, 'should send ping event');
    
    sendSpy.restore();
    
  } finally {
    // Restore original timers first, before cleanup
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    
    teardownTest({ connectMock }, wsManager);
  }
});

test('WebSocketManager - should clear listeners and stop ping on close', () => {
  const { connectMock } = setupTest();
  let wsManager;

  try {
    wsManager = new WebSocketManager(
      'wss://api.orbitbhyve.com/v1/events',
      {},
      debugStub,
    );
    
    wsManager.stream = new EventEmitter();
    wsManager.stream.readyState = WebSocket.OPEN;
    wsManager.stream.close = () => {};
    
    // Spy on clearListeners and stopPing
    const clearListenersSpy = {
      calls: [],
      restore: () => {}
    };
    const stopPingSpy = {
      calls: [],
      restore: () => {}
    };
    
    const originalClearListeners = wsManager.clearListeners;
    wsManager.clearListeners = function(...args) {
      clearListenersSpy.calls.push(args);
      return originalClearListeners.apply(this, args);
    };
    
    const originalStopPing = wsManager.stopPing;
    wsManager.stopPing = function(...args) {
      stopPingSpy.calls.push(args);
      return originalStopPing.apply(this, args);
    };
    
    clearListenersSpy.restore = () => {
      wsManager.clearListeners = originalClearListeners;
    };
    
    stopPingSpy.restore = () => {
      wsManager.stopPing = originalStopPing;
    };
    
    wsManager.close();
    
    assert.equal(stopPingSpy.calls.length, 1, 'stopPing should be called once');
    assert.equal(clearListenersSpy.calls.length, 1, 'clearListeners should be called once');
    
    clearListenersSpy.restore();
    stopPingSpy.restore();
    
  } finally {
    teardownTest({ connectMock }, wsManager);
  }
});

// Final cleanup test to ensure the process exits cleanly
test('Final cleanup', async () => {
  // Allow a small delay for any async operations to settle
  await new Promise(resolve => setTimeout(resolve, 100));
  // Process will exit after tests complete
  process.exit(0);
});
