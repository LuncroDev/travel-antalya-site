const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir:'./tests/browser', fullyParallel:true, workers:2, reporter:'list',
  use:{baseURL:'http://127.0.0.1:8091', launchOptions:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {}, screenshot:'only-on-failure'},
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer:{command:'node scripts/serve.js',url:'http://127.0.0.1:8091',reuseExistingServer:!process.env.CI}
});
