// Neutralizes formula injection: spreadsheet apps execute cells starting with these characters.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export const escapeCsvValue = (value: string): string => {
  const sanitized = FORMULA_PREFIX.test(value) ? `'${value}` : value;

  if (
    sanitized.includes(',') ||
    sanitized.includes('"') ||
    sanitized.includes('\n')
  ) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
};

export const toCsv = (header: string[], rows: string[][]): string =>
  [header, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');
