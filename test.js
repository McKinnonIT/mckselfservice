// Expiry maths for PacketFence unregdate. Run: npm test
const assert = require('assert');
const express = require('express');
const { app, expiryDate, pfDate } = require('./server');

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

// Only admins may pick category/expiry. Runs the API against a fake PacketFence.
(async () => {
  const sent = [];
  const fakePf = express().use(express.json());
  fakePf.post('/login', (req, res) => res.json({ token: 't' }));
  fakePf.post('/users', (req, res) => res.json({}));
  fakePf.post('/user/:pid/password', (req, res) => { sent.push(req.body); res.json({}); });
  const pf = fakePf.listen(0);
  const api = app.listen(0);
  Object.assign(process.env, {
    VUE_APP_PACKETFENCE_USERNAME: 'u', VUE_APP_PACKETFENCE_PASSWORD: 'p',
    VUE_APP_PACKETFENCE_API_URL: `http://localhost:${pf.address().port}`,
  });

  const create = (headers) => fetch(`http://localhost:${api.address().port}/api-internal/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ username: 'x', password: 'y', category: '999', expiry: '3y' }),
  });
  const yearsOut = (body) => new Date(body.unregdate).getFullYear() - new Date().getFullYear();

  try {
    await create({ 'Remote-Role': 'staff' });
    assert.strictEqual(sent[0].category, '503');
    assert.strictEqual(yearsOut(sent[0]), 1);

    await create({});
    assert.strictEqual(sent[1].category, '503');

    await create({ 'Remote-Role': 'Admin' });
    assert.strictEqual(sent[2].category, '999');
    assert.strictEqual(yearsOut(sent[2]), 3);

    console.log('ok');
  } finally {
    pf.close();
    api.close();
  }
})().catch((err) => { console.error(err); process.exit(1); });
