/** Pure scroll maths for the restaurant page's category tabs, kept out of the screen so it can be tested without layout. */

/** Pixels from the bottom within which the page counts as scrolled to the end. */
const END_EPSILON = 2;

export type ScrollMetrics = { offset: number; viewportHeight: number; contentHeight: number };

/**
 * The category being read: the last section whose top has reached the line under the pinned tabs.
 * At the very end of the page the last section wins even when it is too short to ever reach that line.
 */
export function activeSection(ids: string[], sectionY: Record<string, number>, metrics: ScrollMetrics, pinnedHeight: number, tabsHeight: number): string | null {
  if (ids.length === 0) return null;
  const { offset, viewportHeight, contentHeight } = metrics;
  if (contentHeight > viewportHeight && offset + viewportHeight >= contentHeight - END_EPSILON) return ids[ids.length - 1];
  const line = offset + pinnedHeight + tabsHeight + 1;
  // Above the first section's title the first tab stays selected.
  let current = ids[0];
  for (const id of ids) {
    const y = sectionY[id];
    if (y != null && y <= line) current = id;
  }
  return current;
}

/** The pinned copy of the tabs shows once the in-flow row has scrolled up under the (transparent) header. */
export const tabsPinned = (offset: number, pinnedHeight: number, tabsY: number): boolean => offset + pinnedHeight >= tabsY;

/** Scroll offset that puts a section's title right under the pinned tabs; undefined until the section is measured. */
export function sectionScrollTarget(sectionY: number | undefined, pinnedHeight: number, tabsHeight: number): number | undefined {
  return sectionY == null ? undefined : Math.max(0, sectionY - pinnedHeight - tabsHeight);
}
