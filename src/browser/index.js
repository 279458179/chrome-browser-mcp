/**
 * Browser module exports - re-exports all browser functions
 */

export { createBrowserManager, connectBrowser, disconnectBrowser, newPage, closePage, selectPage, listPages, getActivePage, getState, isConnected } from './manager.js';

export { findExistingChrome, connectToChromeByUrl, connectToChrome, getDebuggingTargets, isChromeRunningWithDebugging } from './connection.js';

export { launchChrome, launchChromeTemporary, launchChromeWithProfileName } from './launcher.js';