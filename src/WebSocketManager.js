// WebSocketManager.js
const { EventEmitter } = require('events');
const WebSocket = require('ws');

class WebSocketManager extends EventEmitter {
  constructor(url, options, debug, pingInterval = 25000) {
    // Default ping interval to 25 seconds
    super();
    this.url = url;
    this.options = options;
    this.pingInterval = pingInterval;
    this.pingIntervalId = null;
    this.stream = null;
    this.reconnectInterval = 1000;
    this.maxReconnectInterval = 30000;
    this.reconnectAttempts = 0;
    this.connect();
    this.debug = debug;
  }

  connect() {
    this.stream = new WebSocket(this.url, this.options);
    this.setupListeners();
    this.startPing();
  }

  setupListeners() {
    this.stream.on('open', () => {
      this.emit('open');
      this.reconnectAttempts = 0;
      this.reconnectInterval = 1000;
      this.startPing(); // Start the ping process on open
    });
    this.stream.on('message', (data) => this.emit('message', data));
    this.stream.on('error', (err) => {
      this.emit('error', err);
      this.stopPing();
    });
    this.stream.on('close', (code, reason) => {
      this.emit('close', code, reason);
      this.handleReconnect();
      this.stopPing();
    });
  }

  startPing() {
    this.stopPing(); // Clear existing interval
    this.pingIntervalId = setInterval(() => {
      if (this.stream.readyState === WebSocket.OPEN) {
        const pingMessage = { event: 'ping' };
        this.debug(`Sending ping message: ${JSON.stringify(pingMessage)}`);
        this.stream.send(JSON.stringify(pingMessage));
      }
    }, this.pingInterval);
  }

  stopPing() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < 5) {
      setTimeout(() => {
        this.emit(
          'reconnect_attempt',
          this.reconnectAttempts,
          this.reconnectInterval,
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
    }
  }

  send(data) {
    if (this.stream.readyState === WebSocket.OPEN) {
      this.stream.send(JSON.stringify(data));
    }
  }

  close() {
    this.stopPing();
    this.stream.close();
  }
}

module.exports = WebSocketManager;
