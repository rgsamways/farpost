export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function resolveUniqueSlug(title: string, usedSlugs: Set<string>): string {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
}
