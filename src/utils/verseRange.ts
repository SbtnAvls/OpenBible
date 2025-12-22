export function formatVerseNumbersRange(verseNumbers: string[]): string {
  if (!verseNumbers.length) {
    return '';
  }

  const unique = Array.from(new Set(verseNumbers));
  const parsed = unique
    .map((value, index) => {
      const numeric = Number(value);
      return {
        original: value,
        numeric,
        isNumeric: Number.isFinite(numeric),
        originalIndex: index,
      };
    })
    .sort((a, b) => {
      if (a.isNumeric && b.isNumeric) {
        return a.numeric - b.numeric;
      }
      if (a.isNumeric) {
        return -1;
      }
      if (b.isNumeric) {
        return 1;
      }
      return a.originalIndex - b.originalIndex;
    });

  const segments: string[] = [];
  let start = parsed[0];
  let prev = parsed[0];

  for (let i = 1; i < parsed.length; i += 1) {
    const current = parsed[i];
    if (
      prev.isNumeric &&
      current.isNumeric &&
      current.numeric === prev.numeric + 1
    ) {
      prev = current;
      continue;
    }

    segments.push(formatSegment(start, prev));
    start = current;
    prev = current;
  }
  segments.push(formatSegment(start, prev));

  return formatListWithAnd(segments);
}

type SegmentItem = {
  original: string;
  numeric: number;
  isNumeric: boolean;
  originalIndex: number;
};

function formatSegment(start: SegmentItem, end: SegmentItem) {
  if (start === end) {
    return start.isNumeric ? String(start.numeric) : start.original;
  }
  const fromValue = start.isNumeric ? String(start.numeric) : start.original;
  const toValue = end.isNumeric ? String(end.numeric) : end.original;
  return `${fromValue}-${toValue}`;
}

function formatListWithAnd(values: string[]) {
  if (values.length === 1) {
    return values[0];
  }
  if (values.length === 2) {
    return `${values[0]} y ${values[1]}`;
  }
  const initial = values.slice(0, -1).join(', ');
  const last = values[values.length - 1];
  return `${initial} y ${last}`;
}
