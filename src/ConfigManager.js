// src/ConfigManager.js
export default class ConfigManager {
  static defaultConfig = {
    wssURL: 'wss://api.orbitbhyve.com/v1/events',
    baseURL: 'https://api.orbitbhyve.com',
    timeout: 10000,
    debug: false,
    /**
     * Limit the maximum size of responses and request bodies processed by Axios.
     * These defaults mitigate potential denial-of-service vectors caused by
     * unbounded payload sizes.
     */
    maxContentLength: 10 * 1024 * 1024, // 10 MB
    maxBodyLength: 10 * 1024 * 1024, // 10 MB
  };

  constructor(customConfig = {}) {
    this.config = { ...ConfigManager.defaultConfig, ...customConfig };
    Object.freeze(this.config); // Freeze the configuration object to make immutable
  }

  updateConfig(newConfig) {
    // When updating, ensure the result is also immutable
    this.config = Object.freeze({ ...this.config, ...newConfig });
  }

  getConfig() {
    // Return a copy of the configuration object
    return Object.freeze({ ...this.config });
  }
}
