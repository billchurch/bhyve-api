// tests/client.test.js
import Client from '../src/index';
import { create, post, get } from 'axios';
import { EventEmitter } from 'events';

// Before your tests
jest.mock('../src/WebSocketManager', () => {
  return jest.fn().mockImplementation(() => {
    return { on: jest.fn(), send: jest.fn(), close: jest.fn() };
  });
});

jest.mock('axios');

describe('Client', () => {
  let client;

  beforeEach(() => {
    client = new Client({
      email: 'test@example.com',
      password: 'password',
      timeout: 10000,
      debug: false,
    });
    client.emit = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('connect success', async () => {
    // Simulated token for testing; actual validity is not relevant
    const simulatedToken = 'simulated.jwt.token123';

    const mockData = {
      data: { orbit_session_token: simulatedToken, user_id: 'user123' },
    };
    create.mockReturnThis();
    post.mockResolvedValue(mockData);

    await client.connect();

    // Ensure correct payload is being sent
    expect(post).toHaveBeenCalledWith('/v1/session', {
      session: {
        email: 'test@example.com',
        password: 'password',
      },
    });
  });

  test('connect failure', async () => {
    const error = new Error('Network error');
    post.mockRejectedValue(error);

    await client.connect();
    expect(client.emit).toHaveBeenCalledWith('error', expect.anything());
  });

  test('devices fetch success', async () => {
    const mockData = {
      data: [
        {
          id: 'device1',
          name: 'Sprinkler',
          type: 'Sprinkler Timer',
          status: {
            is_connected: true,
            next_start_time: '2024-04-30T03:00:00-04:00',
          },
        },
        {
          id: 'device2',
          name: 'Hose',
          type: 'Hose Timer',
          status: {
            is_connected: false,
            next_start_time: '2024-05-01T03:00:00-04:00',
          },
        },
      ],
    };

    create.mockReturnThis();
    get.mockResolvedValue(mockData);

    await client.devices();

    expect(client.emit).toHaveBeenCalledWith(
      'devices',
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          type: expect.any(String),
          status: expect.any(Object),
        }),
      ]),
    );

    // Test if specific device data like 'device_id' is emitted correctly
    expect(client.emit).toHaveBeenCalledWith('device_id', 'device1');
  });

  test('devices fetch failure', async () => {
    const error = new Error('Network error');
    get.mockRejectedValue(error);

    await client.devices();

    expect(client.emit).toHaveBeenCalledWith('error', expect.any(Error));
  });

  test('WebSocket connection and event handling', async () => {
    // Assuming WebSocketManager is mocked to simplify WebSocket interaction
    const wsMock = require('../src/WebSocketManager');
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'open') {
          callback(); // Simulate WebSocket 'open' event
        }
      }),
      send: jest.fn(),
      close: jest.fn(),
    };
    wsMock.mockImplementation(() => mockStream);

    client.connectStream();
    // Simulate WebSocket open event
    expect(mockStream.on).toHaveBeenCalledWith('open', expect.any(Function));
    expect(mockStream.send).toHaveBeenCalledWith({
      event: 'app_connection',
      orbit_session_token: client.token, // Ensure the token is being used
    });

    // Add checks for other events like 'message', 'error', and 'close'
  });

  test('configuration updates and retrieval', () => {
    client.connect({ debug: true, baseURL: 'https://api.orbitbhyve.com' });
    expect(client.configManager.getConfig()).toEqual(
      expect.objectContaining({
        debug: true,
        baseURL: 'https://api.orbitbhyve.com',
      }),
    );
  });

  test('detailed error handling on failed connection', async () => {
    const error = {
      response: {
        status: 500,
        data: 'Internal Server Error',
      },
    };
    post.mockRejectedValue(error);

    await client.connect();
    expect(client.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        message: 'Failed to connect to Orbit API',
        statusCode: 500,
        responseBody: 'Internal Server Error',
      }),
    );
  });
});
