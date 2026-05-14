/**
 * Chrome launching with user profile preservation
 */

import puppeteer from 'puppeteer-core';
import { detectPlatform, isWSL, expandPath } from '../utils/platform.js';
import { getDefaultChromeProfilePath, getDefaultChromeExecutablePath, validateExecutablePath } from '../utils/paths.js';

/**
 * Build Chrome launch arguments
 */
function buildLaunchArgs(config) {
  const args = [
    `--remote-debugging-port=${config.debuggingPort || 9222}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-client-side-phishing-detection',
    '--disable-default-apps',
    '--disable-extensions-except=',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--enable-automation',
    '--password-store=basic',
    '--use-mock-keychain',
    '--disable-blink-features=AutomationControlled',
  ];

  // Note: user-data-dir is handled via userDataDir option in puppeteer.launch
  // Don't add it here to avoid conflicts

  // WSL specific: Use IPv4 to avoid IPv6 issues on macOS
  if (isWSL() || detectPlatform() === 'macos') {
    args.push('--remote-debugging-address=127.0.0.1');
  }

  // Add headless mode if configured
  if (config.headless) {
    args.push('--headless=new');
    args.push('--disable-gpu');
    // Add sandbox args for headless on Windows
    args.push('--no-sandbox');
    args.push('--disable-setuid-sandbox');
  }

  return args;
}

/**
 * Launch Chrome with user profile
 */
async function launchChrome(config) {
  try {
    // Determine executable path
    let executablePath = config.executablePath;
    if (!executablePath) {
      executablePath = getDefaultChromeExecutablePath();
    }

    if (!executablePath) {
      // Try to find Chrome using puppeteer's built-in detection
      try {
        executablePath = puppeteer.executablePath();
      } catch (e) {
        // Ignore
      }
    }

    if (!executablePath) {
      console.error('Chrome executable not found. Please install Chrome or set CHROME_EXECUTABLE_PATH environment variable.');
      return null;
    }

    // Validate executable exists
    if (!validateExecutablePath(executablePath)) {
      console.error(`Chrome executable not found at: ${executablePath}`);
      // Still try to launch - puppeteer might find it
    }

    // Determine profile path - only use user profile for non-headless mode
    // Headless mode should NOT use user profile to avoid conflicts with running Chrome
    // AND because user Chrome profile may be locked by running Chrome instance
    let profilePath = config.profilePath;
    const isHeadless = config.headless ?? false;

    // IMPORTANT: In headless mode, never use user profile
    // This prevents conflicts with any Chrome instance that might be running
    if (isHeadless) {
      profilePath = undefined; // Force temp profile for headless
    } else if (!profilePath) {
      profilePath = getDefaultChromeProfilePath();
    }

    console.error('Launching Chrome...');
    console.error('Executable path:', executablePath);
    console.error('Headless mode:', isHeadless);
    console.error('Profile path:', profilePath || 'temporary (auto-created)');

    // Use puppeteer's standard launch options
    const browser = await puppeteer.launch({
      executablePath: expandPath(executablePath),
      headless: isHeadless,
      // Only set userDataDir for non-headless (preserves login sessions)
      // For headless, let puppeteer create a temporary profile
      userDataDir: profilePath ? expandPath(profilePath) : undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      defaultViewport: null,
    });

    return browser;
  } catch (error) {
    console.error('Failed to launch Chrome:', error);
    return null;
  }
}

/**
 * Launch Chrome in temporary (isolated) mode
 */
async function launchChromeTemporary(config) {
  return launchChrome({
    ...config,
    profilePath: undefined,
  });
}

/**
 * Launch Chrome with a specific profile directory name
 */
async function launchChromeWithProfileName(profileName, config = {}) {
  const baseProfilePath = getDefaultChromeProfilePath();
  const profilePath = baseProfilePath ? `${baseProfilePath}/${profileName}` : undefined;

  return launchChrome({
    ...config,
    profilePath,
  });
}

export {
  launchChrome,
  launchChromeTemporary,
  launchChromeWithProfileName,
};