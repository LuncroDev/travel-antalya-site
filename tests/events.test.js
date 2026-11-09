const test = require('node:test');
const assert = require('node:assert/strict');
const { eventDate, todayInAntalya, eventStatus, matchesEvent, eventDateLabel } = require('../lib/events');
const event = { title: 'Kaleiçi Festival', category: 'Festivals', venue: 'Antalya', start_date: '2026-11-09', end_date: '2026-11-20', date_verified: true };
test('inclusive ranges become archives after their end, not during the final day', () => {
  assert.equal(eventStatus(event, '2026-11-08'), 'upcoming');
  assert.equal(eventStatus(event, '2026-11-09'), 'current');
  assert.equal(eventStatus(event, '2026-11-20'), 'current');
  assert.equal(eventStatus(event, '2026-11-21'), 'archive');
});
test('unverified and invalid dates never become upcoming', () => {
  assert.equal(eventStatus({ ...event, date_verified: false }), 'awaiting');
  assert.equal(eventStatus({ ...event, start_date: '2026-02-30' }), 'awaiting');
  assert.equal(eventStatus({ ...event, end_date: '2026-01-01' }), 'awaiting');
  assert.equal(eventDate('2026-02-30'), '');
  assert.equal(eventDateLabel({}), 'Dates not verified');
});
test('YAML dates and Antalya midnight are handled', () => {
  assert.equal(eventDate(new Date('2026-11-09T00:00:00Z')), '2026-11-09');
  assert.equal(todayInAntalya(new Date('2026-11-08T21:01:00Z')), '2026-11-09');
});
test('search, category, date overlap and archive filters combine', () => {
  assert.equal(matchesEvent(event, { query: 'kaleici', category: 'Festivals', from: '2026-11-15', to: '2026-11-16', period: 'active' }, '2026-11-09'), true);
  assert.equal(matchesEvent(event, { from: '2026-11-21' }), false);
  assert.equal(matchesEvent(event, { category: 'Sports' }), false);
  assert.equal(matchesEvent(event, { period: 'active' }, '2027-01-01'), false);
  assert.equal(matchesEvent(event, { period: 'archive' }, '2027-01-01'), true);
  assert.equal(matchesEvent({ ...event, date_verified: false }, { from: '2026-01-01' }), false);
});
test('malformed end dates cannot silently become one-day events', () => {
  assert.equal(eventStatus({ ...event, end_date: '2026-02-31' }), 'awaiting');
});
test('every event has traceable review data and valid verified dates', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const matter = require('gray-matter');
  const directory = path.join(__dirname, '../content/events');
  const records = fs.readdirSync(directory).filter(name => name.endsWith('.md')).map(name => matter(fs.readFileSync(path.join(directory, name), 'utf8')).data);
  for (const data of records) {
    assert.match(data.source_url, /^https:\/\//);
    assert.ok(eventDate(data.last_checked));
    assert.ok(data.verification_note);
    if (data.date_verified) {
      assert.ok(eventDate(data.start_date));
      if (data.end_date) { assert.ok(eventDate(data.end_date)); assert.ok(eventDate(data.start_date) <= eventDate(data.end_date)); }
    } else {
      assert.equal(data.start_date, undefined);
      assert.equal(data.end_date, undefined);
    }
  }
  assert.ok(records.filter(data => eventStatus(data, '2026-11-09') === 'upcoming').length >= 50);
  assert.equal(records.filter(data => eventStatus(data, '2026-11-09') === 'current').length, 1);
  assert.equal(records.filter(data => eventStatus(data, '2026-11-09') === 'archive').length, 3);
  assert.equal(records.filter(data => eventStatus(data, '2026-11-09') === 'awaiting').length, 4);
});
