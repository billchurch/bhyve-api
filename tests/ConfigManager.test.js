// test/ConfigManager.test.js

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ConfigManager from '../src/ConfigManager.js';

describe('ConfigManager', async () => {
  test('should instantiate with default configuration', () => {
    const configManager = new ConfigManager();
    const config = configManager.getConfig();

    assert.deepStrictEqual(config, ConfigManager.defaultConfig);
  });

  test('should instantiate with custom configuration', () => {
    const customConfig = {
      wssURL: 'wss://custom-url.com',
      baseURL: 'https://custom-url.com',
      timeout: 5000,
      debug: true,
    };

    const configManager = new ConfigManager(customConfig);
    const config = configManager.getConfig();

    assert.deepStrictEqual(config, {
      ...ConfigManager.defaultConfig,
      ...customConfig,
    });
  });

  test('should update configuration', () => {
    const configManager = new ConfigManager();
    const newConfig = {
      wssURL: 'wss://updated-url.com',
      timeout: 20000,
    };

    configManager.updateConfig(newConfig);
    const updatedConfig = configManager.getConfig();

    assert.deepStrictEqual(updatedConfig, {
      ...ConfigManager.defaultConfig,
      ...newConfig,
    });
  });

  test('should override payload size limits when provided', () => {
    const overrides = {
      maxContentLength: 1024,
      maxBodyLength: 2048,
    };

    const configManager = new ConfigManager(overrides);

    assert.deepStrictEqual(configManager.getConfig(), {
      ...ConfigManager.defaultConfig,
      ...overrides,
    });
  });

  test('should ensure immutability of configuration', () => {
    const configManager = new ConfigManager();
    const config = configManager.getConfig();

    assert.strictEqual(Object.isFrozen(config), true);
  });
});
