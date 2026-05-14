/**
 * Wait and synchronization tools
 */

/**
 * Wait for text to appear on page
 */
async function waitForText(page, text, options = {}) {
  try {
    const timeout = options.timeout || 30000;

    await page.waitForFunction(
      (searchText) => {
        return document.body?.innerText?.includes(searchText);
      },
      { timeout },
      text
    );

    return `Text "${text}" appeared on page`;
  } catch (error) {
    throw new Error(`Timeout waiting for text "${text}": ${error}`);
  }
}

/**
 * Wait for selector to appear
 */
async function waitForSelector(page, selector, options = {}) {
  try {
    const timeout = options.timeout || 30000;

    await page.waitForSelector(selector, {
      timeout,
      visible: options.visible,
      hidden: options.hidden,
    });

    return `Selector "${selector}" appeared on page`;
  } catch (error) {
    throw new Error(`Timeout waiting for selector "${selector}": ${error}`);
  }
}

/**
 * Wait for URL to match
 */
async function waitForUrl(page, urlPattern, options = {}) {
  try {
    const timeout = options.timeout || 30000;

    await page.waitForFunction(
      (pattern) => {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return regex.test(window.location.href);
      },
      { timeout },
      typeof urlPattern === 'string' ? urlPattern : urlPattern.source
    );

    return `URL matched pattern`;
  } catch (error) {
    throw new Error(`Timeout waiting for URL pattern: ${error}`);
  }
}

/**
 * Wait for navigation to complete
 */
async function waitForNavigation(page, options = {}) {
  try {
    const timeout = options.timeout || 30000;

    await page.waitForNavigation({
      timeout,
      waitUntil: options.waitUntil || 'domcontentloaded',
    });

    return `Navigation completed`;
  } catch (error) {
    throw new Error(`Timeout waiting for navigation: ${error}`);
  }
}

/**
 * Wait for a specific amount of time
 */
async function waitForTimeout(page, milliseconds) {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
  return `Waited ${milliseconds}ms`;
}

/**
 * Wait for function to return true
 */
async function waitForFunction(page, fn, options = {}) {
  try {
    const timeout = options.timeout || 30000;

    await page.waitForFunction(fn, { timeout });

    return `Function condition satisfied`;
  } catch (error) {
    throw new Error(`Timeout waiting for function: ${error}`);
  }
}

/**
 * Wait for network to be idle
 */
async function waitForNetworkIdle(page, options = {}) {
  try {
    await new Promise(resolve => setTimeout(resolve, options.idleTime || 500));
    return `Network considered idle`;
  } catch (error) {
    throw new Error(`Failed waiting for network idle: ${error}`);
  }
}

export {
  waitForText,
  waitForSelector,
  waitForUrl,
  waitForNavigation,
  waitForTimeout,
  waitForFunction,
  waitForNetworkIdle,
};