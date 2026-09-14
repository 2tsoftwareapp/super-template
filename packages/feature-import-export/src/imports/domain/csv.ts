/**
 * RFC 4180 CSV reader used by the import pipeline.
 *
 * Rules:
 *   1. Fields are separated by `,`; records are terminated by CRLF, LF, or a
 *      lone CR. The last record does not need a terminator.
 *   2. A field that opens with `"` is quoted: it may contain `,`, CR/LF, and
 *      `""` for a literal quote. Its content is kept verbatim (inner line
 *      breaks included).
 *   3. Unquoted fields are trimmed. The previous line-based parser trimmed
 *      every value, and hand-written exports rely on it (`a, b`); quoted
 *      fields keep their spaces because quoting is the way to say "as typed".
 *   4. A leading UTF-8 BOM is stripped.
 *   5. Records that are a single unquoted empty field (blank lines) are
 *      skipped, matching the previous parser's `filter(Boolean)` — a trailing
 *      newline must not become a row.
 *   6. Every record must have as many fields as the first (header) record. A
 *      mismatch raises `CsvFormatError` instead of silently padding or
 *      dropping columns.
 *
 * Tolerance: text after a closing quote (`"a"b`) is appended rather than
 * rejected, and an opening quote may be preceded by whitespace (`a, "b"`).
 * Both shapes appear in hand-edited exports; rejecting them would turn files
 * the old parser imported (incorrectly) into hard failures. Structural damage
 * that changes the number of fields is still reported.
 *
 * Trace: ImportFileParserService.parseImportFile.
 */

const BYTE_ORDER_MARK = "\uFEFF";

/** A CSV document whose field counts do not line up with its header record. */
export class CsvFormatError extends Error {
  /**
   * @param record 1-based record number in the file (record 1 is the header).
   * @param message Human-readable, safe to surface to the API client.
   */
  constructor(
    readonly record: number,
    message: string,
  ) {
    super(message);
    this.name = "CsvFormatError";
  }
}

/**
 * Parse `text` into records of fields. Returns `[]` for empty input.
 * @throws CsvFormatError when records do not all match the header's field count.
 */
export function parseCsvRecords(text: string): string[][] {
  const input = text.startsWith(BYTE_ORDER_MARK) ? text.slice(BYTE_ORDER_MARK.length) : text;
  const records: string[][] = [];
  let fields: string[] = [];
  let value = "";
  let quoted = false;
  let insideQuotes = false;
  let index = 0;

  const closeField = (): void => {
    fields.push(quoted ? value : value.trim());
    value = "";
    quoted = false;
  };

  const closeRecord = (): void => {
    const wasQuoted = quoted;

    closeField();

    const isBlank = !wasQuoted && fields.length === 1 && fields[0] === "";

    if (!isBlank) {
      records.push(fields);
    }

    fields = [];
  };

  while (index < input.length) {
    const character = input[index] ?? "";

    if (insideQuotes) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          value += '"';
          index += 2;
          continue;
        }

        insideQuotes = false;
        index += 1;
        continue;
      }

      value += character;
      index += 1;
      continue;
    }

    if (character === '"' && value.trim() === "") {
      // Opening quote: whitespace before it is separator padding, not data.
      quoted = true;
      value = "";
      insideQuotes = true;
      index += 1;
      continue;
    }

    if (character === ",") {
      closeField();
      index += 1;
      continue;
    }

    if (character === "\r" || character === "\n") {
      if (character === "\r" && input[index + 1] === "\n") {
        index += 1;
      }

      closeRecord();
      index += 1;
      continue;
    }

    value += character;
    index += 1;
  }

  if (insideQuotes) {
    throw new CsvFormatError(
      records.length + 1,
      `CSV record ${records.length + 1} has an unterminated quoted field`,
    );
  }

  if (value.length > 0 || quoted || fields.length > 0) {
    closeRecord();
  }

  const expectedFields = records[0]?.length ?? 0;

  records.forEach((record, recordIndex) => {
    if (record.length !== expectedFields) {
      throw new CsvFormatError(
        recordIndex + 1,
        `CSV record ${recordIndex + 1} has ${record.length} field(s) but the header has ${expectedFields}`,
      );
    }
  });

  return records;
}
