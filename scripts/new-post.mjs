import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndex } from "./build-blog-index.mjs";
import { slugify } from "./blog-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = join(root, "blog", "posts");

const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error("Usage: npm run new-post -- \"My Post Title\"");
  process.exit(1);
}

const slug = slugify(title);
if (!slug) {
  console.error("Could not derive a slug from that title.");
  process.exit(1);
}

const filePath = join(postsDir, slug + ".md");
if (existsSync(filePath)) {
  console.error("blog/posts/" + slug + ".md already exists.");
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const contents = "---\ntitle: " + title + "\ndate: " + date + "\n---\n\nWrite your post here.\n";

writeFileSync(filePath, contents);
buildIndex();
console.log("Created blog/posts/" + slug + ".md and updated blog/posts.json");
