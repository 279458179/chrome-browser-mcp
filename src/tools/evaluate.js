/**
 * JavaScript execution tool
 */

/**
 * Execute JavaScript in the page context
 */
async function executeScript(page, script, args = []) {
  try {
    const result = await page.evaluate(
      (scriptStr, argList) => {
        try {
          const fn = new Function('return ' + scriptStr);
          return fn.apply(null, argList);
        } catch (e) {
          const fn2 = new Function(scriptStr);
          return fn2.apply(null, argList);
        }
      },
      script,
      args
    );

    return {
      success: true,
      result: result,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Execute an async JavaScript function in the page context
 */
async function executeAsyncScript(page, script, args = []) {
  try {
    const result = await page.evaluate(
      async (scriptStr, argList) => {
        try {
          const fn = new Function('return ' + scriptStr)();
          if (typeof fn === 'function') {
            return await fn.apply(null, argList);
          }
          return fn;
        } catch (e) {
          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const fn2 = new AsyncFunction(scriptStr);
          return await fn2.apply(null, argList);
        }
      },
      script,
      args
    );

    return {
      success: true,
      result: result,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Get element property value
 */
async function getElementProperty(page, selector, property) {
  try {
    const value = await page.$eval(
      selector,
      (el, prop) => {
        const element = el;
        return element[prop] || element.getAttribute(prop) || null;
      },
      property
    );

    return {
      success: true,
      result: value,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Set element property value
 */
async function setElementProperty(page, selector, property, value) {
  try {
    await page.$eval(
      selector,
      (el, prop, val) => {
        const element = el;
        if (prop in element) {
          element[prop] = val;
        } else {
          element.setAttribute(prop, String(val));
        }
      },
      property,
      value
    );

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Trigger an event on an element
 */
async function triggerEvent(page, selector, eventType) {
  try {
    await page.$eval(
      selector,
      (el, type) => {
        el.dispatchEvent(new Event(type, { bubbles: true }));
      },
      eventType
    );

    return {
      success: true,
      result: `Event "${eventType}" triggered on ${selector}`,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export {
  executeScript,
  executeAsyncScript,
  getElementProperty,
  setElementProperty,
  triggerEvent,
};