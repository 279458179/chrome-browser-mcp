/**
 * Tab/page management tools
 */

/**
 * Create a new page/tab
 */
async function createNewPage(browser) {
  return await browser.newPage();
}

/**
 * Close a specific page
 */
async function closeSpecificPage(page) {
  await page.close();
}

/**
 * Get all pages in the browser
 */
async function getAllPages(browser) {
  return await browser.pages();
}

/**
 * Get page information
 */
async function getPageInfo(page) {
  const url = page.url();
  const title = await page.title();

  return {
    id: '',
    url,
    title,
    isActive: false,
  };
}

/**
 * Switch/bring page to front
 */
async function bringPageToFront(page) {
  await page.bringToFront();
}

/**
 * Get the target ID of a page
 */
async function getPageTargetId(page) {
  const target = page.target();
  return target.url();
}

export {
  createNewPage,
  closeSpecificPage,
  getAllPages,
  getPageInfo,
  bringPageToFront,
  getPageTargetId,
};