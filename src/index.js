#!/usr/bin/env node
/**
 * Chrome Browser MCP Server
 * Universal browser automation with user profile preservation
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import * as browser from './browser/index.js';
import * as tools from './tools/index.js';

// Create a singleton browser manager
let browserManager = null;

/**
 * Get or create the browser manager
 */
function getManager() {
  if (!browserManager) {
    browserManager = browser.createBrowserManager();
  }
  return browserManager;
}

/**
 * Ensure browser is connected before executing tool
 */
async function ensureConnected() {
  const manager = getManager();
  if (!browser.isConnected(manager)) {
    const connected = await browser.connectBrowser(manager);
    if (!connected) {
      throw new Error('Failed to connect to browser. Make sure Chrome is installed.');
    }
  }
}

/**
 * Get the active page, creating one if needed
 */
async function getActivePageOrCreate() {
  const manager = getManager();
  await ensureConnected();

  let page = browser.getActivePage(manager);
  if (!page) {
    page = await browser.newPage(manager);
  }

  if (!page) {
    throw new Error('No active page available');
  }

  return page;
}

// Create MCP server instance
const server = new McpServer({
  name: 'chrome-browser-mcp',
  version: '1.0.0',
});

// ============================================
// Browser Connection Tools
// ============================================

server.tool(
  'browser_connect',
  'Connect to Chrome browser. Auto-detects existing Chrome or launches a new instance with user profile.',
  {
    profilePath: z.string().optional().describe('Optional Chrome profile path. Defaults to user\'s Chrome profile.'),
    debuggingPort: z.number().optional().describe('Remote debugging port. Defaults to 9222.'),
    headless: z.boolean().optional().describe('Run in headless mode. Defaults to false.'),
  },
  async (params) => {
    const manager = getManager();

    // Update config with params
    if (params.profilePath) manager.config.profilePath = params.profilePath;
    if (params.debuggingPort) manager.config.debuggingPort = params.debuggingPort;
    if (params.headless) manager.config.headless = params.headless;

    const connected = await browser.connectBrowser(manager);

    return {
      content: [{
        type: 'text',
        text: connected
          ? 'Successfully connected to Chrome browser. Your login sessions are preserved.'
          : 'Failed to connect to Chrome. Please ensure Chrome is installed.',
      }],
    };
  }
);

server.tool(
  'browser_disconnect',
  'Disconnect from the browser. Preserves your existing Chrome session.',
  {},
  async () => {
    const manager = getManager();
    await browser.disconnectBrowser(manager);

    return {
      content: [{
        type: 'text',
        text: 'Disconnected from browser. Your Chrome session is preserved.',
      }],
    };
  }
);

// ============================================
// Navigation Tools
// ============================================

