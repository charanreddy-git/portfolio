# Charan Reddy's Portfolio

Personal portfolio site — a single-page application built with vanilla JS, HTML, and CSS. No framework, no bundler.

## Usage

```bash
npm start       # Start dev server on http://localhost:8080
npm run lint    # Run ESLint
```

## Writing a blog post

```bash
npm run new-post -- "My Post Title"
```

This creates `src/content/blogs/posts/my-post-title.md` with a frontmatter header (`title`, `date`) pre-filled and registers it in `src/content/blogs/posts.json`. Write the post, then `git push` — that's it.

If you edit a post's frontmatter (e.g. change the title) or add/remove `.md` files by hand, run `npm run blog:build` to regenerate `src/content/blogs/posts.json` from the frontmatter in `src/content/blogs/posts/*.md`. Never edit `src/content/blogs/posts.json` directly — it's generated.

## Structure

```
├── index.html / 404.html          # entry (SPA fallback)
├── image.jpg                      # avatar
├── src/
│   ├── pages/      # blogs.html, projects.html (SPA fragments)
│   ├── styles/     # base, layout, hero, components, blogs, footer, tokens
│   ├── js/         # main.js (SPA router)
│   └── content/blogs/posts/       # markdown + posts.json
├── public/vendor/marked.js
└── tools/          # serve, build-blogs, new-post
```

