// WebSocketManager.js
import { EventEmitter } from 'events';
import WebSocket from 'ws';

export default class WebSocketManager extends EventEmitter {
  constructor(url, options, debug, pingInterval = 25000) {
    super();
    this.url = url;
    this.options = options;
    this.pingInterval = pingInterval;
    this.pingIntervalId = null;
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

  clearListeners() {
    if (this.stream) {
      this.stream.removeAllListeners();
    }
  }

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

  stopPing() {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
      this.debug('stopPing: Unset ping interval.');
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

  send(data) {
    if (this.stream.readyState === WebSocket.OPEN) {
      this.debug(`WebSocketManager send: ${JSON.stringify(data)}`);
      this.stream.send(JSON.stringify(data));
    }
  }

  close() {
    this.stopPing();
    this.stream.close();
    this.debug('close: WebSocket connection closed.');
  }
}
