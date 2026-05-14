/**
 * Browser lifecycle manager
 */

import { getChromeDebuggingPortEnv } from '../utils/platform.js';
import { getDefaultChromeProfilePath, getDefaultChromeExecutablePath } from '../utils/paths.js';
import { findExistingChrome } from './connection.js';
import { launchChrome } from './launcher.js';

/**
 * Generate unique ID for pages
 */
function generatePageId() {
  return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new browser manager instance
 */
export function createBrowserManager(config = {}) {
  return {
    browser: null,
    context: null,
    page: null,
    state: 'disconnected',
    config: {
      debuggingPort: config.debuggingPort ?? getChromeDebuggingPortEnv(),
      autoConnect: config.autoConnect ?? true,
      launchIfNotFound: config.launchIfNotFound ?? true,
      headless: config.headless ?? false,
      profilePath: config.profilePath ?? getDefaultChromeProfilePath(),
      executablePath: config.executablePath ?? getDefaultChromeExecutablePath(),
    },
    pages: new Map(),
    activePageId: null,
  };
}

/**
 * Connect to or launch a browser
 */
export async function connectBrowser(manager) {
  if (manager.state === 'connected') {
    return true;
  }

  manager.state = 'connecting';

  try {
    // Try to connect to existing Chrome first
    if (manager.config.autoConnect) {
      const existingBrowser = await findExistingChrome(manager.config.debuggingPort);
      if (existingBrowser) {
        manager.browser = existingBrowser;
        manager.state = 'connected';

        // Get existing pages
        const pages = await existingBrowser.pages();
        for (const page of pages) {
          const pageId = generatePageId();
          manager.pages.set(pageId, page);
          if (!manager.activePageId) {
            manager.activePageId = pageId;
            manager.page = page;
          }
        }

        return true;
      }
    }

    // Launch new Chrome if configured
    if (manager.config.launchIfNotFound) {
      const browser = await launchChrome(manager.config);
      if (browser) {
        manager.browser = browser;
        manager.state = 'connected';

        // Get the first page
        const pages = await browser.pages();
        if (pages.length > 0) {
          const pageId = generatePageId();
          manager.pages.set(pageId, pages[0]);
          manager.activePageId = pageId;
          manager.page = pages[0];
        }

        return true;
      }
    }

    manager.state = 'error';
    return false;
  } catch (error) {
    manager.state = 'error';
    console.error('Failed to connect browser:', error);
    return false;
  }
}

/**
 * Disconnect from the browser
 */
export async function disconnectBrowser(manager) {
  if (manager.browser && manager.state === 'connected') {
    try {
      await manager.browser.disconnect();
    } catch (error) {
      console.error('Error disconnecting browser:', error);
    }
  }

  manager.browser = null;
  manager.context = null;
  manager.page = null;
  manager.state = 'disconnected';
  manager.pages.clear();
  manager.activePageId = null;
}

/**
 * Create a new page (tab)
 */
export async function newPage(manager) {
  if (!manager.browser || manager.state !== 'connected') {
    return null;
  }

  try {
    const page = await manager.browser.newPage();
    const pageId = generatePageId();
    manager.pages.set(pageId, page);
    manager.activePageId = pageId;
    manager.page = page;
    return page;
  } catch (error) {
    console.error('Failed to create new page:', error);
    return null;
  }
}

/**
 * Close a specific page
 */
export async function closePage(manager, pageId) {
  const targetId = pageId || manager.activePageId;
  if (!targetId) {
    return false;
  }

  const page = manager.pages.get(targetId);
  if (!page) {
    return false;
  }

  try {
    await page.close();
    manager.pages.delete(targetId);

    // Switch to another page if the active one was closed
    if (manager.activePageId === targetId) {
      const remainingPages = Array.from(manager.pages.keys());
      if (remainingPages.length > 0) {
        manager.activePageId = remainingPages[0];
        manager.page = manager.pages.get(manager.activePageId);
      } else {
        manager.activePageId = null;
        manager.page = null;
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to close page:', error);
    return false;
  }
}

/**
 * Select/switch to a specific page
 */
export async function selectPage(manager, pageId) {
  const page = manager.pages.get(pageId);
  if (!page) {
    return null;
  }

  try {
    await page.bringToFront();
    manager.activePageId = pageId;
    manager.page = page;
    return page;
  } catch (error) {
    console.error('Failed to select page:', error);
    return null;
  }
}

/**
 * List all pages with their info
 */
export async function listPages(manager) {
  if (!manager.browser || manager.state !== 'connected') {
    return [];
  }

  const pageInfoList = [];

  for (const [id, page] of manager.pages.entries()) {
    try {
      const url = page.url();
      const title = await page.title();
      pageInfoList.push({
        id,
        url,
        title,
        isActive: id === manager.activePageId,
      });
    } catch (error) {
      pageInfoList.push({
        id,
        url: 'unknown',
        title: 'unknown',
        isActive: id === manager.activePageId,
      });
    }
  }

  return pageInfoList;
}

/**
 * Get the active page
 */
export function getActivePage(manager) {
  return manager.page;
}

/**
 * Get current connection state
 */
export function getState(manager) {
  return manager.state;
}

/**
 * Check if browser is connected
 */
export function isConnected(manager) {
  return manager.state === 'connected';
}