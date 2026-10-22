export function guideAnchor(name: string) {
  return `guide-${name.trim()}`;
}

export function guideHref(name: string) {
  return `/membership/guides#${encodeURIComponent(guideAnchor(name))}`;
}
