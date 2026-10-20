import { activeSection, sectionScrollTarget, tabsPinned } from '../menu-sections';

const ids = ['a', 'b', 'c'];
const sectionY = { a: 300, b: 700, c: 1100 };
// Header + tabs below it take 100 + 50 px.
const at = (offset: number, contentHeight = 1600) => activeSection(ids, sectionY, { offset, viewportHeight: 800, contentHeight }, 100, 50);

it('follows the scroll position', () => {
  expect(at(0)).toBe('a');
  expect(at(150)).toBe('a');
  expect(at(560)).toBe('b');
  expect(at(700)).toBe('b');
});

it('selects the last section at the end of the page even when it is shorter than the viewport', () => {
  // Content ends at 1300 in an 800 viewport: the furthest offset is 500, where the line (651) is still above "c" (y 1100).
  expect(at(497, 1300)).toBe('a');
  expect(at(498, 1300)).toBe('c');
  expect(at(500, 1300)).toBe('c');
});

it('keeps the first section for a page that fits the screen', () => {
  expect(activeSection(ids, sectionY, { offset: 0, viewportHeight: 800, contentHeight: 600 }, 100, 50)).toBe('a');
});

it('pins the tabs only once the in-flow row has scrolled under the header', () => {
  expect(tabsPinned(0, 100, 400)).toBe(false);
  expect(tabsPinned(299, 100, 400)).toBe(false);
  expect(tabsPinned(300, 100, 400)).toBe(true);
});

it('scrolls a section to just under the pinned tabs', () => {
  expect(sectionScrollTarget(700, 100, 50)).toBe(550);
  expect(sectionScrollTarget(100, 100, 50)).toBe(0);
  expect(sectionScrollTarget(undefined, 100, 50)).toBeUndefined();
});
