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

This creates `blog/posts/my-post-title.md` with a frontmatter header (`title`, `date`) pre-filled and registers it in `blog/posts.json`. Write the post, then `git push` — that's it.

If you edit a post's frontmatter (e.g. change the title) or add/remove `.md` files by hand, run `npm run blog:build` to regenerate `blog/posts.json` from the frontmatter in `blog/posts/*.md`. Never edit `blog/posts.json` directly — it's generated.

