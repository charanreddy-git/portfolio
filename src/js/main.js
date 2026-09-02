(function () {
  "use strict";

  const routes = ["/", "/projects", "/blogs"];
  const pageTitles = {
    "/": "Charan Reddy",
    "/projects": "Projects — Charan Reddy",
    "/blogs": "Blogs — Charan Reddy"
  };
  const mainEl = document.getElementById("main");
  const headerEl = document.getElementById("site-header");
  const headerNav = headerEl ? headerEl.querySelector(".site-header-nav") : null;
  const burgerBtn = headerEl ? headerEl.querySelector(".site-header-burger") : null;
  const pageCache = {};
  let postsPromise = null;

  function syncHeaderNav(route) {
    if (!headerNav) { return; }
    var links = headerNav.querySelectorAll(".site-nav-link");
    var isPost = route.indexOf("/blogs/") === 0;
    var base = isPost ? "/blogs" : route;
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === base) {
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

  function matchRoute(path) {
    if (routes.indexOf(path) !== -1) {
      return path;
    }
    if (/^\/blogs\/[a-z0-9][a-z0-9-]*$/i.test(path)) {
      return path;
    }
    return null;
  }

  function stripFrontmatter(markdown) {
    return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function injectPage(html, route) {
    mainEl.innerHTML = html;
    document.title = pageTitles[route] || "Charan Reddy";
    syncHeaderNav(route);
    closeHeaderMenu();
    if (route === "/blogs") {
      initBlogIndex();
    }
    if (route === "/") {
      initHomeBlogs();
    }
  }

  function loadPostsIndex() {
    if (!postsPromise) {
      postsPromise = fetch("src/content/blogs/posts.json").then(function (res) {
        if (!res.ok) { throw new Error("Failed to load posts index"); }
        return res.json();
      });
      postsPromise.catch(function () { postsPromise = null; });
    }
    return postsPromise;
  }

  function initBlogIndex() {
    var listEl = document.getElementById("post-list");
    var emptyEl = document.getElementById("blog-empty");
    if (!listEl || !emptyEl) { return; }
    loadPostsIndex().then(function (posts) {
      if (!posts.length) {
        emptyEl.hidden = false;
        return;
      }
      listEl.innerHTML = posts.map(function (post) {
        return '<li class="post-item"><span class="post-date">' + escapeHtml(post.date) + '</span><a class="post-link" href="/blogs/' + escapeHtml(post.slug) + '"><span class="post-title">' + escapeHtml(post.title) + "</span></a></li>";
      }).join("");
      listEl.hidden = false;
    }).catch(function () {
      emptyEl.hidden = false;
    });
  }

  function initHomeBlogs() {
    var listEl = document.getElementById("home-post-list");
    var emptyEl = document.getElementById("home-blog-empty");
    if (!listEl || !emptyEl) { return; }
    loadPostsIndex().then(function (posts) {
      if (!posts.length) {
        emptyEl.hidden = false;
        return;
      }
      var recent = posts.slice(0, 6);
      listEl.innerHTML = recent.map(function (post) {
        return '<li class="post-item"><span class="post-date">' + escapeHtml(post.date) + '</span><a class="post-link" href="/blogs/' + escapeHtml(post.slug) + '"><span class="post-title">' + escapeHtml(post.title) + "</span></a></li>";
      }).join("");
      listEl.hidden = false;
    }).catch(function () {
      emptyEl.hidden = false;
    });
  }

  function postShell(title, date, bodyHtml) {
    return '<div class="page-section" data-page="post">' +
      '<div class="hero-block"><header class="hero">' +
      '<div class="hero-top"><div class="hero-identity"><h1>' + escapeHtml(title) + "</h1></div></div>" +
      (date ? '<p class="post-hero-date">' + escapeHtml(date) + "</p>" : "") +
      "</header></div>" +
      '<section class="section"><article class="post-body">' + bodyHtml + "</article></section>" +
      "</div>";
  }

  function loadPost(path) {
    var slug = path.slice("/blogs/".length);
    Promise.all([
      loadPostsIndex(),
      fetch("src/content/blogs/posts/" + slug + ".md").then(function (res) {
        if (!res.ok) { throw new Error("Failed to load post"); }
        return res.text();
      })
    ]).then(function (results) {
      var posts = results[0];
      var markdown = results[1];
      var meta = null;
      posts.forEach(function (post) {
        if (post.slug === slug) { meta = post; }
      });
      var title = meta ? meta.title : slug;
      var date = meta ? meta.date : "";
      var html = postShell(title, date, window.marked.parse(stripFrontmatter(markdown)));
      pageCache[path] = html;
      injectPage(html, path);
      document.title = title + " — Charan Reddy";
    }).catch(function () {
      injectPage(postShell("Post not found", "", '<p>This post doesn&rsquo;t exist (yet). <a href="/blogs">Back to blogs</a>.</p>'), path);
    });
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

    if (route.indexOf("/blogs/") === 0) {
      loadPost(route);
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
    initHomeBlogs();

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
