// URL slug helpers — SEO-friendly URLs like `/player/mohamed-salah-209331`
export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const playerSlug = (name: string, id: number | string): string =>
  `${slugify(name) || "player"}-${id}`;

export const entitySlug = (name: string): string =>
  slugify(name) || encodeURIComponent(name);

// Extract trailing numeric id from slug like `mohamed-salah-209331` -> `209331`.
// Also accepts a bare id string.
export const parseIdFromSlug = (slugOrId: string): string => {
  const m = String(slugOrId).match(/(\d+)$/);
  return m ? m[1] : slugOrId;
};
