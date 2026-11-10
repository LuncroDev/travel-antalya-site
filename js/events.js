/* Shared by Eleventy and the browser: date-only event boundaries use Antalya time. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') {
    root.AntalyaEvents = api;
    document.addEventListener('DOMContentLoaded', () => api.init(document));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function eventDate(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : '';
  }
  function todayInAntalya(now = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  }
  function eventStatus(data, today = todayInAntalya()) {
    const start = eventDate(data.start_date), end = eventDate(data.end_date) || start;
    if (data.status_uncertain === true) return 'uncertain';
    if (data.date_verified !== true || !start || (data.end_date && !eventDate(data.end_date)) || end < start) return 'awaiting';
    if (end < today) return 'archive';
    return start > today ? 'upcoming' : 'current';
  }
  function eventStatusLabel(status) {
    return { uncertain: 'Status uncertain', upcoming: 'Upcoming', current: 'On now', archive: 'Past edition', awaiting: 'Awaiting verified dates' }[status] || 'Awaiting verified dates';
  }
  function eventDateLabel(data) {
    if (eventStatus(data) === 'awaiting') return 'Dates not verified';
    const format = value => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(eventDate(value) + 'T12:00:00Z'));
    return (data.status_uncertain === true ? 'Listed date: ' : '') + format(data.start_date) + (eventDate(data.end_date) && eventDate(data.end_date) !== eventDate(data.start_date) ? ' – ' + format(data.end_date) : '');
  }
  function normalize(value) {
    return String(value || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function matchesEvent(data, filters, today = todayInAntalya()) {
    const status = eventStatus(data, today);
    const period = filters.period || 'all';
    if (period === 'active' && !['current', 'upcoming'].includes(status)) return false;
    if (!['active', 'all'].includes(period) && period !== status) return false;
    if (filters.category && filters.category !== data.category) return false;
    if (filters.query && !normalize([data.title, data.venue, data.category].join(' ')).includes(normalize(filters.query).trim())) return false;
    if (filters.from || filters.to) {
      if (status === 'awaiting') return false;
      if (filters.from && (eventDate(data.end_date) || eventDate(data.start_date)) < filters.from) return false;
      if (filters.to && eventDate(data.start_date) > filters.to) return false;
    }
    return true;
  }
  function init(doc) {
    doc.querySelectorAll('[data-event-directory]').forEach(directory => {
      const form = directory.querySelector('[data-event-filters]');
      const rows = Array.from(directory.querySelectorAll('[data-event]'));
      const items = rows.map(row => ({ row, data: {
        title: row.dataset.title, venue: row.dataset.venue, category: row.dataset.category,
        start_date: row.dataset.start, end_date: row.dataset.end, date_verified: row.dataset.verified === 'true', status_uncertain: row.dataset.uncertain === 'true'
      }}));
      function render() {
        const today = todayInAntalya();
        const filters = form ? Object.fromEntries(new FormData(form)) : {};
        const invalid = filters.from && filters.to && filters.from > filters.to;
        let count = 0;
        items.forEach(({ row, data }) => {
          const status = eventStatus(data, today);
          row.dataset.status = status;
          row.querySelectorAll('[data-event-status]').forEach(label => { label.textContent = eventStatusLabel(status); });
          row.hidden = !!invalid || !matchesEvent(data, filters, today);
          if (!row.hidden) count++;
        });
        const result = directory.querySelector('[data-event-count]');
        if (result) result.textContent = invalid ? 'Choose an end date on or after the start date.' : count + (count === 1 ? ' listing' : ' listings') + ' shown';
        const empty = directory.querySelector('[data-event-empty]');
        if (empty) empty.hidden = count !== 0 || !!invalid;
      }
      if (form) {
        form.hidden = false;
        form.addEventListener('input', render);
        form.addEventListener('change', render);
        form.addEventListener('submit', event => { event.preventDefault(); render(); });
        form.addEventListener('reset', () => setTimeout(render, 0));
      }
      render();
      // Reclassify an open tab after local midnight, without requiring a rebuild.
      setInterval(render, 60000);
      doc.addEventListener('visibilitychange', render);
    });
  }
  return { eventDate, todayInAntalya, eventStatus, eventStatusLabel, eventDateLabel, matchesEvent, normalize, init };
});
