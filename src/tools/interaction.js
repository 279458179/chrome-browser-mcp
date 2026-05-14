/**
 * Interaction tools: click, type, fill, hover, scroll, press_key
 */

/**
 * UID to element mapping cache
 */
const elementCache = new Map();

/**
 * Register an element selector with a UID
 */
function registerElement(uid, selector) {
  elementCache.set(uid, selector);
}

/**
 * Get selector for a UID
 */
function getSelectorForUid(uid) {
  return elementCache.get(uid);
}

/**
 * Clear element cache
 */
function clearElementCache() {
  elementCache.clear();
}

/**
 * Click an element by UID or selector
 */
async function clickElement(page, target, options = {}) {
  try {
    let selector = getSelectorForUid(target);
    if (!selector) {
      selector = target;
    }

    const element = await page.waitForSelector(selector, { timeout: 5000 });
    if (!element) {
      throw new Error(`Element not found: ${target}`);
    }

    if (options.doubleClick) {
      await element.click({ clickCount: 2, button: options.button || 'left' });
      return `Double-clicked element ${target}`;
    } else {
      await element.click({ button: options.button || 'left' });
      return `Clicked element ${target}`;
    }
  } catch (error) {
    throw new Error(`Failed to click element ${target}: ${error}`);
  }
}

/**
 * Click at specific coordinates
 */
async function clickAtPosition(page, x, y) {
  try {
    await page.mouse.click(x, y);
    return `Clicked at position (${x}, ${y})`;
  } catch (error) {
    throw new Error(`Failed to click at position: ${error}`);
  }
}

/**
 * Type text into an element by UID or selector
 */
async function typeIntoElement(page, target, text, options = {}) {
  try {
    let selector = getSelectorForUid(target);
    if (!selector) {
      selector = target;
    }

    const element = await page.waitForSelector(selector, { timeout: 5000 });
    if (!element) {
      throw new Error(`Element not found: ${target}`);
    }

    if (options.clear) {
      await element.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
    }

    await element.type(text, { delay: options.delay || 0 });
    return `Typed "${text}" into element ${target}`;
  } catch (error) {
    throw new Error(`Failed to type into element ${target}: ${error}`);
  }
}

/**
 * Fill a form element (input, textarea, select)
 */
async function fillElement(page, target, value, options = {}) {
  try {
    let selector = getSelectorForUid(target);
    if (!selector) {
      selector = target;
    }

    const element = await page.waitForSelector(selector, { timeout: 5000 });
    if (!element) {
      throw new Error(`Element not found: ${target}`);
    }

    const tagName = await element.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === 'select') {
      await element.select(value);
      return `Selected "${value}" in select element ${target}`;
    } else if (tagName === 'input' || tagName === 'textarea') {
      if (options.clear) {
        await element.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
      }
      await element.type(value, { delay: options.delay || 0 });

      if (options.submit) {
        await page.keyboard.press('Enter');
      }

      return `Filled "${value}" into ${tagName} element ${target}`;
    } else {
      await element.evaluate((el, v) => {
        if ('value' in el) {
          el.value = v;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, value);
      return `Set value "${value}" on element ${target}`;
    }
  } catch (error) {
    throw new Error(`Failed to fill element ${target}: ${error}`);
  }
}

/**
 * Hover over an element
 */
async function hoverElement(page, target) {
  try {
    let selector = getSelectorForUid(target);
    if (!selector) {
      selector = target;
    }

    const element = await page.waitForSelector(selector, { timeout: 5000 });
    if (!element) {
      throw new Error(`Element not found: ${target}`);
    }

    await element.hover();
    return `Hovered over element ${target}`;
  } catch (error) {
    throw new Error(`Failed to hover over element ${target}: ${error}`);
  }
}

/**
 * Scroll the page or an element
 */
async function scrollPage(page, options = {}) {
  try {
    if (options.selector) {
      const element = await page.waitForSelector(options.selector, { timeout: 5000 });
      if (element) {
        await element.evaluate((el) => {
          el.scrollIntoView();
        });
        return `Scrolled element ${options.selector} into view`;
      }
    } else {
      await page.evaluate((scrollX, scrollY) => {
        window.scrollBy(scrollX || 0, scrollY || 0);
      }, options.x || 0, options.y || 0);
      return `Scrolled page by (${options.x || 0}, ${options.y || 0})`;
    }

    return `Scroll completed`;
  } catch (error) {
    throw new Error(`Failed to scroll: ${error}`);
  }
}

/**
 * Press a key or key combination
 */
async function pressKey(page, key, options = {}) {
  try {
    const count = options.count || 1;
    for (let i = 0; i < count; i++) {
      await page.keyboard.press(key);
    }
    return `Pressed key "${key}" ${count} times`;
  } catch (error) {
    throw new Error(`Failed to press key "${key}": ${error}`);
  }
}

/**
 * Type text using keyboard (for focused inputs)
 */
async function typeText(page, text, options = {}) {
  try {
    await page.keyboard.type(text, { delay: options.delay || 0 });

    if (options.submitKey) {
      await page.keyboard.press(options.submitKey);
    }

    return `Typed "${text}" using keyboard`;
  } catch (error) {
    throw new Error(`Failed to type text: ${error}`);
  }
}

/**
 * Drag and drop operation
 */
async function dragAndDrop(page, sourceTarget, targetTarget) {
  try {
    let sourceSelector = getSelectorForUid(sourceTarget) || sourceTarget;
    let targetSelector = getSelectorForUid(targetTarget) || targetTarget;

    const sourceElement = await page.waitForSelector(sourceSelector, { timeout: 5000 });
    const targetElement = await page.waitForSelector(targetSelector, { timeout: 5000 });

    if (!sourceElement || !targetElement) {
      throw new Error('Source or target element not found');
    }

    const sourceBox = await sourceElement.boundingBox();
    const targetBox = await targetElement.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get element bounding boxes');
    }

    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await page.mouse.up();

    return `Dragged ${sourceTarget} to ${targetTarget}`;
  } catch (error) {
    throw new Error(`Failed to drag and drop: ${error}`);
  }
}

export {
  clickElement,
  clickAtPosition,
  typeIntoElement,
  fillElement,
  hoverElement,
  scrollPage,
  pressKey,
  typeText,
  dragAndDrop,
  registerElement,
  getSelectorForUid,
  clearElementCache,
};