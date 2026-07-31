(function () {
  "use strict";

  const routes = ["/", "/projects", "/blog", "/resume"];
  const mainEl = document.getElementById("main");
  const pageCache = {};

  function injectPage(html, route) {
    mainEl.innerHTML = html;
    if (route === "/resume") {
      initResumeEmbed();
    }
  }

  function loadPage(route) {
    var name;

    if (pageCache[route]) {
      injectPage(pageCache[route], route);
      return;
    }

    if (route === "/") {
      return;
    }

    name = route.slice(1);
    fetch("pages/" + name + ".html")
      .then(function (res) {
        if (!res.ok) { throw new Error("Failed to load " + name); }
        return res.text();
      })
      .then(function (html) {
        pageCache[route] = html;
        injectPage(html, route);
      })
      .catch(function () {
        mainEl.innerHTML = "";
      });
  }

  function initResumeEmbed() {
    var frame = document.getElementById("resume-frame");
    var fallback = document.getElementById("resume-fallback");
    if (!frame) { return; }

    function setFallback(message) {
      if (!fallback) { return; }
      fallback.textContent = message;
      fallback.hidden = false;
    }

    function clearFallback() {
      if (!fallback) { return; }
      fallback.hidden = true;
      fallback.textContent = "";
    }

    function parseResumeUrls(rawUrl) {
      var url = rawUrl.trim();
      var fileIdMatch = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{20,})/);
      if (!fileIdMatch) {
        return { preview: url, open: url, download: url };
      }
      var fileId = fileIdMatch[1];
      return {
        preview: "https://drive.google.com/file/d/" + fileId + "/preview",
        open: "https://drive.google.com/file/d/" + fileId + "/view",
        download: "https://drive.google.com/uc?export=download&id=" + fileId
      };
    }

    var url = window.SITE_CONFIG && window.SITE_CONFIG.resumeUrl;
    if (!url || url === "#" || url.indexOf("YOUR_") !== -1) {
      setFallback("Resume is not configured yet.");
      return;
    }

    var urls = parseResumeUrls(url);
    var completed = false;
    var timeoutId = window.setTimeout(function () {
      if (completed) { return; }
      setFallback("Preview is unavailable in this browser. Use Open in new tab or Download PDF.");
    }, 4500);

    frame.addEventListener("load", function () {
      if (completed) { return; }
      completed = true;
      window.clearTimeout(timeoutId);
      clearFallback();
    }, { once: true });

    frame.addEventListener("error", function () {
      if (completed) { return; }
      completed = true;
      window.clearTimeout(timeoutId);
      setFallback("Preview failed to load. Use Open in new tab or Download PDF.");
    }, { once: true });

    frame.src = urls.preview;
  }

  window.addEventListener("popstate", function () {
    var path = location.pathname;
    if (routes.indexOf(path) !== -1) {
      loadPage(path);
    } else {
      loadPage("/");
    }
  });

  function init() {
    pageCache["/"] = mainEl.innerHTML;

    var stored = sessionStorage.getItem("spa-path");
    sessionStorage.removeItem("spa-path");
    var path = stored || location.pathname;

    if (routes.indexOf(path) !== -1) {
      if (path !== "/") {
        loadPage(path);
      }
    } else if (path !== "/") {
      try { history.replaceState(null, "", "/"); } catch (_) {}
    }
  }

  init();
})();
