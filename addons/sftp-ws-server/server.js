"use strict";

const express             = require('express');
const http                = require('http');
const {JsonWebTokenError} = require("jsonwebtoken");
const jwt                 = require('jsonwebtoken');
const url                 = require('url');
const util                = require('util');
const SFTP                = require("@inveniem/sftp-ws");

const FilteredFilesystem  = require('./lib/FilteredFilesystem');
const JwtScopedSftpServer = require('./lib/JwtScopedSftpServer');

//==============================================================================
// Constants
//==============================================================================
// Specify host and port for the HTTP + SFTP server WebSocket endpoint.
const APP_HOSTNAME    = 'localhost';
const APP_PORT        = (process.env.SFTP_WS_PORT || 4002);
const APP_HOST        = APP_HOSTNAME + ":" + APP_PORT;
const APP_ENDPOINT    = '/sftp';
const JWT_HMAC_SECRET = process.env.JWT_HMAC_SECRET;

//==============================================================================
// Main Body
//==============================================================================
if (!JWT_HMAC_SECRET) {
  throw new Error('JWT_HMAC_SECRET must be provided in environment.');
}

const app = express();

// FIXME: For debug - serve static files from 'client' subfolder.
app.use(express.static(__dirname + '/client'));

// Specify what origins allowed to connect to this app via regular expressions.
//
// NOTE: Though "Origin" is not spoof-able in a browser, it is totally
// spoof-able via CLI tools.
const ALLOWED_ORIGINS = JSON.parse(process.env.ALLOWED_ORIGINS || '[]');

// Create an HTTP server to handle protocol switching.
const server = http.createServer(app);

// Start SFTP over WebSockets server.
const sftp = new JwtScopedSftpServer(
  APP_HOST,
  ALLOWED_ORIGINS,
  JWT_HMAC_SECRET,
  {
  server:      server,
  virtualRoot: __dirname + '/files',
  path:        APP_ENDPOINT,
  log:         console // log to console
});

// Start accepting requests.
server.listen(APP_PORT, APP_HOSTNAME, function () {
  const host = server.address().address;

  console.log('HTTP server listening at http://%s:%s', host, APP_PORT);
  console.log('WS-SFTP server listening at ws://%s:%s%s', host, APP_PORT, APP_ENDPOINT);
});
