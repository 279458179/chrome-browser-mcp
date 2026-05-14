/**
 * Storage tools: cookies, localStorage, sessionStorage
 */

/**
 * Get all cookies
 */
async function getAllCookies(page) {
  const cookies = await page.cookies();

  return cookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
  }));
}

/**
 * Get cookies for a specific domain
 */
async function getCookiesForDomain(page, domain) {
  const cookies = await page.cookies([domain]);

  return cookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
  }));
}

/**
 * Set a cookie
 */
async function setCookie(page, cookie) {
  await page.setCookie({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path || '/',
    expires: cookie.expires || undefined,
    secure: cookie.secure || false,
    httpOnly: cookie.httpOnly || false,
  });

  return `Cookie "${cookie.name}" set`;
}

/**
 * Delete a cookie
 */
async function deleteCookie(page, name, domain) {
  const cookies = await page.cookies();

  const cookieToDelete = cookies.find(c =>
    c.name === name && (domain ? c.domain === domain : true)
  );

  if (cookieToDelete) {
    await page.deleteCookie({
      name: cookieToDelete.name,
      domain: cookieToDelete.domain,
      path: cookieToDelete.path,
    });
    return `Cookie "${name}" deleted`;
  }

  return `Cookie "${name}" not found`;
}

/**
 * Clear all cookies
 */
async function clearAllCookies(page) {
  const cookies = await page.cookies();
  for (const cookie of cookies) {
    await page.deleteCookie(cookie);
  }
  return 'All cookies cleared';
}

/**
 * Get localStorage data
 */
async function getLocalStorage(page) {
  return await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    return data;
  });
}

/**
 * Get a specific localStorage item
 */
async function getLocalStorageItem(page, key) {
  return await page.evaluate((k) => {
    return localStorage.getItem(k);
  }, key);
}

/**
 * Set a localStorage item
 */
async function setLocalStorageItem(page, key, value) {
  await page.evaluate((k, v) => {
    localStorage.setItem(k, v);
  }, key, value);
  return `localStorage item "${key}" set`;
}

/**
 * Remove a localStorage item
 */
async function removeLocalStorageItem(page, key) {
  await page.evaluate((k) => {
    localStorage.removeItem(k);
  }, key);
  return `localStorage item "${key}" removed`;
}

/**
 * Clear localStorage
 */
async function clearLocalStorage(page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
  return 'localStorage cleared';
}

/**
 * Get sessionStorage data
 */
async function getSessionStorage(page) {
  return await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        data[key] = sessionStorage.getItem(key) || '';
      }
    }
    return data;
  });
}

/**
 * Get a specific sessionStorage item
 */
async function getSessionStorageItem(page, key) {
  return await page.evaluate((k) => {
    return sessionStorage.getItem(k);
  }, key);
}

/**
 * Set a sessionStorage item
 */
async function setSessionStorageItem(page, key, value) {
  await page.evaluate((k, v) => {
    sessionStorage.setItem(k, v);
  }, key, value);
  return `sessionStorage item "${key}" set`;
}

/**
 * Remove a sessionStorage item
 */
async function removeSessionStorageItem(page, key) {
  await page.evaluate((k) => {
    sessionStorage.removeItem(k);
  }, key);
  return `sessionStorage item "${key}" removed`;
}

/**
 * Clear sessionStorage
 */
async function clearSessionStorage(page) {
  await page.evaluate(() => {
    sessionStorage.clear();
  });
  return 'sessionStorage cleared';
}

export {
  getAllCookies,
  getCookiesForDomain,
  setCookie,
  deleteCookie,
  clearAllCookies,
  getLocalStorage,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  clearLocalStorage,
  getSessionStorage,
  getSessionStorageItem,
  setSessionStorageItem,
  removeSessionStorageItem,
  clearSessionStorage,
};