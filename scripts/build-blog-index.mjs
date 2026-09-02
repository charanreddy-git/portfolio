import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "./blog-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = join(root, "blogs", "posts");
const indexPath = join(root, "blogs", "posts.json");
const slugPattern = /^[a-z0-9][a-z0-9-]*$/;

export function buildIndex() {
  const files = readdirSync(postsDir).filter(function (f) { return f.endsWith(".md"); });

  const posts = files.map(function (file) {
    const slug = file.slice(0, -3);
    if (!slugPattern.test(slug)) {
      throw new Error("invalid slug \"" + slug + "\" (from " + file + ") — must match " + slugPattern);
    }
    const raw = readFileSync(join(postsDir, file), "utf8");
    let meta;
    try {
      meta = parseFrontmatter(raw);
    } catch (err) {
      throw new Error(file + ": " + err.message);
    }
    if (!meta.title) { throw new Error(file + " is missing \"title\" in frontmatter"); }
    if (!meta.date) { throw new Error(file + " is missing \"date\" in frontmatter"); }
    return { slug: slug, title: meta.title, date: meta.date };
  });

  posts.sort(function (a, b) {
    if (a.date === b.date) { return 0; }
    return a.date < b.date ? 1 : -1;
  });

  writeFileSync(indexPath, JSON.stringify(posts, null, 2) + "\n");
  return posts;
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const posts = buildIndex();
  console.log("Wrote blogs/posts.json (" + posts.length + " post" + (posts.length === 1 ? "" : "s") + ")");
}
