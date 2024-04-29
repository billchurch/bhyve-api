// WebSocketManager.js
const { EventEmitter } = require('events');
const WebSocket = require('ws');

class WebSocketManager extends EventEmitter {
  constructor(url, options) {
    super();
    this.stream = new WebSocket(url, options);
    this.setupListeners();
  }

  setupListeners() {
    this.stream.on('open', () => this.emit('open'));
    this.stream.on('message', (data) => this.emit('message', data));
    this.stream.on('error', (err) => this.emit('error', err));
    this.stream.on('close', (code, reason) => this.emit('close', code, reason));
    this.stream.on('unexpected-response', (request, response) =>
      this.emit('unexpected-response', request, response),
    );
  }

  send(data) {
    this.stream.send(JSON.stringify(data));
  }

  close() {
    this.stream.close();
  }
}

module.exports = WebSocketManager;
