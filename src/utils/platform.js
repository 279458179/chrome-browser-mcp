/**
 * Cross-platform utility functions
 */

import fs from 'fs';

function detectPlatform() {
  const platform = process.platform;

  // Check for WSL (Windows Subsystem for Linux)
  if (platform === 'linux') {
    try {
      const release = fs.readFileSync('/proc/version', 'utf8');
      if (release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl')) {
        return 'wsl';
      }
    } catch (e) {
      // Not WSL
    }
    return 'linux';
  }

  if (platform === 'win32') {
    return 'windows';
  }

  if (platform === 'darwin') {
    return 'macos';
  }

  return 'linux';
}

function isWindows() {
  return detectPlatform() === 'windows';
}

function isMacOS() {
  return detectPlatform() === 'macos';
}

function isLinux() {
  return detectPlatform() === 'linux';
}

function isWSL() {
  return detectPlatform() === 'wsl';
}

function getHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || '';
}

function expandPath(path) {
  if (path.startsWith('~')) {
    return path.replace('~', getHomeDir());
  }
  return path;
}

function getEnv(key, fallback = '') {
  return process.env[key] || fallback;
}

function getChromeExecutableEnv() {
  return process.env.CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
}

function getChromeProfileEnv() {
  return process.env.CHROME_PROFILE_PATH;
}

function getChromeDebuggingPortEnv() {
  const port = process.env.CHROME_DEBUGGING_PORT;
  return port ? parseInt(port, 10) : 9222;
}

export {
  detectPlatform,
  isWindows,
  isMacOS,
  isLinux,
  isWSL,
  getHomeDir,
  expandPath,
  getEnv,
  getChromeExecutableEnv,
  getChromeProfileEnv,
  getChromeDebuggingPortEnv,
};