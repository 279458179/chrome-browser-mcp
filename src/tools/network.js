/**
 * Network monitoring tools
 */

let requestIdCounter = 0;

/**
 * Generate a unique request ID
 */
function generateRequestId() {
  requestIdCounter++;
  return `req_${Date.now()}_${requestIdCounter}`;
}

/**
 * Network request collector
 */
class NetworkCollector {
  constructor() {
    this.requests = [];
    this.requestMap = new Map();
  }

  start(page) {
    this.requests = [];
    this.requestMap.clear();

    page.on('request', (request) => {
      const id = generateRequestId();
      const req = {
        requestId: id,
        url: request.url(),
        method: request.method(),
        type: request.resourceType(),
        time: Date.now(),
      };
      this.requests.push(req);
      this.requestMap.set(id, request);
    });

    page.on('response', (response) => {
      const request = response.request();
      const existingReq = this.requests.find(r => r.url === request.url() && !r.status);
      if (existingReq) {
        existingReq.status = response.status();
      }
    });
  }

  stop(page) {
    page.removeAllListeners('request');
    page.removeAllListeners('response');
  }

  getRequests() {
    return this.requests;
  }

  getRequestById(id) {
    return this.requestMap.get(id);
  }
}

const networkCollector = new NetworkCollector();

/**
 * Start monitoring network requests
 */
function startNetworkMonitoring(page) {
  networkCollector.start(page);
  return 'Network monitoring started';
}

/**
 * Stop monitoring network requests
 */
function stopNetworkMonitoring(page) {
  networkCollector.stop(page);
  return 'Network monitoring stopped';
}

/**
 * List all network requests since monitoring started
 */
function listNetworkRequests() {
  return networkCollector.getRequests();
}

/**
 * Get details of a specific network request
 */
async function getNetworkRequestDetails(requestId) {
  const request = networkCollector.getRequestById(requestId);
  if (!request) {
    return null;
  }

  try {
    const response = request.response();
    return {
      request,
      response: response || null,
    };
  } catch (e) {
    return { request, response: null };
  }
}

/**
 * Get request body
 */
async function getRequestBody(request) {
  try {
    const postData = request.postData();
    if (!postData) {
      return null;
    }

    try {
      return JSON.parse(postData);
    } catch (e) {
      return postData;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Get response body
 */
async function getResponseBody(response) {
  try {
    const buffer = await response.buffer();
    const text = buffer.toString();

    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Block specific network requests
 */
async function blockNetworkRequests(page, patterns) {
  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const url = request.url();
    const shouldBlock = patterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url);
      }
      return url.includes(pattern);
    });

    if (shouldBlock) {
      request.abort();
    } else {
      request.continue();
    }
  });

  return `Blocking requests matching: ${patterns.join(', ')}`;
}

/**
 * Clear request interception
 */
async function clearRequestInterception(page) {
  await page.setRequestInterception(false);
  return 'Request interception cleared';
}

export {
  startNetworkMonitoring,
  stopNetworkMonitoring,
  listNetworkRequests,
  getNetworkRequestDetails,
  getRequestBody,
  getResponseBody,
  blockNetworkRequests,
  clearRequestInterception,
};