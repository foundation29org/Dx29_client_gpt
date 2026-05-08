#!/usr/bin/env node

/**
 * Script para reemplazar "DxGPT" por el nombre del tenant en archivos de traducción
 * 
 * Uso: node scripts/replace-dxgpt-for-tenant.js <TENANT_NAME> [--dry-run] [--backup]
 * 
 * Ejemplo: node scripts/replace-dxgpt-for-tenant.js SALUD-GPT --backup
 */

const fs = require('fs');
const path = require('path');

// Configuración
const TRANSLATION_DIR = 'src/assets/i18n';
const BACKUP_DIR = 'src/assets/i18n-backups';
const TRANSLATION_FILES = ['en.json', 'es.json', 'fr.json', 'de.json', 'pl.json', 'ru.json', 'uk.json', 'ca.json', 'pt.json'];

// Patrones que NO debemos reemplazar
const EXCLUDE_PATTERNS = [
    /"([^\"]*https?:\/\/[^\"]*DxGPT[^\"]*)"/g,  // URLs
    /"([^\"]*dxgpt\.app[^\"]*)"/g,             // Dominios específicos
    /"([^\"]*DxGPT-bench[^\"]*)"/g,            // Nombres técnicos específicos
];

function shouldExclude(text) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(text));
}

function processTranslationFile(filePath, tenantName, options = {}) {
    const { dryRun = false, backup = false } = options;
    try {
        console.log(`\n📁 Procesando: ${path.basename(filePath)}`);
        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️  Archivo no encontrado, saltando...`);
            return { processed: false, changes: 0 };
        }
        let content = fs.readFileSync(filePath, 'utf8');
        let changes = 0;
        // Crear backup si se solicita
        if (backup && !dryRun) {
            if (!fs.existsSync(BACKUP_DIR)) {
                fs.mkdirSync(BACKUP_DIR, { recursive: true });
            }
            const fileName = path.basename(filePath);
            const backupPath = path.join(BACKUP_DIR, `${fileName}.backup.${Date.now()}`);
            fs.writeFileSync(backupPath, content, 'utf8');
            console.log(`   💾 Backup creado: ${path.basename(backupPath)}`);
        }
        // Reemplazar DxGPT por tenantName en valores JSON
        content = content.replace(/: "([^"]*DxGPT[^"]*)"/g, (match, value) => {
            if (shouldExclude(match)) {
                console.log(`   ⚠️  Excluido (patrón especial): ${value.substring(0, 50)}...`);
                return match;
            }
            const newValue = value.replace(/DxGPT/g, tenantName);
            changes++;
            if (dryRun) {
                console.log(`   🔄 Cambio propuesto:`);
                console.log(`      Antes: ${value}`);
                console.log(`      Después: ${newValue}`);
            }
            return `: "${newValue}"`;
        });
        // También reemplazar en valores que contienen HTML
        content = content.replace(/: "<([^>]*DxGPT[^>]*)>/g, (match, value) => {
            if (shouldExclude(match)) {
                return match;
            }
            const newValue = value.replace(/DxGPT/g, tenantName);
            changes++;
            if (dryRun) {
                console.log(`   🔄 Cambio propuesto (HTML):`);
                console.log(`      Antes: ${value}`);
                console.log(`      Después: ${newValue}`);
            }
            return `: "<${newValue}>`;
        });
        if (!dryRun && changes > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`   ✅ ${changes} cambios aplicados`);
        } else if (dryRun && changes > 0) {
            console.log(`   📋 ${changes} cambios propuestos`);
        } else {
            console.log(`   ℹ️  No se encontraron cambios necesarios`);
        }
        return { processed: true, changes };
    } catch (error) {
        console.error(`   ❌ Error procesando ${filePath}:`, error.message);
        return { processed: false, changes: 0, error: error.message };
    }
}

function main() {
    const args = process.argv.slice(2);
    const tenantName = args[0];
    const dryRun = args.includes('--dry-run');
    const backup = args.includes('--backup');
    if (!tenantName) {
        console.error('Uso: node scripts/replace-dxgpt-for-tenant.js <NOMBRE_TENANT> [--backup] [--dry-run]');
        process.exit(1);
    }
    console.log(`🔄 Script de reemplazo de DxGPT por ${tenantName} en archivos de traducción`);
    console.log('=' .repeat(70));
    if (dryRun) {
        console.log('🔍 MODO DRY-RUN: Solo mostrando cambios propuestos');
    }
    if (backup) {
        console.log('💾 Creando backups antes de modificar');
    }
    let totalFiles = 0;
    let totalChanges = 0;
    let errors = 0;
    TRANSLATION_FILES.forEach(fileName => {
        const filePath = path.join(TRANSLATION_DIR, fileName);
        const result = processTranslationFile(filePath, tenantName, { dryRun, backup });
        if (result.processed) {
            totalFiles++;
            totalChanges += result.changes;
        } else if (result.error) {
            errors++;
        }
    });
    console.log('\n' + '=' .repeat(70));
    console.log('📊 RESUMEN:');
    console.log(`   Archivos procesados: ${totalFiles}`);
    console.log(`   Cambios totales: ${totalChanges}`);
    console.log(`   Errores: ${errors}`);
    if (dryRun && totalChanges > 0) {
        console.log('\n💡 Para aplicar los cambios, ejecuta:');
        console.log(`   node scripts/replace-dxgpt-for-tenant.js ${tenantName}`);
        console.log('\n💡 Para crear backups y aplicar cambios:');
        console.log(`   node scripts/replace-dxgpt-for-tenant.js ${tenantName} --backup`);
    }
    if (totalChanges === 0 && errors === 0) {
        console.log('\n✅ No se encontraron cambios necesarios o todos los archivos ya están actualizados');
    }
    console.log('\n🎯 ¡Proceso completado!');
}

if (require.main === module) {
    main();
}

module.exports = { processTranslationFile, shouldExclude }; 