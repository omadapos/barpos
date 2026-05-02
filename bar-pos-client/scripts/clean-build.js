/**
 * Borra artefactos de build (release + dist). Node puro — funciona en Windows/macOS/Linux.
 * Antes de `npm run rebuild`, cierra BarPOS.exe / Bar POS si está abierto (evita EBUSY en Windows).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
for (const dir of ['release', 'out', 'dist']) {
  const p = path.join(root, dir);
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log('Removed', dir);
  } catch (e) {
    console.warn('Could not remove', dir, e.message);
  }
}
