// _site is disposable Eleventy output. Clean it so removed pages never remain published.
require('node:fs').rmSync('_site', { recursive: true, force: true });
