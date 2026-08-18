(function () {
  "use strict";

  const routes = ["/", "/projects", "/blog", "/resume"];
  const pageTitles = {
    "/": "Charan Reddy",
    "/projects": "Projects — Charan Reddy",
    "/blog": "Blog — Charan Reddy",
    "/resume": "Resume — Charan Reddy"
  };
  const mainEl = document.getElementById("main");
  const pageCache = {};
  let postsPromise = null;

  function matchRoute(path) {
    if (routes.indexOf(path) !== -1) {
      return path;
    }
    if (/^\/blog\/[a-z0-9][a-z0-9-]*$/i.test(path)) {
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
    if (route === "/resume") {
      initResumeEmbed();
    }
    if (route === "/blog") {
      initBlogIndex();
    }
  }

  function loadPostsIndex() {
    if (!postsPromise) {
      postsPromise = fetch("blog/posts.json").then(function (res) {
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
        return '<li class="post-item"><a class="post-link" href="/blog/' + escapeHtml(post.slug) + '"><span class="post-title">' + escapeHtml(post.title) + '</span><span class="post-date">' + escapeHtml(post.date) + "</span></a></li>";
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
      '<nav class="site-nav" aria-label="Pages">' +
      '<a class="nav-link" href="/">Home</a>' +
      '<a class="nav-link" href="/projects">Projects</a>' +
      '<a class="nav-link" href="/blog" aria-current="page">Blog</a>' +
      '<a class="nav-link" href="/resume">Resume</a>' +
      "</nav>" +
      "</header></div>" +
      '<section class="section"><article class="post-body">' + bodyHtml + "</article></section>" +
      "</div>";
  }

  function loadPost(path) {
    var slug = path.slice("/blog/".length);
    Promise.all([
      loadPostsIndex(),
      fetch("blog/posts/" + slug + ".md").then(function (res) {
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
      injectPage(postShell("Post not found", "", '<p>This post doesn&rsquo;t exist (yet). <a href="/blog">Back to the blog</a>.</p>'), path);
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

    if (route.indexOf("/blog/") === 0) {
      loadPost(route);
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

    var stored = sessionStorage.getItem("spa-path");
    sessionStorage.removeItem("spa-path");
    var path = stored || location.pathname;

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
