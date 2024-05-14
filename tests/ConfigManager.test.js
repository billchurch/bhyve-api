// test/ConfigManager.test.js
/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-expressions */
/* global describe, it */

import { expect } from 'chai';
import ConfigManager from '../src/ConfigManager.js';

describe('ConfigManager', () => {
  it('should instantiate with default configuration', () => {
    const configManager = new ConfigManager();
    const config = configManager.getConfig();

    expect(config).to.deep.equal(ConfigManager.defaultConfig);
  });

  it('should instantiate with custom configuration', () => {
    const customConfig = {
      wssURL: 'wss://custom-url.com',
      baseURL: 'https://custom-url.com',
      timeout: 5000,
      debug: true,
    };

    const configManager = new ConfigManager(customConfig);
    const config = configManager.getConfig();

    expect(config).to.deep.equal({
      ...ConfigManager.defaultConfig,
      ...customConfig,
    });
  });

  it('should update configuration', () => {
    const configManager = new ConfigManager();
    const newConfig = {
      wssURL: 'wss://updated-url.com',
      timeout: 20000,
    };

    configManager.updateConfig(newConfig);
    const updatedConfig = configManager.getConfig();

    expect(updatedConfig).to.deep.equal({
      ...ConfigManager.defaultConfig,
      ...newConfig,
    });
  });

  it('should ensure immutability of configuration', () => {
    const configManager = new ConfigManager();
    const config = configManager.getConfig();

    expect(Object.isFrozen(config)).to.be.true;
  });
});
