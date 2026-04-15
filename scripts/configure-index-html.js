#!/usr/bin/env node

/**
 * Script para configurar dinámicamente index.html según el tenant
 * 
 * USO:
 * ============================================================
 * 
 * # Para ver qué cambios haría (recomendado primero)
 * node scripts/configure-index-html.js salud-gpt --dry-run
 * 
 * # Para aplicar los cambios
 * node scripts/configure-index-html.js salud-gpt
 * 
 * # Para restaurar configuración de DxGPT
 * node scripts/configure-index-html.js dxgpt
 * 
 * # Para ver ayuda
 * node scripts/configure-index-html.js --help
 * 
 * TENANTS DISPONIBLES:
 * ============================================================
 *   dxgpt     - DxGPT (configuración por defecto)
 *   dxeugpt   - DxGPT EU (GDPR compliant)
 *   salud-gpt - SALUD-GPT
 *   sermas-gpt - SermasGPT
 *   iasalut-ajuda-dx - IASalutAjudaDx
 *   canarias-gpt - CanariasGPT
 * 
 * NOTA:
 * ============================================================
 * Los scripts de analytics (GA, Google Ads, Hotjar) se cargan
 * dinámicamente desde Angular (analytics.service.ts), no desde
 * el index.html. Este script solo configura meta tags y favicon.
 * 
 * BACKUP:
 * ============================================================
 * - Se crea automáticamente antes de cada cambio
 * - Formato: src/index.html.backup.1234567890
 * 
 * EJEMPLOS:
 * ============================================================
 * node scripts/configure-index-html.js dxgpt --dry-run
 * node scripts/configure-index-html.js dxeugpt
 * node scripts/configure-index-html.js salud-gpt --dry-run
 * node scripts/configure-index-html.js salud-gpt
 * node scripts/configure-index-html.js sermas-gpt
 * node scripts/configure-index-html.js iasalut-ajuda-dx
 * node scripts/configure-index-html.js canarias-gpt
 */

const fs = require('fs');

// Configuración de tenants (solo meta tags y favicon)
const TENANT_CONFIGS = {
  'dxgpt': {
    name: 'DxGPT',
    title: 'DxGPT: Free AI Clinical Decision Support for Complex & Rare Diseases',
    description: 'DxGPT is an advanced AI-powered diagnostic decision support web application that helps physicians and patients with the diagnosis of rare and complex diseases.',
    keywords: 'dx, GPT, rare disease, diagnosis, genetic, physicians, Artificial intelligence, AI, genomics, disease',
    ogImage: 'https://dxgpt.app/assets/img/logo-Dx29.png',
    ogUrl: 'https://dxgpt.app',
    favicon: 'favicon.ico'
  },
  'dxeugpt': {
    name: 'DxGPT EU',
    title: 'DxGPT EU: Augmented intelligence to prepare your medical consultation',
    description: 'DxGPT EU is an augmented-intelligence tool to help you organize information for your medical consultation. It structures symptoms and possible clinical evaluation areas, highlighting what fits or not with your description. Multilingual, GDPR-ready, privacy-first, and free for clinicians and patients.',
    keywords: 'DxGPT, augmented intelligence, clinical preparation, structured evaluation, rare diseases, multilingual, GDPR, privacy-first, healthcare AI',
    ogImage: 'https://dxgpt.app/assets/img/logo-Dx29.png',
    ogUrl: 'https://dxgpt.app',
    favicon: 'favicon.ico'
  },
  'SALUD-GPT': {
    name: 'SALUD-GPT',
    title: 'SALUD-GPT: Free AI Clinical Decision Support for Complex & Rare Diseases',
    description: 'SALUD-GPT is an advanced AI-powered diagnostic decision support web application that helps physicians and patients with the diagnosis of rare and complex diseases.',
    keywords: 'dx, GPT, rare disease, diagnosis, genetic, physicians, Artificial intelligence, AI, genomics, disease',
    ogImage: 'https://dxgpt.app/assets/img/logo-Dx29.png',
    ogUrl: 'https://dxgpt.app',
    favicon: 'favicon-salud.ico'
  },
  'SermasGPT': {
    name: 'SermasGPT',
    title: 'SermasGPT: Free AI Clinical Decision Support for Complex & Rare Diseases',
    description: 'SermasGPT is an advanced AI-powered diagnostic decision support web application that helps physicians and patients with the diagnosis of rare and complex diseases.',
    keywords: 'dx, GPT, rare disease, diagnosis, genetic, physicians, Artificial intelligence, AI, genomics, disease',
    ogImage: 'https://dxgpt.app/assets/img/logo-Dx29.png',
    ogUrl: 'https://dxgpt.app',
    favicon: 'favicon-sermas.ico'
  },
  'IASalutAjudaDx': {
    name: 'IASalutAjudaDx',
    title: 'IASalutAjudaDx: Free AI Clinical Decision Support for Complex & Rare Diseases',
    description: 'IASalutAjudaDx is an advanced AI-powered diagnostic decision support web application that helps physicians and patients with the diagnosis of rare and complex diseases.',
    keywords: 'dx, GPT, rare disease, diagnosis, genetic, physicians, Artificial intelligence, AI, genomics, disease',
    ogImage: 'https://dxgpt.app/assets/img/logo-Dx29.png',
    ogUrl: 'https://dxgpt.app',
    favicon: 'favicon-iasalut.ico'
  },
  'CanariasGPT': {
    name: 'CanariasGPT',
    title: 'CanariasGPT: Free AI Clinical Decision Support for Complex & Rare Diseases',
    description: 'CanariasGPT is an advanced AI-powered diagnostic decision support web application that helps physicians and patients with the diagnosis of rare and complex diseases.',
    keywords: 'dx, GPT, rare disease, diagnosis, genetic, physicians, Artificial intelligence, AI, genomics, disease',
    ogImage: 'https://dxgpt.app/assets/img/logo-Dx29.png',
    ogUrl: 'https://dxgpt.app',
    favicon: 'favicon-canarias.ico'
  }
};

