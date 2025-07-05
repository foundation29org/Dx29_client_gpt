#!/usr/bin/env node

/**
 * Script para reemplazar "DxGPT" por "SALUD-GPT" en archivos de traducción
 * 
 * Uso: node scripts/replace-dxgpt-for-salud-gpt.js [--dry-run] [--backup]
 * 
 * Opciones:
 *   --dry-run    Solo muestra qué cambios se harían, sin modificar archivos
 *   --backup     Crea una copia de seguridad antes de modificar
 * 
 * Ejemplo: node scripts/replace-dxgpt-for-salud-gpt.js --dry-run
 */

const fs = require('fs');
const path = require('path');

// Configuración
const TRANSLATION_DIR = 'src/assets/i18n';
const BACKUP_DIR = 'src/assets/i18n-backups';
const TRANSLATION_FILES = ['en.json', 'es.json', 'fr.json', 'de.json', 'pl.json', 'ru.json', 'uk.json'];

// Patrones que NO debemos reemplazar
const EXCLUDE_PATTERNS = [
    /"([^"]*https?:\/\/[^"]*DxGPT[^"]*)"/g,  // URLs
    /"([^"]*dxgpt\.app[^"]*)"/g,             // Dominios específicos
    /"([^"]*"DxGPT"[^"]*)"/g,                // Referencias legales como "DxGPT", "we", "our"
    /"([^"]*DxGPT-bench[^"]*)"/g,            // Nombres técnicos específicos
];

// Función para verificar si un texto debe ser excluido
function shouldExclude(text) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(text));
}

// Función para procesar un archivo de traducción
function processTranslationFile(filePath, options = {}) {
    const { dryRun = false, backup = false } = options;
    
    try {
        console.log(`\n📁 Procesando: ${path.basename(filePath)}`);
        
        if (!fs.existsSync(filePath)) {
            console.log(`   ⚠️  Archivo no encontrado, saltando...`);
            return { processed: false, changes: 0 };
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let changes = 0;
        
        // Crear backup si se solicita
        if (backup && !dryRun) {
            // Asegurar que existe la carpeta de backups
            if (!fs.existsSync(BACKUP_DIR)) {
                fs.mkdirSync(BACKUP_DIR, { recursive: true });
            }
            
            const fileName = path.basename(filePath);
            const backupPath = path.join(BACKUP_DIR, `${fileName}.backup.${Date.now()}`);
            fs.writeFileSync(backupPath, content, 'utf8');
            console.log(`   💾 Backup creado: ${path.basename(backupPath)}`);
        }
        
        // Reemplazar DxGPT por SALUD-GPT en valores JSON
        // Usar una expresión regular que capture el patrón ": "valor""
        content = content.replace(/: "([^"]*DxGPT[^"]*)"/g, (match, value) => {
            // Verificar si debe ser excluido
            if (shouldExclude(match)) {
                console.log(`   ⚠️  Excluido (patrón especial): ${value.substring(0, 50)}...`);
                return match;
            }
            
            const newValue = value.replace(/DxGPT/g, 'SALUD-GPT');
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
            
            const newValue = value.replace(/DxGPT/g, 'SALUD-GPT');
            changes++;
            
            if (dryRun) {
                console.log(`   🔄 Cambio propuesto (HTML):`);
                console.log(`      Antes: ${value}`);
                console.log(`      Después: ${newValue}`);
            }
            
            return `: "<${newValue}>`;
        });
        
        // Escribir el archivo si no es dry-run
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

// Función principal
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const backup = args.includes('--backup');
    
    console.log('🔄 Script de reemplazo de DxGPT por SALUD-GPT en archivos de traducción');
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
    
    // Procesar cada archivo de traducción
    TRANSLATION_FILES.forEach(fileName => {
        const filePath = path.join(TRANSLATION_DIR, fileName);
        const result = processTranslationFile(filePath, { dryRun, backup });
        
        if (result.processed) {
            totalFiles++;
            totalChanges += result.changes;
        } else if (result.error) {
            errors++;
        }
    });
    
    // Resumen
    console.log('\n' + '=' .repeat(70));
    console.log('📊 RESUMEN:');
    console.log(`   Archivos procesados: ${totalFiles}`);
    console.log(`   Cambios totales: ${totalChanges}`);
    console.log(`   Errores: ${errors}`);
    
    if (dryRun && totalChanges > 0) {
        console.log('\n💡 Para aplicar los cambios, ejecuta:');
        console.log('   node scripts/replace-dxgpt-for-salud-gpt.js');
        console.log('\n💡 Para crear backups y aplicar cambios:');
        console.log('   node scripts/replace-dxgpt-for-salud-gpt.js --backup');
    }
    
    if (totalChanges === 0 && errors === 0) {
        console.log('\n✅ No se encontraron cambios necesarios o todos los archivos ya están actualizados');
    }
    
    console.log('\n🎯 ¡Proceso completado!');
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = { processTranslationFile, shouldExclude }; 