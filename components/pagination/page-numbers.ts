// The page numbers to show: every page for short lists, otherwise the first
// and last page and the ones around the current page, with "gap" between
// numbers that are not next to each other.
export function pageNumbers(page: number, pageCount: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);

  // Near an end, show a few more so the control keeps about the same width.
  if (page <= 3) [2, 3, 4].forEach((number) => wanted.add(number));

  if (page >= pageCount - 2) {
    [pageCount - 3, pageCount - 2, pageCount - 1].forEach((number) =>
      wanted.add(number),
    );
  }

  const sorted = [...wanted]
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((a, b) => a - b);

  const result: (number | "gap")[] = [];

  sorted.forEach((number, index) => {
    if (index > 0) {
      const skipped = number - sorted[index - 1] - 1;

      // A gap that would hide a single page shows that page instead.
      if (skipped === 1) result.push(number - 1);
      else if (skipped > 1) result.push("gap");
    }

    result.push(number);
  });

  return result;
}
