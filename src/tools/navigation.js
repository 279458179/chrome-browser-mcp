/**
 * Navigation tools: navigate, back, forward, reload
 */

/**
 * Navigate to a URL
 */
async function navigateToUrl(page, url, options = {}) {
  try {
    const response = await page.goto(url, {
      timeout: options.timeout || 30000,
      waitUntil: options.waitUntil || 'domcontentloaded',
    });

    const status = response?.status() || 'unknown';
    return `Navigated to ${url} (status: ${status})`;
  } catch (error) {
    throw new Error(`Failed to navigate to ${url}: ${error}`);
  }
}

/**
 * Navigate back in history
 */
async function navigateBack(page) {
  try {
    await page.goBack({
      waitUntil: 'domcontentloaded',
    });
    const url = page.url();
    return `Navigated back to ${url}`;
  } catch (error) {
    throw new Error(`Failed to navigate back: ${error}`);
  }
}

/**
 * Navigate forward in history
 */
async function navigateForward(page) {
  try {
    await page.goForward({
      waitUntil: 'domcontentloaded',
    });
    const url = page.url();
    return `Navigated forward to ${url}`;
  } catch (error) {
    throw new Error(`Failed to navigate forward: ${error}`);
  }
}

/**
 * Reload the current page
 */
async function reloadPage(page, options = {}) {
  try {
    await page.reload({
      timeout: options.timeout || 30000,
      waitUntil: options.waitUntil || 'domcontentloaded',
    });
    return `Page reloaded`;
  } catch (error) {
    throw new Error(`Failed to reload page: ${error}`);
  }
}

export {
  navigateToUrl,
  navigateBack,
  navigateForward,
  reloadPage,
};