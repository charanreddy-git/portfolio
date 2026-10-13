(function () {
  "use strict";

  const routes = ["/", "/projects"];
  const pageTitles = {
    "/": "Charan Reddy",
    "/projects": "Projects — Charan Reddy"
  };
  const mainEl = document.getElementById("main");
  const headerEl = document.getElementById("site-header");
  const headerNav = headerEl ? headerEl.querySelector(".site-header-nav") : null;
  const burgerBtn = headerEl ? headerEl.querySelector(".site-header-burger") : null;
  const pageCache = {};

  function syncHeaderNav(route) {
    if (!headerNav) { return; }
    var links = headerNav.querySelectorAll(".site-nav-link");
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === route) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  function closeHeaderMenu() {
    if (!headerEl || !burgerBtn) { return; }
    headerEl.classList.remove("is-open");
    burgerBtn.setAttribute("aria-expanded", "false");
  }

  if (burgerBtn && headerEl) {
    burgerBtn.addEventListener("click", function () {
      var isOpen = headerEl.classList.toggle("is-open");
      burgerBtn.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", function (e) {
      if (!headerEl.classList.contains("is-open")) { return; }
      if (headerEl.contains(e.target)) { return; }
      closeHeaderMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeHeaderMenu(); }
    });
  }

  const themeToggle = document.getElementById("theme-toggle");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const themeColors = { light: "#ffffff", dark: "#0a0a0a" };

  function getStoredTheme() {
    try { return localStorage.getItem("theme"); } catch (_) { return null; }
  }

  function applyTheme(theme) {
    if (theme !== "light" && theme !== "dark") { theme = "light"; }
    document.documentElement.setAttribute("data-theme", theme);
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", themeColors[theme]);
    }
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  function initTheme() {
    var stored = getStoredTheme();
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(theme);
    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
        if (!getStoredTheme()) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
    } catch (_) {}
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (_) {}
      applyTheme(next);
    });
  }

  function matchRoute(path) {
    if (routes.indexOf(path) !== -1) {
      return path;
    }
    return null;
  }

  function injectPage(html, route) {
    mainEl.innerHTML = html;
    document.title = pageTitles[route] || "Charan Reddy";
    syncHeaderNav(route);
    closeHeaderMenu();
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
    fetch("src/pages/" + name + ".html")
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

  window.addEventListener("popstate", function () {
    loadPage(matchRoute(location.pathname) || "/");
  });

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    var link = event.target.closest("a[href^='/']");
    if (!link || (link.target && link.target !== "_self")) {
      return;
    }
    var path = link.getAttribute("href");
    if (!matchRoute(path) || path === location.pathname) {
      return;
    }
    event.preventDefault();
    history.pushState(null, "", path);
    loadPage(path);
    window.scrollTo(0, 0);
  });

  function init() {
    pageCache["/"] = mainEl.innerHTML;
    initTheme();

    var stored = sessionStorage.getItem("spa-path");
    sessionStorage.removeItem("spa-path");
    var path = stored || location.pathname;

    syncHeaderNav(matchRoute(path) || "/");

    if (matchRoute(path)) {
      if (path !== "/") {
        loadPage(path);
      }
    } else if (path !== "/") {
      try { history.replaceState(null, "", "/"); } catch (_) {}
    }
  }

  init();
})();
