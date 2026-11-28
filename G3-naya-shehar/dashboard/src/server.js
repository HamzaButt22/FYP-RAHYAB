'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { createApp } = require('./app');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const { app } = createApp({
  dbPath: path.join(dataDir, 'naya-shehar.db'),
  adminUser: process.env.ADMIN_USER,
  adminPassword: process.env.ADMIN_PASSWORD,
  secureCookies: process.env.COOKIE_SECURE === '1',
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => console.log(`[naya-shehar] Dashboard running on http://localhost:${port}`));
