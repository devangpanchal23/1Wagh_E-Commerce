const zlib = require('zlib');

/**
 * Dependency-free XLSX (Office Open XML SpreadsheetML) writer.
 *
 * An .xlsx file is just a ZIP archive of XML parts, so this builds both by hand
 * using Node's built-in zlib — no third-party spreadsheet library required.
 * Values are written as inline strings (or real date serials), which keeps phone
 * numbers and pincodes intact instead of letting Excel coerce them into
 * scientific notation.
 */

// ---------------------------------------------------------------------------
// ZIP container primitives
// ---------------------------------------------------------------------------

const CRC32_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

const crc32 = (buffer) => {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};

// ZIP stores timestamps in legacy MS-DOS format (2-second resolution, 1980 epoch)
const toDosDateTime = (date) => {
  const year = Math.max(1980, date.getFullYear());
  return {
    dosTime: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    dosDate: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
};

/**
 * Build a ZIP archive from `[{ name, data }]` entries using deflate compression.
 */
const createZip = (entries, modifiedAt = new Date()) => {
  const { dosTime, dosDate } = toDosDateTime(modifiedAt);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const content = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const compressed = zlib.deflateRawSync(content, { level: 9 });
    const checksum = crc32(content);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed to extract (2.0)
    localHeader.writeUInt16LE(0, 6); // general purpose bit flag
    localHeader.writeUInt16LE(8, 8); // compression method: deflate
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra field length
    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // central directory signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed to extract
    centralHeader.writeUInt16LE(0, 8); // general purpose bit flag
    centralHeader.writeUInt16LE(8, 10); // compression method: deflate
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // file comment length
    centralHeader.writeUInt16LE(0, 34); // disk number start
    centralHeader.writeUInt16LE(0, 36); // internal file attributes
    centralHeader.writeUInt32LE(0, 38); // external file attributes
    centralHeader.writeUInt32LE(offset, 42); // offset of local header
    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  endRecord.writeUInt16LE(0, 4); // number of this disk
  endRecord.writeUInt16LE(0, 6); // disk where central directory starts
  endRecord.writeUInt16LE(entries.length, 8); // entries on this disk
  endRecord.writeUInt16LE(entries.length, 10); // total entries
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16); // central directory offset
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
};

// ---------------------------------------------------------------------------
// SpreadsheetML helpers
// ---------------------------------------------------------------------------

// XML 1.0 forbids most control characters outright — strip them before escaping
// so one bad legacy database row can never corrupt the whole workbook.
const escapeXml = (value) =>
  String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Excel column letters: 1 -> A, 27 -> AA
const columnLetter = (index) => {
  let letter = '';
  let n = index;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
};

// Excel's 1900 date system counts days from 1899-12-30 (it keeps the 1900 leap-year bug)
const EXCEL_EPOCH_OFFSET = 25569;
const MS_PER_DAY = 86400000;

/**
 * Convert a `YYYY-MM-DD` string or Date into an Excel date serial number.
 * Returns null when the value can't be read as a calendar date, so callers can
 * fall back to writing the raw text instead of inventing a wrong date.
 */
const toExcelDateSerial = (value) => {
  if (!value) return null;

  let utcMs;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    utcMs = Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  } else {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
    if (!match) return null;
    const [, y, m, d] = match;
    const parsed = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.getUTCFullYear() !== Number(y) ||
      parsed.getUTCMonth() !== Number(m) - 1 ||
      parsed.getUTCDate() !== Number(d)
    ) {
      return null; // rejects impossible dates like 2026-02-31
    }
    utcMs = parsed.getTime();
  }

  const serial = utcMs / MS_PER_DAY + EXCEL_EPOCH_OFFSET;
  return serial > 0 ? serial : null;
};

// cellXfs indexes declared in buildStylesXml below
const STYLE_BODY = 1;
const STYLE_HEADER = 2;
const STYLE_DATE = 3;