// Función para reemplazar texto en el HTML
function replaceInHtml(content, config) {
  let modifiedContent = content;
  
  // Reemplazar título
  modifiedContent = modifiedContent.replace(
    /<title>.*?<\/title>/g,
    `<title>${config.title}</title>`
  );
  
  // Reemplazar meta title
  modifiedContent = modifiedContent.replace(
    /<meta name="title" content=".*?">/g,
    `<meta name="title" content="${config.title}">`
  );
  
  // Reemplazar meta description
  modifiedContent = modifiedContent.replace(
    /<meta name="description" content=".*?">/g,
    `<meta name="description" content="${config.description}">`
  );
  
  // Reemplazar meta keywords
  modifiedContent = modifiedContent.replace(
    /<meta name="keywords" content=".*?" \/>/g,
    `<meta name="keywords" content="${config.keywords}" />`
  );
  
  // Reemplazar og:site_name
  modifiedContent = modifiedContent.replace(
    /<meta property="og:site_name" content=".*?">/g,
    `<meta property="og:site_name" content="${config.name}">`
  );
  
  // Reemplazar og:title
  modifiedContent = modifiedContent.replace(
    /<meta property="og:title" content=".*?">/g,
    `<meta property="og:title" content="${config.title}">`
  );
  
  // Reemplazar og:description
  modifiedContent = modifiedContent.replace(
    /<meta property="og:description" content=".*?">/g,
    `<meta property="og:description" content="${config.description}">`
  );
  
  // Reemplazar og:image
  modifiedContent = modifiedContent.replace(
    /<meta property="og:image" content=".*?">/g,
    `<meta property="og:image" content="${config.ogImage}">`
  );
  
  // Reemplazar og:url
  modifiedContent = modifiedContent.replace(
    /<meta property="og:url" content=".*?">/g,
    `<meta property="og:url" content="${config.ogUrl}">`
  );
  
  // Reemplazar twitter:title
  modifiedContent = modifiedContent.replace(
    /<meta name="twitter:title" content=".*?">/g,
    `<meta name="twitter:title" content="${config.title}">`
  );
  
  // Reemplazar twitter:description
  modifiedContent = modifiedContent.replace(
    /<meta name="twitter:description" content=".*?">/g,
    `<meta name="twitter:description" content="${config.description}">`
  );
  
  // Reemplazar twitter:image
  modifiedContent = modifiedContent.replace(
    /<meta name="twitter:image" content=".*?">/g,
    `<meta name="twitter:image" content="${config.ogImage}">`
  );
  
  // Reemplazar favicon
  modifiedContent = modifiedContent.replace(
    /<link rel="icon" type="image\/x-icon" href="[^"]*">/g,
    `<link rel="icon" type="image/x-icon" href="${config.favicon}">`
  );
  
  return modifiedContent;
}

