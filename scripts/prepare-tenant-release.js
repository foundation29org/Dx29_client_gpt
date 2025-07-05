#!/usr/bin/env node

const { execSync } = require('child_process');

const args = process.argv.slice(2);
const tenant = args[0];

if (!tenant) {
  console.error('Uso: node scripts/prepare-tenant-release.js <tenant>');
  process.exit(1);
}

console.log(`Configurando index.html para ${tenant}...`);
execSync(`node scripts/configure-index-html.js ${tenant}`, { stdio: 'inherit' });

console.log(`Reemplazando branding en traducciones para ${tenant}...`);
execSync(`node scripts/replace-dxgpt-for-tenant.js ${tenant} --backup`, { stdio: 'inherit' });

console.log('Mostrando cambios realizados:');
execSync('git status', { stdio: 'inherit' });
execSync('git diff', { stdio: 'inherit' });

console.log(`\n✅ Listo. Revisa los cambios y haz commit.`); 