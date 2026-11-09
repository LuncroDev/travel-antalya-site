'use strict';
function slugify(value) {
  return String(value || '').toLowerCase().replace(/[çğıöşü]/g, c => ({ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'}[c])).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function jsonForHtml(value) { return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026'); }
function absoluteUrl(value) { return /^https:\/\//.test(value || '') ? value : `https://travel-antalya.com${value || '/images/photos/antalya-beach-drone.jpg'}`; }
function publicUrl(value) { return (value || '/').replace(/index\.html$/, ''); }
module.exports = { slugify, jsonForHtml, absoluteUrl, publicUrl };
