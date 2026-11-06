/** "Men's Clothing" -> "mens-clothing" */
export function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "men's clothing" -> "Men's Clothing" */
export function humanizeCategory(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => (word.length === 0 ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`))
    .join(' ');
}
