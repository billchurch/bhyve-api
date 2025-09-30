# bhyve-api

The `bhyve-api` module provides an unofficial Node.js interface to the Orbit B-hyve Irrigation Cloud API, allowing for easy integration with B-hyve smart irrigation systems. This module enables users to authenticate, retrieve device information, and interact with devices via a WebSocket connection. Should work with all Orbit B-hyve products which connect to a internet enabled gateway.

This is a bare-bones interface, See [bhyve-mqtt](https://github.com/billchurch/bhyve-mqtt) for a more complete example.

## Features

- Authenticate with the Orbit B-hyve API.
- Fetch user and device details.
- Manage real-time communication with devices using WebSockets.
- Emit and handle custom events.
- Custom error handling through `OrbitError`.

## Installation

Install the module using npm:

```bash
npm install --save bhyve-api
```

## Usage

Below is an example of how to use the `bhyve-api` to connect to the B-hyve API and interact with devices:

```javascript
const Orbit = require('bhyve-api');
require('dotenv').config();

// Initialize the client with configuration
const orbitClient = new Orbit({
  email: 'michael.bolton@innitech.com',
  password: 'PCloadLetter',
});

// Connect to the Orbit API
orbitClient.connect();

// Event listeners
orbitClient.on('authenticated', () => {
  console.log('Authenticated and received JWT.');
});

orbitClient.on('devices', (devices) => {
  console.log('Devices:', devices);
});

orbitClient.on('error', (error) => {
  console.error('An error occurred:', error);
});
```

## API Reference

### `Orbit(config)`

Initializes a new Orbit client.

#### Parameters

- `config` - A configuration object:
  - `email`: User's email for authentication. (required - _string_)
  - `password`: User's password for authentication. (required - _string_)
  - `baseURL`: API base URL. (optional - _string_ - default: https://api.orbitbhyve.com)
  - `timeout`: Request timeout in milliseconds. (optional - _integer_ - default: 10000)
  - `wssURL`: WebSocket URL. (optional - _string_ - default: wss://api.orbitbhyve.com/v1/events)
  - `maxContentLength`: Maximum number of response bytes Axios will process. (optional - _integer_ - default: 10485760)
  - `maxBodyLength`: Maximum number of request bytes Axios will send. (optional - _integer_ - default: 10485760)

### Events

- `authenticated`: Emits `true` after successful authentication.
- `devices`: Emitted when devices are fetched.
- `error`: Emitted on errors.

## OrbitError

The `OrbitError` class extends the standard JavaScript `Error` and provides structured error handling throughout the `bhyve-api`. It is designed to encapsulate errors more comprehensively, making it easier to debug issues when interacting with the Orbit B-hyve API.

### Features of OrbitError

- **Extended Error Information**: `OrbitError` captures not just the error message but also the HTTP status code and the response body if available, providing more context about what went wrong.
- **Integration with API Responses**: Automatically parses errors from HTTP responses to include detailed API error responses, making it easier to understand the source of failure.
- **Debugging Aid**: Includes original error object, if any, which can be useful for deep debugging sessions.

### Using OrbitError

`OrbitError` is used internally by the `bhyve-api` to handle errors that occur during API requests. When an error occurs, an `OrbitError` object is created and emitted through the module's event system. Here is how `OrbitError` is structured:

```javascript
class OrbitError extends Error {
  constructor(message, { originalError, data } = {}) {
    super(message);
    this.name = 'OrbitError';
    if (originalError && originalError.response) {
      this.statusCode = originalError.response.status;
      this.responseBody = originalError.response.data;
    }
    this.data = data;
  }
}
```

### Handling Errors in Your Application

When using the `bhyve-api`, you should set up error handling to catch and process `OrbitError` objects. This can be done by listening for the `error` event on the client instance:

```javascript
orbitClient.on('error', (error) => {
  console.error('An error occurred:', error.message);
  if (error.statusCode) {
    console.log('HTTP Status:', error.statusCode);
  }
  if (error.responseBody) {
    console.log('Response Body:', JSON.stringify(error.responseBody));
  }
});
```

## Debug

This packages uses the [debug](https://www.npmjs.com/package/debug) package for NPM to enable additional logging detail.

#### Enabling Debug Output

To see the debug output, you must set the `DEBUG` environment variable to include the namespace `bhyve-api` you want to enable. For your application, you can enable it by running:

```bash
DEBUG=bhyve-api node yourscript.js
```

This will enable debug logging for anything under the `bhyve-api` namespace.

#### Controlling Output

You can enable multiple debug namespaces simultaneously by separating them with a comma, or use `*` as a wildcard to enable all debugging:

```bash
DEBUG=bhyve-api,another-namespace node yourscript.js
```

or

```bash
DEBUG=* node yourscript.js
```

## Contributing

Contributions are welcome! Please refer to the repository's [issues page](https://github.com/billchurch/bhyve-api/issues) for things to work on, or create your own issues.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This project, "bhyve-api", is an independent and unofficial API interface not officially supported or endorsed by Orbit Irrigation Products, LLC. or its affiliates. The project is developed and maintained by independent contributors and aims to provide additional functionality and user-driven extensions to the official Orbit B-hyve products.

The terms "Orbit" and "B-hyve" are trademarks of Orbit Irrigation Products, Inc., and are used here for descriptive purposes only. The use of these terms in this project does not imply any affiliation with or endorsement by Orbit Irrigation Products, Inc. This project is not part of the Orbit B-hyve product suite offered by Orbit Irrigation Products, Inc.

The developers of "bhyve-api" are not responsible for any issues that arise from the use of this software, including but not limited to data loss or hardware damage. Users are encouraged to review the source code and ensure the project meets their needs before integration and use in personal or production environments.

Please use this project responsibly and in accordance with the terms of service of any involved products or platforms.
