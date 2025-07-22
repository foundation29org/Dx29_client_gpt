#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Restaurando index.html original desde backup más antiguo...');

const srcDir = path.join(__dirname, '../src');
const backups = fs.readdirSync(srcDir).filter(f => f.startsWith('index.html.backup.'));
if (backups.length === 0) {
  console.error('❌ No se encontró ningún backup de index.html. No se puede restaurar.');
  process.exit(1);
}
// Ordenar por timestamp ascendente (más antiguo primero)
backups.sort((a, b) => {
  const ta = parseInt(a.split('.').pop());
  const tb = parseInt(b.split('.').pop());
  return ta - tb;
});
const oldestBackup = backups[0];
const backupPath = path.join(srcDir, oldestBackup);
const indexPath = path.join(srcDir, 'index.html');
fs.copyFileSync(backupPath, indexPath);
console.log(`✅ index.html restaurado desde ${oldestBackup}`);

// Restaurar traducciones desde backup
execSync('node scripts/restore-backup.js', { stdio: 'inherit' });

console.log('Mostrando cambios realizados:');
execSync('git status', { stdio: 'inherit' });
execSync('git diff', { stdio: 'inherit' });

console.log('\n✅ Branding y traducciones restaurados a DxGPT. Revisa los cambios y haz commit.'); 