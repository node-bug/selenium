/**
 * NetworkHelper – plain IIFE injected into the page to monitor XHR and fetch requests.
 *
 * The script patches `XMLHttpRequest` and `window.fetch` to keep counters of active
 * requests and a list of completed requests. It also updates DOM bridge attributes
 * (`data-network-xhr-count`, `data-network-fetch-count`, `data-network-completed-requests`)
 * so the Selenium driver can read the state.
 */
(function NetworkHelper() {
  // Guard against double‑injection
  if (window.__networkMonitored) return;
  window.__networkMonitored = true;

  // XHR monitoring
  window.__activeXhrCount = 0;
  var originalOpen = XMLHttpRequest.prototype.open;
  var originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._xhrUrl = url;
    this._xhrMethod = method;
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    window.__activeXhrCount++;
    var self = this;
    this.addEventListener('readystatechange', function () {
      if (self.readyState === 4) {
        window.__activeXhrCount--;
        if (window.__completedRequests) {
          window.__completedRequests.push({ url: self._xhrUrl || '', method: self._xhrMethod || 'XHR' });
        }
      }
    });
    return originalSend.apply(this, arguments);
  };

  // Fetch monitoring
  window.__activeFetchCount = 0;
  var originalFetch = window.fetch;
  window.fetch = function () {
    window.__activeFetchCount++;
    var args = Array.prototype.slice.call(arguments);
    var url = (args[0] || '').toString();
    return originalFetch.apply(this, args)
      .then(function (response) { return response; })
      .catch(function (err) { throw err; })
      .finally(function () {
        window.__activeFetchCount--;
        if (window.__completedRequests) {
          window.__completedRequests.push({ url: url, method: 'FETCH' });
        }
      });
  };

  // Completed requests tracking
  window.__completedRequests = [];

  // Initialise DOM bridge attributes
  document.body.setAttribute('data-network-xhr-count', '0');
  document.body.setAttribute('data-network-fetch-count', '0');
  document.body.setAttribute('data-network-completed-requests', '[]');

  // Periodically sync counters to DOM attributes for Selenium polling
  setInterval(function () {
    document.body.setAttribute('data-network-xhr-count', String(window.__activeXhrCount || 0));
    document.body.setAttribute('data-network-fetch-count', String(window.__activeFetchCount || 0));
    document.body.setAttribute('data-network-completed-requests', JSON.stringify(window.__completedRequests || []));
  }, 50);

  // Expose a reference for verification
  window.NetworkHelper = NetworkHelper;
})();