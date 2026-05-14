/**
 * Console message monitoring tools
 */

/**
 * Console message collector
 */
class ConsoleCollector {
  constructor() {
    this.messages = [];
  }

  start(page) {
    this.messages = [];

    page.on('console', (msg) => {
      const consoleMsg = {
        type: msg.type(),
        text: msg.text(),
        time: Date.now(),
      };
      this.messages.push(consoleMsg);
    });
  }

  stop(page) {
    page.removeAllListeners('console');
  }

  getMessages() {
    return this.messages;
  }

  getMessagesByType(type) {
    return this.messages.filter(m => m.type === type);
  }

  getErrors() {
    return this.getMessagesByType('error');
  }
}

const consoleCollector = new ConsoleCollector();

/**
 * Start monitoring console messages
 */
function startConsoleMonitoring(page) {
  consoleCollector.start(page);
  return 'Console monitoring started';
}

/**
 * Stop monitoring console messages
 */
function stopConsoleMonitoring(page) {
  consoleCollector.stop(page);
  return 'Console monitoring stopped';
}

/**
 * List all console messages since monitoring started
 */
function listConsoleMessages() {
  return consoleCollector.getMessages();
}

/**
 * Get console messages by type
 */
function getConsoleMessagesByType(type) {
  return consoleCollector.getMessagesByType(type);
}

/**
 * Get console errors only
 */
function getConsoleErrors() {
  return consoleCollector.getErrors();
}

/**
 * Clear collected console messages
 */
function clearConsoleMessages() {
  consoleCollector.getMessages().length = 0;
  return 'Console messages cleared';
}

export {
  startConsoleMonitoring,
  stopConsoleMonitoring,
  listConsoleMessages,
  getConsoleMessagesByType,
  getConsoleErrors,
  clearConsoleMessages,
};