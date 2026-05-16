// canvas2d-client/playwright.config.js
module.exports = {
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:8765',
  },
  webServer: {
    command: 'python3 -m http.server 8765',
    url: 'http://localhost:8765',
    cwd: './www',
    reuseExistingServer: true,
  },
};
