/**
 * Cross-platform Chrome profile paths detection
 */

import fs from 'fs';
import { detectPlatform, getHomeDir, getChromeProfileEnv, expandPath, getEnv } from './platform.js';

/**
 * Get Windows profile paths
 */
function getWindowsProfilePaths() {
  const localAppData = getEnv('LOCALAPPDATA');
  const appData = getEnv('APPDATA');
  const paths = [];

  if (localAppData) {
    paths.push(`${localAppData}\\Google\\Chrome\\User Data`);
    paths.push(`${localAppData}\\Chromium\\User Data`);
  }
  if (appData) {
    paths.push(`${appData}\\Google\\Chrome\\User Data`);
  }
  return paths;
}

/**
 * Get macOS profile paths
 */
function getMacOSProfilePaths() {
  return [
    '~/Library/Application Support/Google/Chrome',
    '~/Library/Application Support/Chromium',
  ];
}

/**
 * Get Linux profile paths
 */
function getLinuxProfilePaths() {
  return [
    '~/.config/google-chrome',
    '~/.config/chromium',
    '~/.config/google-chrome-beta',
    '~/.config/google-chrome-unstable',
  ];
}

/**
 * Get WSL Windows profile paths
 */
function getWSLWindowsProfilePaths() {
  return [
    '/mnt/c/Users/*/AppData/Local/Google/Chrome/User Data',
    '/mnt/c/Users/*/AppData/Roaming/Google/Chrome/User Data',
  ];
}

/**
 * Get Windows executable paths
 */
function getWindowsExecutablePaths() {
  const programFiles = getEnv('PROGRAMFILES');
  const programFilesX86 = getEnv('PROGRAMFILES(X86)');
  const localAppData = getEnv('LOCALAPPDATA');
  const paths = [];

  if (programFiles) {
    paths.push(`${programFiles}\\Google\\Chrome\\Application\\chrome.exe`);
    paths.push(`${programFiles}\\Chromium\\Application\\chrome.exe`);
  }
  if (programFilesX86) {
    paths.push(`${programFilesX86}\\Google\\Chrome\\Application\\chrome.exe`);
    paths.push(`${programFilesX86}\\Chromium\\Application\\chrome.exe`);
  }
  if (localAppData) {
    paths.push(`${localAppData}\\Google\\Chrome\\Application\\chrome.exe`);
    paths.push(`${localAppData}\\Chromium\\Application\\chrome.exe`);
  }
  return paths;
}

/**
 * Get macOS executable paths
 */
function getMacOSExecutablePaths() {
  return [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
  ];
}

/**
 * Get Linux executable paths
 */
function getLinuxExecutablePaths() {
  return [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/google-chrome',
    '/snap/bin/chromium',
  ];
}

/**
 * Find the first existing path from a list
 */
function findExistingPath(paths) {
  for (const path of paths) {
    const expandedPath = expandPath(path);
    // Skip paths with wildcards
    if (expandedPath.includes('*')) continue;
    try {
      if (fs.existsSync(expandedPath)) {
        return expandedPath;
      }
    } catch (e) {
      // Path doesn't exist
    }
  }
  return null;
}

/**
 * Get default Chrome profile path for current platform
 */
function getDefaultChromeProfilePath() {
  // Check environment override first
  const envPath = getChromeProfileEnv();
  if (envPath) {
    return expandPath(envPath);
  }

  const platform = detectPlatform();

  let paths;

  switch (platform) {
    case 'windows':
      paths = getWindowsProfilePaths();
      break;
    case 'macos':
      paths = getMacOSProfilePaths();
      break;
    case 'linux':
      paths = getLinuxProfilePaths();
      break;
    case 'wsl':
      paths = [...getLinuxProfilePaths(), ...getWSLWindowsProfilePaths()];
      break;
    default:
      paths = getLinuxProfilePaths();
  }

  return findExistingPath(paths);
}

/**
 * Get default Chrome executable path for current platform
 */
function getDefaultChromeExecutablePath() {
  // Check PUPPETEER_EXECUTABLE_PATH env
  const puppeteerEnv = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_EXECUTABLE_PATH;
  if (puppeteerEnv) {
    return expandPath(puppeteerEnv);
  }

  const platform = detectPlatform();

  let paths;

  switch (platform) {
    case 'windows':
      paths = getWindowsExecutablePaths();
      break;
    case 'macos':
      paths = getMacOSExecutablePaths();
      break;
    case 'linux':
      paths = getLinuxExecutablePaths();
      break;
    case 'wsl':
      paths = getLinuxExecutablePaths();
      break;
    default:
      paths = getLinuxExecutablePaths();
  }

  return findExistingPath(paths);
}

/**
 * Validate a profile path exists
 */
function validateProfilePath(path) {
  try {
    return fs.existsSync(expandPath(path));
  } catch (e) {
    return false;
  }
}

/**
 * Validate an executable path exists
 */
function validateExecutablePath(path) {
  try {
    return fs.existsSync(expandPath(path));
  } catch (e) {
    return false;
  }
}

export {
  getDefaultChromeProfilePath,
  getDefaultChromeExecutablePath,
  validateProfilePath,
  validateExecutablePath,
  getWindowsProfilePaths,
  getMacOSProfilePaths,
  getLinuxProfilePaths,
  getWindowsExecutablePaths,
  getMacOSExecutablePaths,
  getLinuxExecutablePaths,
};