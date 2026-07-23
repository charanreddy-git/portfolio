(function () {
  "use strict";

  const routes = ["/", "/projects", "/blog", "/resume"];
  const navLinks = document.querySelectorAll(".nav-link");
  const mainEl = document.getElementById("main");
  const pageCache = {};

  function updateNav(route) {
    var active = route === "/" ? "/" : "/" + (route.split("/")[1] || "");
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("data-route") === active);
    });
  }

  function injectPage(html, route) {
    mainEl.innerHTML = html;
    updateNav(route);
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
      updateNav("/");
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

  function navigate(route) {
    if (routes.indexOf(route) === -1) {
      route = "/";
    }
    try {
      history.pushState({ route: route }, "", route);
    } catch (_) {}
    loadPage(route);
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

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      navigate(link.getAttribute("data-route"));
    });
  });

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
      if (path === "/") {
        updateNav("/");
      } else {
        loadPage(path);
      }
    } else {
      if (path !== "/") { try { history.replaceState(null, "", "/"); } catch (_) {} }
      updateNav("/");
    }
  }

  init();

  // Theme toggle

  var toggle = document.querySelector(".theme-toggle");
  var STORAGE_KEY = "theme";

  function setTheme(dark) {
    document.documentElement.classList.toggle("dark", dark);
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute("content", dark ? "#0a0a0a" : "#fafafa"); }

    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }

  var saved = localStorage.getItem(STORAGE_KEY);
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(saved ? saved === "dark" : prefersDark);

  if (toggle) {
    toggle.addEventListener("click", function () {
      var isDark = document.documentElement.classList.contains("dark");
      setTheme(!isDark);
    });
  }
})();