server.tool(
  'browser_navigate',
  'Navigate to a URL in the current page.',
  {
    url: z.string().describe('URL to navigate to'),
    timeout: z.number().optional().describe('Navigation timeout in milliseconds'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.navigateToUrl(page, params.url, { timeout: params.timeout });

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_back',
  'Navigate back in browser history.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const result = await tools.navigateBack(page);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_forward',
  'Navigate forward in browser history.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const result = await tools.navigateForward(page);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_reload',
  'Reload the current page.',
  {
    timeout: z.number().optional().describe('Reload timeout in milliseconds'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.reloadPage(page, { timeout: params.timeout });

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

// ============================================
// Content Tools
// ============================================

server.tool(
  'browser_snapshot',
  'Take accessibility tree snapshot with element UIDs for interaction. More token-efficient than screenshots.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const snapshot = await tools.takeSnapshot(page);
    const text = tools.formatSnapshotText(snapshot);

    return {
      content: [{ type: 'text', text }],
    };
  }
);

server.tool(
  'browser_screenshot',
  'Take a visual screenshot of the page.',
  {
    fullPage: z.boolean().optional().describe('Capture full page instead of viewport'),
    path: z.string().optional().describe('Path to save the screenshot'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const screenshot = await tools.takeScreenshot(page, {
      fullPage: params.fullPage,
      path: params.path,
    });

    // Return as base64 image
    const base64 = screenshot.toString('base64');

    return {
      content: [
        { type: 'text', text: 'Screenshot captured.' },
        { type: 'image', data: base64, mimeType: 'image/png' },
      ],
    };
  }
);

server.tool(
  'browser_get_text',
  'Get text content from the page or a specific element.',
  {
    selector: z.string().optional().describe('CSS selector. If omitted, gets all page text.'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const text = await tools.getTextContent(page, params.selector);

    return {
      content: [{ type: 'text', text }],
    };
  }
);

server.tool(
  'browser_get_html',
  'Get HTML content of the page.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const html = await tools.getHtmlContent(page);

    return {
      content: [{ type: 'text', text: html }],
    };
  }
);

server.tool(
  'browser_get_url',
  'Get current page URL.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const url = await tools.getPageUrl(page);

    return {
      content: [{ type: 'text', text: url }],
    };
  }
);

server.tool(
  'browser_get_title',
  'Get current page title.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const title = await tools.getPageTitle(page);

    return {
      content: [{ type: 'text', text: title }],
    };
  }
);

// ============================================
// Interaction Tools
// ============================================

server.tool(
  'browser_click',
  'Click an element. Use UIDs from snapshot or CSS selectors.',
  {
    target: z.string().describe('Element UID from snapshot or CSS selector'),
    doubleClick: z.boolean().optional().describe('Double-click instead of single click'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.clickElement(page, params.target, { doubleClick: params.doubleClick });

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_fill',
  'Fill input, textarea, or select element with value. Use UIDs from snapshot or CSS selectors.',
  {
    target: z.string().describe('Element UID from snapshot or CSS selector'),
    value: z.string().describe('Value to fill'),
    clear: z.boolean().optional().describe('Clear existing content before filling'),
    submit: z.boolean().optional().describe('Press Enter after filling'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.fillElement(page, params.target, params.value, {
      clear: params.clear,
      submit: params.submit,
    });

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_type',
  'Type text into the currently focused element.',
  {
    text: z.string().describe('Text to type'),
    submitKey: z.string().optional().describe('Key to press after typing (e.g., Enter, Tab)'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.typeText(page, params.text, { submitKey: params.submitKey });

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_hover',
  'Hover over an element. Use UIDs from snapshot or CSS selectors.',
  {
    target: z.string().describe('Element UID from snapshot or CSS selector'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.hoverElement(page, params.target);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_press_key',
  'Press a keyboard key or combination (e.g., Enter, Control+A, Escape).',
  {
    key: z.string().describe('Key or key combination to press'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.pressKey(page, params.key);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_scroll',
  'Scroll the page or an element.',
  {
    x: z.number().optional().describe('Horizontal scroll amount'),
    y: z.number().optional().describe('Vertical scroll amount'),
    selector: z.string().optional().describe('CSS selector for element to scroll into view'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.scrollPage(page, {
      x: params.x,
      y: params.y,
      selector: params.selector,
    });

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_drag',
  'Drag an element and drop onto another element.',
  {
    source: z.string().describe('Source element UID or selector'),
    target: z.string().describe('Target element UID or selector'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.dragAndDrop(page, params.source, params.target);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

// ============================================
// Tab/Page Management Tools
// ============================================

server.tool(
  'browser_new_page',
  'Open a new tab/page.',
  {
    url: z.string().optional().describe('URL to open in the new tab'),
  },
  async (params) => {
    const manager = getManager();
    await ensureConnected();

    const page = await browser.newPage(manager);
    if (!page) {
      return {
        content: [{ type: 'text', text: 'Failed to create new page' }],
      };
    }

    if (params.url) {
      await tools.navigateToUrl(page, params.url);
    }

    return {
      content: [{ type: 'text', text: params.url ? `New page opened and navigated to ${params.url}` : 'New page opened' }],
    };
  }
);

server.tool(
  'browser_close_page',
  'Close the current or specified tab.',
  {
    pageId: z.string().optional().describe('Page ID to close. If omitted, closes current page.'),
  },
  async (params) => {
    const manager = getManager();
    const result = await browser.closePage(manager, params.pageId);

    return {
      content: [{ type: 'text', text: result ? 'Page closed' : 'Failed to close page' }],
    };
  }
);

server.tool(
  'browser_list_pages',
  'List all open tabs/pages.',
  {},
  async () => {
    const manager = getManager();
    const pages = await browser.listPages(manager);

    const text = pages.map(p =>
      `${p.id}: ${p.title} (${p.url})${p.isActive ? ' [ACTIVE]' : ''}`
    ).join('\n');

    return {
      content: [{ type: 'text', text: text || 'No pages open' }],
    };
  }
);

server.tool(
  'browser_select_page',
  'Switch to a specific tab/page.',
  {
    pageId: z.string().describe('Page ID to switch to'),
  },
  async (params) => {
    const manager = getManager();
    const page = await browser.selectPage(manager, params.pageId);

    return {
      content: [{ type: 'text', text: page ? `Switched to page ${params.pageId}` : 'Failed to switch page' }],
    };
  }
);

// ============================================
// Wait Tools
// ============================================

server.tool(
  'browser_wait_for',
  'Wait for text or selector to appear on page.',
  {
    text: z.string().optional().describe('Text to wait for'),
    selector: z.string().optional().describe('CSS selector to wait for'),
    timeout: z.number().optional().describe('Timeout in milliseconds'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();

    if (params.text) {
      const result = await tools.waitForText(page, params.text, { timeout: params.timeout });
      return { content: [{ type: 'text', text: result }] };
    }

    if (params.selector) {
      const result = await tools.waitForSelector(page, params.selector, { timeout: params.timeout });
      return { content: [{ type: 'text', text: result }] };
    }

    return {
      content: [{ type: 'text', text: 'Please specify either text or selector to wait for' }],
    };
  }
);

// ============================================
// JavaScript Execution Tools
// ============================================

server.tool(
  'browser_evaluate',
  'Execute JavaScript code in the page context.',
  {
    script: z.string().describe('JavaScript code to execute'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.executeScript(page, params.script);

    return {
      content: [{
        type: 'text',
        text: result.success
          ? `Result: ${JSON.stringify(result.result, null, 2)}`
          : `Error: ${result.error}`,
      }],
    };
  }
);

// ============================================
// Network Tools
// ============================================

server.tool(
  'browser_start_network_monitor',
  'Start monitoring network requests.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const result = tools.startNetworkMonitoring(page);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_stop_network_monitor',
  'Stop monitoring network requests.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const result = tools.stopNetworkMonitoring(page);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_list_network_requests',
  'List all network requests captured.',
  {
    resourceTypes: z.array(z.string()).optional().describe('Filter by resource types (document, script, xhr, fetch, etc.)'),
  },
  async (params) => {
    const requests = tools.listNetworkRequests();

    const filtered = params.resourceTypes
      ? requests.filter(r => params.resourceTypes.includes(r.type))
      : requests;

    const text = filtered.map(r =>
      `${r.method} ${r.url} (${r.type}) - Status: ${r.status || 'pending'}`
    ).join('\n');

    return {
      content: [{ type: 'text', text: text || 'No network requests captured' }],
    };
  }
);

// ============================================
// Console Tools
// ============================================

server.tool(
  'browser_start_console_monitor',
  'Start monitoring console messages.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const result = tools.startConsoleMonitoring(page);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_stop_console_monitor',
  'Stop monitoring console messages.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const result = tools.stopConsoleMonitoring(page);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_list_console_messages',
  'List all console messages captured.',
  {
    types: z.array(z.enum(['log', 'warn', 'error', 'info', 'debug'])).optional().describe('Filter by message types'),
  },
  async (params) => {
    const messages = params.types
      ? tools.getConsoleMessagesByType(params.types[0])
      : tools.listConsoleMessages();

    const text = messages.map(m =>
      `[${m.type}] ${m.text}`
    ).join('\n');

    return {
      content: [{ type: 'text', text: text || 'No console messages captured' }],
    };
  }
);

// ============================================
// Storage Tools
// ============================================

server.tool(
  'browser_get_cookies',
  'Get all cookies or cookies for a specific domain.',
  {
    domain: z.string().optional().describe('Domain to filter cookies'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const cookies = params.domain
      ? await tools.getCookiesForDomain(page, params.domain)
      : await tools.getAllCookies(page);

    return {
      content: [{ type: 'text', text: JSON.stringify(cookies, null, 2) }],
    };
  }
);

server.tool(
  'browser_set_cookie',
  'Set a cookie.',
  {
    name: z.string().describe('Cookie name'),
    value: z.string().describe('Cookie value'),
    domain: z.string().optional().describe('Cookie domain'),
    path: z.string().optional().describe('Cookie path'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.setCookie(page, {
      name: params.name,
      value: params.value,
      domain: params.domain || '',
      path: params.path || '/',
    });

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_get_local_storage',
  'Get all localStorage data.',
  {},
  async () => {
    const page = await getActivePageOrCreate();
    const data = await tools.getLocalStorage(page);

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  'browser_set_local_storage',
  'Set a localStorage item.',
  {
    key: z.string().describe('Key name'),
    value: z.string().describe('Value'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.setLocalStorageItem(page, params.key, params.value);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

// ============================================
// Emulation Tools
// ============================================

server.tool(
  'browser_emulate_viewport',
  'Set viewport dimensions.',
  {
    width: z.number().describe('Viewport width'),
    height: z.number().describe('Viewport height'),
    deviceScaleFactor: z.number().optional().describe('Device pixel ratio'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.emulateViewport(page, params.width, params.height, {
      deviceScaleFactor: params.deviceScaleFactor,
    });

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_emulate_device',
  'Emulate a specific device (iPhone, iPad, etc.).',
  {
    device: z.string().describe('Device name (e.g., iPhone 12, iPad Pro)'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.emulateDevice(page, params.device);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_set_user_agent',
  'Set custom user agent string.',
  {
    userAgent: z.string().describe('User agent string'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.setUserAgent(page, params.userAgent);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_set_geolocation',
  'Override geolocation coordinates.',
  {
    latitude: z.number().describe('Latitude'),
    longitude: z.number().describe('Longitude'),
    accuracy: z.number().optional().describe('Accuracy in meters'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.setGeolocation(page, params.latitude, params.longitude, params.accuracy);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

server.tool(
  'browser_emulate_color_scheme',
  'Emulate light or dark color scheme.',
  {
    scheme: z.enum(['light', 'dark']).describe('Color scheme'),
  },
  async (params) => {
    const page = await getActivePageOrCreate();
    const result = await tools.emulateColorScheme(page, params.scheme);

    return {
      content: [{ type: 'text', text: result }],
    };
  }
);

// ============================================
// Main Entry Point
// ============================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Chrome Browser MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});