const buildStylesXml = (headerColorArgb) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd-mmm-yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><color rgb="FF1A1A1A"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="${headerColorArgb}"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDDDDDD"/></left><right style="thin"><color rgb="FFDDDDDD"/></right><top style="thin"><color rgb="FFDDDDDD"/></top><bottom style="thin"><color rgb="FFDDDDDD"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

const buildCell = (ref, column, rawValue) => {
  if (column.type === 'date') {
    const serial = toExcelDateSerial(rawValue);
    if (serial !== null) {
      return `<c r="${ref}" s="${STYLE_DATE}"><v>${serial}</v></c>`;
    }
  }

  if (column.type === 'number' && rawValue !== null && rawValue !== '' && Number.isFinite(Number(rawValue))) {
    return `<c r="${ref}" s="${STYLE_BODY}"><v>${Number(rawValue)}</v></c>`;
  }

  const text = rawValue === null || rawValue === undefined ? '' : String(rawValue);
  if (!text) return `<c r="${ref}" s="${STYLE_BODY}"/>`;

  // xml:space="preserve" keeps leading/trailing spaces from being dropped
  return `<c r="${ref}" s="${STYLE_BODY}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
};

const buildSheetXml = (columns, rows) => {
  const lastColumn = columnLetter(columns.length);
  const lastRow = rows.length + 1; // +1 for the header row

  const colsXml = columns
    .map((col, i) => `<col min="${i + 1}" max="${i + 1}" width="${col.width || 20}" customWidth="1"/>`)
    .join('');

  const headerXml = columns
    .map(
      (col, i) =>
        `<c r="${columnLetter(i + 1)}1" s="${STYLE_HEADER}" t="inlineStr"><is><t>${escapeXml(col.header)}</t></is></c>`
    )
    .join('');

  const bodyXml = rows
    .map((row, rowIndex) => {
      const r = rowIndex + 2;
      const cells = columns
        .map((col, colIndex) => buildCell(`${columnLetter(colIndex + 1)}${r}`, col, row[col.key]))
        .join('');
      return `<row r="${r}">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastColumn}${lastRow}"/><sheetViews><sheetView tabSelected="1" workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${colsXml}</cols><sheetData><row r="1" ht="22" customHeight="1">${headerXml}</row>${bodyXml}</sheetData><autoFilter ref="A1:${lastColumn}${lastRow}"/></worksheet>`;
};

// Excel rejects sheet names containing : \ / ? * [ ] or longer than 31 chars
const sanitizeSheetName = (name) => {
  const cleaned = String(name || 'Sheet1')
    .replace(/[:\\/?*[\]]/g, ' ')
    .trim()
    .slice(0, 31);
  return cleaned || 'Sheet1';
};

/**
 * Build a single-sheet .xlsx workbook.
 *
 * @param {object} options
 * @param {string} [options.sheetName]     Worksheet tab label.
 * @param {Array<{header: string, key: string, width?: number, type?: 'text'|'date'|'number'}>} options.columns
 * @param {Array<object>} options.rows     Row objects keyed by `columns[].key`.
 * @param {string} [options.headerColor]   8-digit ARGB fill for the header row.
 * @param {Date}   [options.createdAt]     Timestamp stamped onto the zip entries.
 * @returns {Buffer} Complete .xlsx file.
 */
const buildXlsxBuffer = ({ sheetName = 'Sheet1', columns, rows = [], headerColor = 'FF0D5C52', createdAt } = {}) => {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('buildXlsxBuffer requires at least one column definition');
  }

  const safeSheetName = sanitizeSheetName(sheetName);

  const entries = [
    {
      name: '[Content_Types].xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(safeSheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: 'xl/styles.xml', data: buildStylesXml(headerColor) },
    { name: 'xl/worksheets/sheet1.xml', data: buildSheetXml(columns, rows) },
  ];

  return createZip(entries, createdAt instanceof Date ? createdAt : new Date());
};

module.exports = {
  buildXlsxBuffer,
  XLSX_CONTENT_TYPE: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
