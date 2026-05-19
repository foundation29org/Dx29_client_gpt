#!/usr/bin/env node

const { execSync } = require('child_process');

const args = process.argv.slice(2);
const tenant = args[0];

const TENANT_DISPLAY_NAMES = {
  'dxgpt': 'DxGPT',
  'dxeugpt': 'DxGPT',
  'salud-gpt': 'SALUD-GPT',
  'sermas-gpt': 'SermasGPT',
  'iasalut-ajuda-dx': 'IASalutAjudaDx',
  'SALUD-GPT': 'SALUD-GPT',
  'SermasGPT': 'SermasGPT',
  'IASalutAjudaDx': 'IASalutAjudaDx',
};

if (!tenant) {
  console.error('Uso: node scripts/prepare-tenant-release.js <tenant>');
  process.exit(1);
}

console.log(`Configurando index.html para ${tenant}...`);
execSync(`node scripts/configure-index-html.js ${tenant}`, { stdio: 'inherit' });

const displayName = TENANT_DISPLAY_NAMES[tenant] || tenant;
console.log(`Reemplazando branding en traducciones para ${displayName}...`);
execSync(`node scripts/replace-dxgpt-for-tenant.js ${displayName} --backup`, { stdio: 'inherit' });

console.log('Mostrando cambios realizados:');
execSync('git status', { stdio: 'inherit' });
execSync('git diff', { stdio: 'inherit' });

console.log(`\n✅ Listo. Revisa los cambios y haz commit.`); 