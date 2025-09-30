// index.js

import axios from 'axios';
import { EventEmitter } from 'events';
import debugLib from 'debug';
import OrbitError from './OrbitError.js';
import WebSocketManager from './WebSocketManager.js';
import ConfigManager from './ConfigManager.js';

const debug = debugLib('bhyve-api');

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
    debug('connect');
    if (Object.keys(newConfig).length > 0) {
      this.configManager.updateConfig(newConfig);
    }

    const {
      baseURL,
      timeout,
      email,
      password,
      maxContentLength,
      maxBodyLength,
    } =
      this.configManager.getConfig();
    try {
      const response = await axios
        .create({
          baseURL,
          timeout,
          maxContentLength,
          maxBodyLength,
        })
        .post('/v1/session', {
          session: {
            email,
            password,
          },
        });

      this.#token = response.data.orbit_session_token;
      this.#userId = response.data.user_id;
      this.#restConfig = {
        baseURL,
        timeout,
        maxContentLength,
        maxBodyLength,
        headers: { 'orbit-session-token': this.#token },
      };

      debug(`connect response.data: ${JSON.stringify(response.data)}`);

      this.emit('authenticated', true);
      this.emit('user_id', this.#userId);
    } catch (err) {
      const error = new OrbitError('Failed to connect to Orbit API', {
        originalError: err,
      });
      debug(`connect error ${JSON.stringify(error)}`);
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
      debug(`devices error: ${err}`);
      const error = new OrbitError('Failed to fetch devices', {
        originalError: err,
      });
      this.emit('error', error);
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
      const error = new OrbitError('Unexpected response from WebSocket', {
        request: JSON.stringify(request),
        response: JSON.stringify(response),
      });
      this.emit('error', error);
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
    } catch (err) {
      this.emit('error', err);
      throw new OrbitError('Sending message failed', {
        originalError: err,
        message,
      });
    }
  }
}

export default Client;
