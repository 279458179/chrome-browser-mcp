/**
 * Chrome DevTools Protocol connection handling
 */

import http from 'http';
import net from 'net';
import puppeteer from 'puppeteer-core';
import { getChromeDebuggingPortEnv } from '../utils/platform.js';

/**
 * Check if a port has a Chrome DevTools server listening
 */
async function checkPortForChrome(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 1000;

    socket.setTimeout(timeout);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Get Chrome DevTools version info from a port
 */
async function getChromeVersionInfo(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: host,
      port: port,
      path: '/json/version',
      method: 'GET',
      timeout: 2000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

/**
 * Find existing Chrome running with remote debugging
 */
async function findExistingChrome(port) {
  const defaultPort = port || getChromeDebuggingPortEnv();

  // First check the default port
  const defaultPortAvailable = await checkPortForChrome(defaultPort);
  if (defaultPortAvailable) {
    const versionInfo = await getChromeVersionInfo(defaultPort);
    if (versionInfo && versionInfo.webSocketDebuggerUrl) {
      try {
        const browser = await puppeteer.connect({
          browserWSEndpoint: versionInfo.webSocketDebuggerUrl,
          defaultViewport: null,
        });
        return browser;
      } catch (error) {
        console.error('Failed to connect to Chrome on default port:', error);
      }
    }
  }

  // Scan additional ports (9222-9230 range)
  for (let p = 9222; p <= 9230; p++) {
    if (p === defaultPort) continue;

    const portAvailable = await checkPortForChrome(p);
    if (portAvailable) {
      const versionInfo = await getChromeVersionInfo(p);
      if (versionInfo && versionInfo.webSocketDebuggerUrl) {
        try {
          const browser = await puppeteer.connect({
            browserWSEndpoint: versionInfo.webSocketDebuggerUrl,
            defaultViewport: null,
          });
          return browser;
        } catch (error) {
          console.error(`Failed to connect to Chrome on port ${p}:`, error);
        }
      }
    }
  }

  return null;
}

/**
 * Connect to Chrome via browser URL
 */
async function connectToChromeByUrl(browserUrl) {
  try {
    const browser = await puppeteer.connect({
      browserURL: browserUrl,
      defaultViewport: null,
    });
    return browser;
  } catch (error) {
    console.error('Failed to connect to Chrome via URL:', error);
    return null;
  }
}

/**
 * Connect to Chrome via WebSocket endpoint
 */
async function connectToChrome(wsEndpoint) {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null,
    });
    return browser;
  } catch (error) {
    console.error('Failed to connect to Chrome via WebSocket:', error);
    return null;
  }
}

/**
 * Get list of available Chrome debugging targets
 */
async function getDebuggingTargets(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: host,
      port: port,
      path: '/json',
      method: 'GET',
      timeout: 2000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

/**
 * Check if Chrome is already running with remote debugging
 */
async function isChromeRunningWithDebugging(port) {
  const targetPort = port || getChromeDebuggingPortEnv();
  const versionInfo = await getChromeVersionInfo(targetPort);
  return versionInfo !== null;
}

export {
  findExistingChrome,
  connectToChromeByUrl,
  connectToChrome,
  getDebuggingTargets,
  isChromeRunningWithDebugging,
};