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
 *   salud-gpt - SALUD-GPT (solo Google Analytics)
 * 
 * CONFIGURACIÓN:
 * ============================================================
 * - DxGPT: Google Analytics + Google Ads + Conversiones
 * - SALUD-GPT: Solo Google Analytics (Ads comentados)
 * 
 * BACKUP:
 * ============================================================
 * - Se crea automáticamente antes de cada cambio
 * - Formato: src/index.html.backup.1234567890
 * 
 * EJEMPLOS:
 * ============================================================
 * node scripts/configure-index-html.js salud-gpt --dry-run
 * node scripts/configure-index-html.js salud-gpt
 * node scripts/configure-index-html.js dxgpt
 */

const fs = require('fs');
const path = require('path');

// Configuración de tenants
const TENANT_CONFIGS = {
  'dxgpt': {
    name: 'DxGPT',
    title: 'DxGPT: Diagnostic decision support software based on GPT-4',
    description: 'DxGPT is a diagnostic decision support software based on GPT-4. AI that helps the diagnosis of diseases. Totally free for doctors and patients.',
    keywords: 'dx, GPT, rare disease, diagnosis, genetic, physicians, Artificial intelligence, AI, genomics, disease',
    ogImage: 'https://dxgpt.app/assets/img/logo-Dx29.png',
    ogUrl: 'https://dxgpt.app',
    analytics: {
      googleAnalytics: 'G-2FZQ49SRWY',
      googleAds: 'AW-335378785',
      googleAds2: 'AW-16829919003',
      conversion: 'AW-335378785/wcKYCMDpnJIZEOHy9Z8B'
    }
  },
  'salud-gpt': {
    name: 'SALUD-GPT',
    // Usar los textos de DxGPT (en inglés)
    title: 'DxGPT: Diagnostic decision support software based on GPT-4',
    description: 'DxGPT is a diagnostic decision support software based on GPT-4. AI that helps the diagnosis of diseases. Totally free for doctors and patients.',
    keywords: 'dx, GPT, rare disease, diagnosis, genetic, physicians, Artificial intelligence, AI, genomics, disease',
    ogImage: 'https://dxgpt.app/assets/img/logo-Dx29.png',
    ogUrl: 'https://dxgpt.app',
    analytics: {
      googleAnalytics: 'G-XXXXXXXXXX', // Configurar cuando esté disponible
      googleAds: null, // No usar Google Ads para SALUD-GPT
      googleAds2: null, // No usar Google Ads para SALUD-GPT
      conversion: null // No usar conversiones para SALUD-GPT
    }
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
    `<meta property="og:site_name" content="${config.title}">`
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
  
  // Reemplazar Google Analytics
  modifiedContent = modifiedContent.replace(
    /gtag\('config', 'G-2FZQ49SRWY'\);/g,
    `gtag('config', '${config.analytics.googleAnalytics}');`
  );
  
  // Reemplazar Google Ads (solo si no es null)
  if (config.analytics.googleAds) {
    modifiedContent = modifiedContent.replace(
      /gtag\('config', 'AW-335378785'\);/g,
      `gtag('config', '${config.analytics.googleAds}');`
    );
  } else {
    // Comentar Google Ads si es null
    modifiedContent = modifiedContent.replace(
      /gtag\('config', 'AW-335378785'\);/g,
      `// gtag('config', 'AW-335378785'); // Comentado para ${config.name}`
    );
  }
  
  if (config.analytics.googleAds2) {
    modifiedContent = modifiedContent.replace(
      /gtag\('config', 'AW-16829919003'\);/g,
      `gtag('config', '${config.analytics.googleAds2}');`
    );
  } else {
    // Comentar Google Ads 2 si es null
    modifiedContent = modifiedContent.replace(
      /gtag\('config', 'AW-16829919003'\);/g,
      `// gtag('config', 'AW-16829919003'); // Comentado para ${config.name}`
    );
  }
  
  // Reemplazar conversión (solo si no es null)
  if (config.analytics.conversion) {
    modifiedContent = modifiedContent.replace(
      /'send_to': 'AW-335378785\/wcKYCMDpnJIZEOHy9Z8B'/g,
      `'send_to': '${config.analytics.conversion}'`
    );
  } else {
    // Comentar conversión si es null
    modifiedContent = modifiedContent.replace(
      /'send_to': 'AW-335378785\/wcKYCMDpnJIZEOHy9Z8B'/g,
      `// 'send_to': 'AW-335378785/wcKYCMDpnJIZEOHy9Z8B' // Comentado para ${config.name}`
    );
  }
  
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
  salud-gpt - SALUD-GPT

Opciones:
  --dry-run    Solo muestra qué cambios se harían
  --help, -h   Muestra esta ayuda

Ejemplos:
  node scripts/configure-index-html.js dxgpt --dry-run
  node scripts/configure-index-html.js salud-gpt
  `);
  process.exit(0);
}

configureIndexHtml(tenant, dryRun); 