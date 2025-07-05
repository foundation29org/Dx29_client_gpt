#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('Restaurando index.html para DxGPT...');
execSync('node scripts/configure-index-html.js dxgpt', { stdio: 'inherit' });

// Si tienes un script de restauración de traducciones, descomenta la siguiente línea:
 execSync('node scripts/restore-backup.js', { stdio: 'inherit' });

console.log('Mostrando cambios realizados:');
execSync('git status', { stdio: 'inherit' });
execSync('git diff', { stdio: 'inherit' });

console.log('\n✅ Branding restaurado a DxGPT. Revisa los cambios y haz commit.'); 