// Función principal
function configureIndexHtml(tenant, dryRun = false) {
  const config = TENANT_CONFIGS[tenant];
  
  if (!config) {
    console.error(`❌ Error: Tenant '${tenant}' no encontrado`);
    console.log('Tenants disponibles:', Object.keys(TENANT_CONFIGS).join(', '));
    process.exit(1);
  }
  
  const indexPath = 'src/index.html';
  
  if (!fs.existsSync(indexPath)) {
    console.error(`❌ Error: No se encontró ${indexPath}`);
    process.exit(1);
  }
  
  console.log(`🔄 Configurando index.html para tenant: ${tenant}`);
  console.log(`📋 Configuración:`, config.name);
  console.log('============================================================');
  
  // Leer archivo actual
  const originalContent = fs.readFileSync(indexPath, 'utf8');
  
  // Aplicar cambios
  const modifiedContent = replaceInHtml(originalContent, config);
  
  if (dryRun) {
    console.log('🔍 MODO DRY-RUN: Mostrando cambios propuestos');
    console.log('');
    
    // Mostrar diferencias clave
    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');
    
    for (let i = 0; i < Math.min(originalLines.length, modifiedLines.length); i++) {
      if (originalLines[i] !== modifiedLines[i]) {
        console.log(`📝 Línea ${i + 1}:`);
        console.log(`   Antes: ${originalLines[i].trim()}`);
        console.log(`   Después: ${modifiedLines[i].trim()}`);
        console.log('');
      }
    }
    
    console.log('💡 Para aplicar los cambios, ejecuta:');
    console.log(`   node scripts/configure-index-html.js ${tenant}`);
    
  } else {
    // Crear backup
    const backupPath = `src/index.html.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, originalContent, 'utf8');
    console.log(`💾 Backup creado: ${backupPath}`);
    
    // Aplicar cambios
    fs.writeFileSync(indexPath, modifiedContent, 'utf8');
    console.log('✅ index.html configurado correctamente');
  }
  
  console.log('🎯 ¡Proceso completado!');
}

// Procesar argumentos
const args = process.argv.slice(2);
const tenant = args[0] || 'dxgpt';
const dryRun = args.includes('--dry-run');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Uso: node scripts/configure-index-html.js [tenant] [--dry-run]

Tenants disponibles:
  dxgpt     - DxGPT (configuración por defecto)
  dxeugpt   - DxGPT EU (GDPR compliant)
  salud-gpt - SALUD-GPT
  sermas-gpt - SermasGPT
  iasalut-ajuda-dx - IASalutAjudaDx
  canarias-gpt - CanariasGPT

Opciones:
  --dry-run    Solo muestra qué cambios se harían
  --help, -h   Muestra esta ayuda

Nota: Los scripts de analytics se cargan dinámicamente desde Angular
      (analytics.service.ts), no desde el index.html.

Ejemplos:
  node scripts/configure-index-html.js dxgpt --dry-run
  node scripts/configure-index-html.js dxeugpt
  node scripts/configure-index-html.js salud-gpt
  node scripts/configure-index-html.js sermas-gpt
  node scripts/configure-index-html.js iasalut-ajuda-dx
  node scripts/configure-index-html.js canarias-gpt
  `);
  process.exit(0);
}

configureIndexHtml(tenant, dryRun);
