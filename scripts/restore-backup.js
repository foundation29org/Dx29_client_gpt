#!/usr/bin/env node

/**
 * Script para restaurar archivos de traducción desde backups
 * 
 * Uso: node scripts/restore-backup.js [--dry-run]
 * 
 * Opciones:
 *   --dry-run    Solo muestra qué archivos se restaurarían, sin modificar
 * 
 * Ejemplo: node scripts/restore-backup.js --dry-run
 */

const fs = require('fs');
const path = require('path');

// Configuración
const TRANSLATION_DIR = 'src/assets/i18n';
const BACKUP_DIR = 'src/assets/i18n-backups';
const TRANSLATION_FILES = ['en.json', 'es.json', 'fr.json', 'de.json', 'pl.json', 'ru.json', 'uk.json'];

// Función para encontrar el backup más reciente de un archivo
function findLatestBackup(fileName) {
    // Verificar que existe la carpeta de backups
    if (!fs.existsSync(BACKUP_DIR)) {
        console.log(`   ❌ Carpeta de backups no encontrada: ${BACKUP_DIR}`);
        return null;
    }
    
    const files = fs.readdirSync(BACKUP_DIR);
    console.log(`   🔍 Buscando backups para ${fileName} en ${BACKUP_DIR}...`);
    console.log(`   📂 Archivos encontrados: ${files.filter(f => f.includes(fileName)).join(', ')}`);
    
    const backupFiles = files.filter(file => 
        file.startsWith(fileName + '.backup.')
    );
    
    if (backupFiles.length === 0) {
        return null;
    }
    
    // Ordenar por timestamp (el más reciente primero)
    backupFiles.sort((a, b) => {
        const partsA = a.split('.');
        const partsB = b.split('.');
        const timestampA = parseInt(partsA[partsA.length - 1]);
        const timestampB = parseInt(partsB[partsB.length - 1]);
        return timestampB - timestampA;
    });
    
    return backupFiles[0];
}

// Función para restaurar un archivo desde su backup
function restoreFile(fileName, options = {}) {
    const { dryRun = false } = options;
    
    try {
        console.log(`\n📁 Procesando: ${fileName}`);
        
        const backupFile = findLatestBackup(fileName);
        
        if (!backupFile) {
            console.log(`   ❌ No se encontró backup para ${fileName}`);
            return { restored: false, error: 'No backup found' };
        }
        
        const originalPath = path.join(TRANSLATION_DIR, fileName);
        const backupPath = path.join(BACKUP_DIR, backupFile);
        
        console.log(`   📋 Backup encontrado: ${backupFile}`);
        
        if (dryRun) {
            console.log(`   🔄 Restauración propuesta:`);
            console.log(`      Restaurar: ${backupPath} → ${originalPath}`);
            return { restored: true, backupFile };
        }
        
        // Crear backup del archivo actual antes de restaurar
        const currentBackupPath = path.join(BACKUP_DIR, `${fileName}.before-restore.${Date.now()}`);
        if (fs.existsSync(originalPath)) {
            fs.copyFileSync(originalPath, currentBackupPath);
            console.log(`   💾 Backup del archivo actual: ${path.basename(currentBackupPath)}`);
        }
        
        // Restaurar desde el backup
        fs.copyFileSync(backupPath, originalPath);
        console.log(`   ✅ Archivo restaurado exitosamente`);
        
        return { restored: true, backupFile };
        
    } catch (error) {
        console.error(`   ❌ Error restaurando ${fileName}:`, error.message);
        return { restored: false, error: error.message };
    }
}

// Función principal
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    
    console.log('🔄 Script de restauración de archivos de traducción');
    console.log('=' .repeat(60));
    
    if (dryRun) {
        console.log('🔍 MODO DRY-RUN: Solo mostrando restauraciones propuestas');
    }
    
    let totalFiles = 0;
    let restoredFiles = 0;
    let errors = 0;
    
    // Restaurar cada archivo de traducción
    TRANSLATION_FILES.forEach(fileName => {
        const result = restoreFile(fileName, { dryRun });
        
        if (result.restored) {
            totalFiles++;
            restoredFiles++;
        } else if (result.error) {
            errors++;
        }
    });
    
    // Resumen
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`   Archivos procesados: ${totalFiles}`);
    console.log(`   Archivos restaurados: ${restoredFiles}`);
    console.log(`   Errores: ${errors}`);
    
    if (dryRun && restoredFiles > 0) {
        console.log('\n💡 Para aplicar las restauraciones, ejecuta:');
        console.log('   node scripts/restore-backup.js');
    }
    
    if (restoredFiles === 0 && errors === 0) {
        console.log('\n✅ No se encontraron backups para restaurar');
    }
    
    console.log('\n🎯 ¡Proceso completado!');
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = { restoreFile, findLatestBackup }; 