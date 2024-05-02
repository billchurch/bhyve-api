// ConfigManager.js
export default class ConfigManager {
  static defaultConfig = {
    wssURL: 'wss://api.orbitbhyve.com/v1/events',
    baseURL: 'https://api.orbitbhyve.com',
    timeout: 10000,
    debug: false,
  };

  constructor(customConfig = {}) {
    this.config = { ...ConfigManager.defaultConfig, ...customConfig };
    Object.freeze(this.config); // Freeze the configuration object
  }

  updateConfig(newConfig) {
    // When updating, ensure the result is also immutable
    this.config = Object.freeze({ ...this.config, ...newConfig });
  }

  getConfig() {
    return this.config;
  }
}
