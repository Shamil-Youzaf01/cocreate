/**
 * Checks if the current pathname matches the target href, or if the pathname is a subpath of the target href.=
 */
export function isPathActive(href, pathname) {
  if (!href || !pathname) return false;
  href = href.replace(/\/+$/, "") || "/";
  pathname = pathname.replace(/\/+$/, "") || "/";

  if (href === "/" || href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Find the nav group whose child URLs include the current pathname.
 * Returns the group's `title` (used as the Disclosure `id`) or null.
 */
export function findActiveGroupKey(pathname, navData = []) {
  for (const section of navData) {
    for (const item of section.items) {
      if (item.items && item.items.length > 0) {
        const hasMatch = item.items.some(
          (child) => child.url && isPathActive(child.url, pathname),
        );
        if (hasMatch) return item.title;
      }
    }
  }
  return null;
}
