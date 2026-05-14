/**
 * Content extraction tools: snapshot, screenshot, get_text
 */

let uidCounter = 0;

/**
 * Generate a unique UID for elements
 */
function generateUid() {
  uidCounter++;
  return `uid_${uidCounter}`;
}

/**
 * Reset UID counter
 */
function resetUidCounter() {
  uidCounter = 0;
}

/**
 * Format accessibility tree element as text with UIDs
 */
function formatElement(element, indent = 0) {
  const lines = [];
  const prefix = '  '.repeat(indent);

  if (!element) return lines;

  const uid = generateUid();
  const role = element.role || 'unknown';
  const name = element.name || '';
  const value = element.value || '';
  const description = element.description || '';

  let line = `${prefix}[${uid}] ${role}`;
  if (name) line += `: "${name}"`;
  if (value) line += ` (value: "${value}")`;
  if (description) line += ` [${description}]`;
  if (element.focused) line += ' [focused]';

  lines.push(line);

  if (element.children) {
    for (const child of element.children) {
      lines.push(...formatElement(child, indent + 1));
    }
  }

  return lines;
}

/**
 * Take accessibility tree snapshot with UIDs
 */
async function takeSnapshot(page) {
  try {
    resetUidCounter();

    const accessibilityTree = await page.accessibility.snapshot();

    return {
      elements: [],
      raw: accessibilityTree,
    };
  } catch (error) {
    throw new Error(`Failed to take snapshot: ${error}`);
  }
}

/**
 * Format snapshot as readable text
 */
function formatSnapshotText(snapshot) {
  const lines = ['Accessibility Tree Snapshot:'];
  lines.push('---');

  if (snapshot.raw) {
    resetUidCounter();
    lines.push(...formatElement(snapshot.raw));
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * Take a visual screenshot
 */
async function takeScreenshot(page, options = {}) {
  try {
    const screenshot = await page.screenshot({
      path: options.path,
      fullPage: options.fullPage ?? false,
      type: options.type ?? 'png',
      quality: options.quality,
    });

    return screenshot;
  } catch (error) {
    throw new Error(`Failed to take screenshot: ${error}`);
  }
}

/**
 * Get text content from the page
 */
async function getTextContent(page, selector) {
  try {
    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      const text = await element.evaluate((el) => el.textContent || '');
      return text.trim();
    } else {
      const text = await page.evaluate(() => document.body?.textContent || '');
      return text.trim();
    }
  } catch (error) {
    throw new Error(`Failed to get text content: ${error}`);
  }
}

/**
 * Get page title
 */
async function getPageTitle(page) {
  try {
    return await page.title();
  } catch (error) {
    throw new Error(`Failed to get page title: ${error}`);
  }
}

/**
 * Get page URL
 */
async function getPageUrl(page) {
  return page.url();
}

/**
 * Get page HTML content
 */
async function getHtmlContent(page) {
  try {
    return await page.content();
  } catch (error) {
    throw new Error(`Failed to get HTML content: ${error}`);
  }
}

export {
  takeSnapshot,
  formatSnapshotText,
  takeScreenshot,
  getTextContent,
  getPageTitle,
  getPageUrl,
  getHtmlContent,
  resetUidCounter,
};