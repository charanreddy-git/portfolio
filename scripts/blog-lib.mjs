const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER);
  if (!match) {
    throw new Error("missing --- frontmatter block at top of file");
  }
  const meta = {};
  match[1].split(/\r?\n/).forEach(function (line) {
    if (!line.trim()) { return; }
    const i = line.indexOf(":");
    if (i === -1) { return; }
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return meta;
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
