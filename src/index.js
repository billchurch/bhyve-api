// index.js

const axios = require('axios');
const { EventEmitter } = require('events');
const debug = require('debug')('bhyve-api');
const OrbitError = require('./OrbitError');
const WebSocketManager = require('./WebSocketManager');
const ConfigManager = require('./ConfigManager');

/**
 * Returns the current timestamp in ISO format.
 * @returns {string} Current timestamp as an ISO string.
 */
const ts = () => new Date().toISOString();

/**
 * Client class that manages connections and interactions with the Orbit API.
 */
class Client extends EventEmitter {
  #token;

  #userId;

  #deviceId;

  #stream;

  #restConfig;

  configManager;

  /**
   * Initializes a new Client instance with optional custom configuration.
   * @param {Object} customConfig Custom configuration settings for the client.
   */
  constructor(customConfig = {}) {
    super();
    this.configManager = new ConfigManager(customConfig);
  }

  /**
   * Authenticates and connects to the Orbit API using the provided configuration settings.
   * @param {Object} newConfig Configuration to update before connecting.
   */
  async connect(newConfig = {}) {
    if (Object.keys(newConfig).length > 0) {
      this.configManager.updateConfig(newConfig);
    }

    const config = this.configManager.getConfig();
    try {
      const response = await axios
        .create({
          baseURL: config.baseURL,
          timeout: config.timeout,
        })
        .post('/v1/session', {
          session: {
            email: config.email,
            password: config.password,
          },
        });

      this.#token = response.data.orbit_session_token;
      this.#userId = response.data.user_id;
      this.#restConfig = {
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: { 'orbit-session-token': this.#token },
      };

      debug(`response.data: ${JSON.stringify(response.data)}`);

      this.emit('authenticated', true);
      this.emit('user_id', this.#userId);
    } catch (err) {
      console.log(`${ts()} - error: ${err}`);
      const error = new OrbitError('Failed to connect to Orbit API', {
        originalError: err,
      });
      debug(`error ${error}`);
      if (error.statusCode) {
        debug(`HTTP Status: ${error.statusCode}`);
      }
      if (error.responseBody) {
        debug(`Response Body: ${JSON.stringify(error.responseBody)}`);
      }
      this.emit('error', error);
    }
  }

  /**
   * Fetches and emits the list of devices associated with the authenticated user.
   */
  async devices() {
    try {
      const response = await axios
        .create(this.#restConfig)
        .get(`/v1/devices?user_id=${this.#userId}`);
      debug(`devices response.data: ${JSON.stringify(response.data)}`);
      this.#deviceId = response.data[0].id;
      this.emit('devices', response.data);
      this.emit('device_id', this.#deviceId);
    } catch (err) {
      debug(`error: ${err}`);
      this.emit('error', err);
    }
  }

  /**
   * Sets up and manages the WebSocket connection for real-time communication.
   */
  connectStream() {
    debug('connectStream');
    const config = this.configManager.getConfig();
    this.#stream = new WebSocketManager(
      config.wssURL,
      {
        handshakeTimeout: config.wsTimeout,
      },
      debug,
    );

    // Handle open event with custom logic
    this.#stream.on('open', () => {
      const message = {
        event: 'app_connection',
        orbit_session_token: this.#token,
      };
      debug(`stream.on open: authenticate message: ${JSON.stringify(message)}`);
      this.#stream.send(message);
    });

    // Handle message events
    this.#stream.on('message', (data) => {
      this.emit('message', JSON.parse(data));
    });

    // Handle errors
    this.#stream.on('error', (err) => {
      const error = new OrbitError('WebSocket error occurred', {
        originalError: err,
      });
      this.emit('error', error);
    });

    // Handle close events
    this.#stream.on('close', (num, reason) => {
      debug(`stream.on close: ${num} reason: ${reason}`);
    });

    // Handle unexpected response
    this.#stream.on('unexpected-response', (request, response) => {
      debug(
        `stream.on unexpected-response / request: ${JSON.stringify(
          request,
        )} response: ${JSON.stringify(response)}`,
      );
      console.error(
        `${ts()} - unexpected-response / request: ${JSON.stringify(
          request,
        )} response: ${JSON.stringify(response)}`,
      );
    });
  }

  /**
   * Sends a message via the WebSocket connection.
   * @param {Object} message The message object to send.
   */
  send(message) {
    debug(`send: ${JSON.stringify(message)}`);
    try {
      this.#stream.send(message);
      console.log(`send json: ${JSON.stringify(message)}`);
    } catch (err) {
      throw new OrbitError('Sending message failed', {
        originalError: err,
        message,
      });
    }
  }
}

module.exports = Client;
