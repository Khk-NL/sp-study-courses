import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import './build.mjs';

const SIZE_LIMIT = 100_000;
const ENTRIES = [
  'manifest.json',
  'plugin.js',
  'index.html',
  'icon.svg',
  'course-import-template.csv',
  'i18n/en.json',
  'i18n/zh.json',
];
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value;
  }
  return table;
})();

/**
 * Serialize entries into a flat ZIP archive with a fixed DOS timestamp, so
 * packaging the same files twice produces byte-identical output.
 *
 * @param {{ name: string, data: Buffer }[]} files Files in archive order.
 * @returns {Buffer} Complete ZIP archive bytes.
 */
function buildArchive(files) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of files) {
    const path = Buffer.from(name, 'utf8');
    const compressed = deflateRawSync(data);
    const checksum = crc32(data);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(0x21, 12);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(path.length, 26);
    local.push(header, path, compressed);

    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(0x0800, 8);
    directory.writeUInt16LE(8, 10);
    directory.writeUInt16LE(0, 12);
    directory.writeUInt16LE(0x21, 14);
    directory.writeUInt32LE(checksum, 16);
    directory.writeUInt32LE(compressed.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(path.length, 28);
    directory.writeUInt32LE(offset, 42);
    central.push(directory, path);

    offset += header.length + path.length + compressed.length;
  }

  const centralSize = central.reduce((total, part) => total + part.length, 0);
  const footer = Buffer.alloc(22);
  footer.writeUInt32LE(0x06054b50, 0);
  footer.writeUInt16LE(files.length, 8);
  footer.writeUInt16LE(files.length, 10);
  footer.writeUInt32LE(centralSize, 12);
  footer.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, footer]);
}

/**
 * Read back an archive written by {@link buildArchive}.
 *
 * @param {Buffer} buffer Archive bytes.
 * @returns {Map<string, Buffer>} Uncompressed contents by archive path.
 */
function readArchive(buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error('Packaged ZIP has no end-of-central-directory record');
  const restored = new Map();
  let offset = buffer.readUInt32LE(end + 16);
  const count = buffer.readUInt16LE(end + 10);
  for (let index = 0; index < count; index++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Packaged ZIP has a corrupt central directory');
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    const payload =
      localOffset +
      30 +
      buffer.readUInt16LE(localOffset + 26) +
      buffer.readUInt16LE(localOffset + 28);
    const raw = buffer.subarray(payload, payload + compressedSize);
    restored.set(name, method === 8 ? inflateRawSync(raw) : Buffer.from(raw));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return restored;
}

/**
 * CRC-32 of a buffer, as required by the ZIP local and central headers.
 *
 * @param {Buffer} buffer Entry contents.
 * @returns {number} Unsigned 32-bit checksum.
 */
function crc32(buffer) {
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const archivePath = fileURLToPath(new URL('../sp-study-courses.zip', import.meta.url));

const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (manifest.version !== pkg.version) {
  throw new Error(
    `manifest.json version ${manifest.version} does not match package.json version ${pkg.version}`,
  );
}
if (JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8')).version !== manifest.version) {
  throw new Error('dist/manifest.json does not carry the current version');
}

const entries = ENTRIES.map((name) => ({ name, data: readFileSync(join(dist, name)) }));
const indexHtml = entries.find((entry) => entry.name === 'index.html').data;
if (indexHtml.length >= SIZE_LIMIT) {
  throw new Error(`Built index.html is ${indexHtml.length} bytes; plugin limit is ${SIZE_LIMIT}`);
}

const archive = buildArchive(entries);
writeFileSync(archivePath, archive);

const restored = readArchive(readFileSync(archivePath));
const missing = ENTRIES.filter((name) => !restored.has(name));
if (missing.length || restored.size !== ENTRIES.length) {
  throw new Error(`Packaged ZIP entry set is wrong; missing: ${missing.join(', ') || 'none'}`);
}
if (!restored.get('index.html').equals(indexHtml)) {
  throw new Error('Packaged index.html differs from dist/index.html');
}

const kilobytes = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
console.log(
  `Packaged sp-study-courses.zip: v${manifest.version}, ${ENTRIES.length} entries, ` +
    `${kilobytes(archive.length)}, index.html ${kilobytes(indexHtml.length)} of ${kilobytes(SIZE_LIMIT)}`,
);
