// Expiry maths for PacketFence unregdate. Run: npm test
const assert = require('assert');
const { expiryDate, pfDate } = require('./server');

const base = new Date('2024-01-15T10:30:00'); // local time, like PacketFence expects

assert.strictEqual(pfDate(new Date('2024-03-05T09:07:02')), '2024-03-05 09:07:02');

assert.strictEqual(pfDate(expiryDate('1w', base)), '2024-01-22 10:30:00');
assert.strictEqual(pfDate(expiryDate('2w', base)), '2024-01-29 10:30:00');
assert.strictEqual(pfDate(expiryDate('1m', base)), '2024-02-15 10:30:00');
assert.strictEqual(pfDate(expiryDate('6m', base)), '2024-07-15 10:30:00');
assert.strictEqual(pfDate(expiryDate('1y', base)), '2025-01-15 10:30:00');
assert.strictEqual(pfDate(expiryDate('3y', base)), '2027-01-15 10:30:00');

// Unknown or missing codes fall back to 1 year — never an Invalid Date.
assert.strictEqual(pfDate(expiryDate(undefined, base)), '2025-01-15 10:30:00');
assert.strictEqual(pfDate(expiryDate('../../etc/passwd', base)), '2025-01-15 10:30:00');

// Known, accepted quirk: month arithmetic past a short month rolls forward
// rather than clamping (Jan 31 + 1m -> Mar 2 in a leap year). Costs a spare
// day or two on an account expiry; not worth the clamping code.
assert.strictEqual(pfDate(expiryDate('1m', new Date('2024-01-31T10:30:00'))), '2024-03-02 10:30:00');

console.log('ok');
