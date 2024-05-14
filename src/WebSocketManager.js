// WebSocketManager.js
import { EventEmitter } from 'events';
import WebSocket from 'ws';

/**
 * Manages WebSocket connections with automatic reconnect and ping functionality.
 */
export default class WebSocketManager extends EventEmitter {
  /**
   * Creates an instance of WebSocketManager.
   * @param {string} url - The WebSocket URL.
   * @param {Object} options - WebSocket options.
   * @param {Function} debug - Debugging function.
   * @param {number} [pingInterval=25000] - Interval for sending ping messages.
   */
  constructor(url, options, debug, pingInterval = 25000) {
    super();
    this.url = url;
    this.options = options;
    this.pingInterval = pingInterval;
    this.pingIntervalId = null;
    this.stream = this.createWebSocket();
    this.stream = null;
    this.reconnectInterval = 1000;
    this.maxReconnectInterval = 30000;
    this.reconnectAttempts = 0;
    this.debug = debug;
    this.messageCount = 0;
    this.debug(
      `Constructor initialized with URL: ${this.url} and ping interval: ${this.pingInterval}`,
    );
    this.connect();
  }

  /**
   * Creates a new WebSocket instance.
   * @returns {WebSocket} The WebSocket instance.
   */
  createWebSocket() {
    return new WebSocket(this.url, this.options);
  }

  /**
   * Connects to the WebSocket server.
   */
  connect() {
    if (this.stream) {
      if (
        this.stream.readyState === WebSocket.OPEN ||
        this.stream.readyState === WebSocket.CONNECTING
      ) {
        this.debug(
          'connect: Existing WebSocket connection is still active. Skipping new connection.',
        );
        return;
      }
      this.clearListeners(); // Clear listeners of the old connection
    }
    this.stream = new WebSocket(this.url, this.options);
    this.debug('connect: Connecting to WebSocket...');
    this.setupListeners();
    this.startPing();
  }

  /**
   * Closes the WebSocket connection.
   */
  close() {
    if (this.stream) {
      this.stopPing(); // Stop any ongoing pinging
      this.clearListeners(); // Clear all event listeners from the stream
      this.stream.close(); // Close the WebSocket stream
      this.debug('close: WebSocket connection closed.');
    }
  }

  /**
   * Clears all event listeners from the WebSocket instance.
   */
  clearListeners() {
    if (this.stream) {
      this.stream.removeAllListeners();
    }
  }

  /**
   * Sets up event listeners for the WebSocket connection.
   */
  setupListeners() {
    this.stream.on('open', () => {
      this.debug('stream.on open: WebSocket connection opened.');
      this.emit('open');
      this.reconnectAttempts = 0;
      this.reconnectInterval = 1000;
      this.startPing(); // Start the ping process on open
    });
    this.stream.on('message', (data) => {
      this.messageCount = +1;
      this.debug(`stream.on message #${this.messageCount}: ${data}`);
      this.emit('message', data);
    });
    this.stream.on('error', (err) => {
      this.debug(`stream.on error: ${JSON.stringify(err)}`);
      this.emit('error', err);
      this.stopPing();
    });
    this.stream.on('close', (code, reason) => {
      this.debug(
        `stream.on close: WebSocket closed with code: ${code}, reason: ${reason}`,
      );
      this.emit('close', code, reason);
      this.handleReconnect();
      this.stopPing();
    });
  }

  /**
   * Starts the ping process to keep the WebSocket connection alive.
   */
  startPing() {
    this.stopPing(); // Clear existing interval
    this.debug('startPing: Set Ping interval.');
    this.pingIntervalId = setInterval(() => {
      if (this.stream.readyState === WebSocket.OPEN) {
        const pingMessage = { event: 'ping' };
        this.send(pingMessage);
      }
    }, this.pingInterval);
  }

  /**
   * Stops the ping process.
   */
  stopPing() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
      this.debug('stopPing: Unset ping interval.');
    }
  }

  /**
   * Handles reconnection attempts after a WebSocket disconnection.
   */
  handleReconnect() {
    if (this.reconnectAttempts < 5) {
      setTimeout(() => {
        this.emit(
          'reconnect_attempt',
          this.reconnectAttempts,
          this.reconnectInterval,
        );
        this.debug(
          `handleReconnect: Attempting to reconnect. Attempt: ${this.reconnectAttempts}`,
        );
        this.connect();
        this.reconnectInterval *= 2;
        if (this.reconnectInterval > this.maxReconnectInterval) {
          this.reconnectInterval = this.maxReconnectInterval;
        }
        this.reconnectAttempts += 1;
      }, this.reconnectInterval);
    } else {
      this.emit('max_reconnect_attempts_reached');
      this.debug('handleReconnect: Maximum reconnect attempts reached.');
    }
  }

  /**
   * Sends data via the WebSocket connection.
   * @param {Object} data - The data to send.
   */
  send(data) {
    if (this.stream.readyState === WebSocket.OPEN) {
      this.debug(`WebSocketManager send: ${JSON.stringify(data)}`);
      this.stream.send(JSON.stringify(data));
    }
  }
}
