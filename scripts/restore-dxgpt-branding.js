#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Restaurando index.html con configuración DxGPT actual...');
execSync('node scripts/configure-index-html.js dxgpt', { stdio: 'inherit' });

// Restaurar traducciones desde backup
execSync('node scripts/restore-backup.js', { stdio: 'inherit' });

console.log('Mostrando cambios realizados:');
execSync('git status', { stdio: 'inherit' });
execSync('git diff', { stdio: 'inherit' });

console.log('\n✅ Branding y traducciones restaurados a DxGPT. Revisa los cambios y haz commit.'); 