/**
 * Emulation tools: viewport, geolocation, user-agent, etc.
 */

import puppeteer from 'puppeteer-core';

/**
 * Emulate viewport dimensions
 */
async function emulateViewport(page, width, height, options = {}) {
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: options.deviceScaleFactor || 1,
    mobile: options.mobile || false,
    hasTouch: options.hasTouch || false,
    isLandscape: options.landscape || false,
  });

  return `Viewport set to ${width}x${height}`;
}

/**
 * Emulate a specific device
 */
async function emulateDevice(page, deviceName) {
  try {
    // Try to find device in puppeteer's devices
    let device = null;
    if (puppeteer.devices && puppeteer.devices[deviceName]) {
      device = puppeteer.devices[deviceName];
    }

    if (!device) {
      throw new Error(`Device "${deviceName}" not found.`);
    }

    await page.emulate(device);
    return `Emulating device "${deviceName}"`;
  } catch (error) {
    throw new Error(`Device "${deviceName}" not found. Use viewport emulation instead.`);
  }
}

/**
 * List available devices for emulation
 */
function getAvailableDevices() {
  return [
    'iPhone 4', 'iPhone 5', 'iPhone 6', 'iPhone 6 Plus',
    'iPhone 7', 'iPhone 7 Plus', 'iPhone 8', 'iPhone 8 Plus',
    'iPhone X', 'iPhone SE', 'iPhone 11', 'iPhone 12',
    'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 12 Mini',
    'iPad', 'iPad Mini', 'iPad Pro',
    'Galaxy S5', 'Galaxy S8', 'Galaxy S9+', 'Galaxy Tab S4',
    'Nexus 4', 'Nexus 5', 'Nexus 5X', 'Nexus 6', 'Nexus 6P',
    'Nexus 7', 'Nexus 10',
    'Pixel 2', 'Pixel 2 XL', 'Pixel 3', 'Pixel 4', 'Pixel 4 XL',
  ];
}

/**
 * Set custom user agent
 */
async function setUserAgent(page, userAgent) {
  await page.setUserAgent(userAgent);
  return `User agent set to "${userAgent}"`;
}

/**
 * Reset user agent to default
 */
async function resetUserAgent(page) {
  await page.setUserAgent('');
  return 'User agent reset to default';
}

/**
 * Set geolocation
 */
async function setGeolocation(page, latitude, longitude, accuracy) {
  await page.setGeolocation({ latitude, longitude, accuracy: accuracy || 0 });
  return `Geolocation set to (${latitude}, ${longitude})`;
}

/**
 * Clear geolocation override
 */
async function clearGeolocation(page) {
  await page.setGeolocation({ latitude: 0, longitude: 0 });
  return 'Geolocation override cleared';
}

/**
 * Emulate color scheme (light/dark mode)
 */
async function emulateColorScheme(page, scheme) {
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: scheme },
  ]);
  return `Color scheme set to "${scheme}"`;
}

/**
 * Emulate reduced motion
 */
async function emulateReducedMotion(page, reduced) {
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
  ]);
  return `Reduced motion set to ${reduced}`;
}

/**
 * Emulate vision deficiency
 */
async function emulateVisionDeficiency(page, type) {
  await page.emulateVisionDeficiency(type);
  return `Vision deficiency set to "${type}"`;
}

/**
 * Emulate timezone
 */
async function emulateTimezone(page, timezone) {
  await page.emulateTimezone(timezone);
  return `Timezone set to "${timezone}"`;
}

/**
 * Emulate idle state
 */
async function emulateIdleState(page, isIdle) {
  if (isIdle) {
    await page.emulateIdleState({ isUserActive: false, isScreenUnlocked: false });
  } else {
    await page.emulateIdleState({ isUserActive: true, isScreenUnlocked: true });
  }
  return `Idle state set to ${isIdle}`;
}

/**
 * Disable JavaScript
 */
async function disableJavaScript(page) {
  await page.setJavaScriptEnabled(false);
  return 'JavaScript disabled';
}

/**
 * Enable JavaScript
 */
async function enableJavaScript(page) {
  await page.setJavaScriptEnabled(true);
  return 'JavaScript enabled';
}

/**
 * Emulate CPU throttling
 */
async function emulateCpuThrottling(page, rate) {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate });
  return `CPU throttling rate set to ${rate}`;
}

/**
 * Emulate network conditions
 */
async function emulateNetworkConditions(page, conditions) {
  const client = await page.context().newCDPSession(page);

  const presets = {
    offline: { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 },
    slow3g: { offline: false, latency: 400 * 5, downloadThroughput: (500 * 1024) / 8, uploadThroughput: (500 * 1024) / 8 },
    fast3g: { offline: false, latency: 150 * 5, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (768 * 1024) / 8 },
    slow4g: { offline: false, latency: 200, downloadThroughput: (2 * 1024 * 1024) / 8, uploadThroughput: (1 * 1024 * 1024) / 8 },
    fast4g: { offline: false, latency: 50, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 },
  };

  const preset = presets[conditions];
  await client.send('Network.emulateNetworkConditions', preset);
  return `Network conditions set to "${conditions}"`;
}

export {
  emulateViewport,
  emulateDevice,
  getAvailableDevices,
  setUserAgent,
  resetUserAgent,
  setGeolocation,
  clearGeolocation,
  emulateColorScheme,
  emulateReducedMotion,
  emulateVisionDeficiency,
  emulateTimezone,
  emulateIdleState,
  disableJavaScript,
  enableJavaScript,
  emulateCpuThrottling,
  emulateNetworkConditions,
};