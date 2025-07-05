# Scripts de Utilidad

## replace-dxgpt-for-salud-gpt.js

Script para reemplazar automáticamente "DxGPT" por "SALUD-GPT" en los archivos de traducción.

## replace-dxgpt-in-translations.js

Script para reemplazar automáticamente "DxGPT" por "{{TENANT_NAME}}" en los archivos de traducción.

### 🎯 Propósito

Este script permite adaptar los archivos de traducción para el sistema multi-tenant, reemplazando las referencias hardcodeadas de "DxGPT" por placeholders dinámicos que se reemplazan automáticamente según el tenant activo.

### 📋 Características

- ✅ **Seguro**: Solo reemplaza en valores JSON, no en claves
- ✅ **Inteligente**: Excluye URLs, dominios y referencias legales
- ✅ **Controlado**: Modo dry-run para revisar cambios antes de aplicarlos
- ✅ **Backup**: Opción para crear copias de seguridad automáticas en carpeta separada
- ✅ **Multi-idioma**: Procesa todos los archivos de traducción
- ✅ **Organizado**: Backups en `src/assets/i18n-backups/` para fácil limpieza

### 🚀 Uso

#### 1. Modo Dry-Run (Recomendado primero)
```bash
# Para SALUD-GPT
node scripts/replace-dxgpt-for-salud-gpt.js --dry-run

# Para placeholders dinámicos
node scripts/replace-dxgpt-in-translations.js --dry-run
```
Muestra qué cambios se harían sin modificar los archivos.

#### 2. Aplicar cambios
```bash
# Para SALUD-GPT
node scripts/replace-dxgpt-for-salud-gpt.js

# Para placeholders dinámicos
node scripts/replace-dxgpt-in-translations.js
```
Aplica los cambios directamente.

#### 3. Con backup automático
```bash
# Para SALUD-GPT
node scripts/replace-dxgpt-for-salud-gpt.js --backup

# Para placeholders dinámicos
node scripts/replace-dxgpt-in-translations.js --backup
```
Crea una copia de seguridad antes de modificar.

### 📁 Archivos procesados

Los scripts procesan automáticamente:
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`
- `src/assets/i18n/fr.json`
- `src/assets/i18n/de.json`
- `src/assets/i18n/pl.json`
- `src/assets/i18n/ru.json`
- `src/assets/i18n/uk.json`

### 📂 Ubicación de backups

Los backups se guardan en:
- `src/assets/i18n-backups/` (carpeta separada para fácil limpieza)
- Formato: `archivo.json.backup.1234567890`
- Se crean automáticamente antes de cada modificación

### 🛡️ Protecciones

El script NO reemplaza:
- URLs que contengan "DxGPT" (ej: `https://dxgpt.app`)
- Referencias legales (ej: `"DxGPT", "we", "our", "us"`)
- Nombres técnicos específicos (ej: `DxGPT-bench`)
- Claves JSON (solo valores)

### 📊 Ejemplo de salida

```
🔄 Script de reemplazo de DxGPT en archivos de traducción
============================================================
🔍 MODO DRY-RUN: Solo mostrando cambios propuestos

📁 Procesando: en.json
   🔄 Cambio propuesto:
      Antes: About DxGPT
      Después: About {{TENANT_NAME}}
   🔄 Cambio propuesto:
      Antes: DxGPT privacy policy (GDPR compliant)
      Después: {{TENANT_NAME}} privacy policy (GDPR compliant)
   📋 45 cambios propuestos

📁 Procesando: es.json
   📋 42 cambios propuestos

============================================================
📊 RESUMEN:
   Archivos procesados: 2
   Cambios totales: 87
   Errores: 0

💡 Para aplicar los cambios, ejecuta:
   node scripts/replace-dxgpt-in-translations.js

💡 Para crear backups y aplicar cambios:
   node scripts/replace-dxgpt-in-translations.js --backup

🎯 ¡Proceso completado!
```

## restore-backup.js

Script para restaurar archivos de traducción desde los backups automáticos.

### 🚀 Uso

```bash
# Simular restauración (recomendado primero)
node scripts/restore-backup.js --dry-run

# Restaurar archivos
node scripts/restore-backup.js
```

### 📋 Características

- ✅ **Automático**: Detecta el backup más reciente de cada archivo
- ✅ **Seguro**: Crea backup del archivo actual antes de restaurar
- ✅ **Controlado**: Modo dry-run para revisar antes de restaurar
- ✅ **Organizado**: Busca backups en `src/assets/i18n-backups/`

---

### 🔄 Flujo de trabajo recomendado

1. **Hacer commit** del estado actual
2. **Ejecutar dry-run** para revisar cambios
3. **Revisar** los cambios propuestos
4. **Aplicar cambios** con backup
5. **Probar** que todo funciona
6. **Hacer commit** de los cambios

### 🚨 En caso de problemas

Si algo sale mal:
1. **Restaurar automáticamente**:
   ```bash
   node scripts/restore-backup.js
   ```

2. **Restaurar manualmente**: Los archivos de backup están en `src/assets/i18n-backups/` con formato: `archivo.json.backup.1234567890`

3. **Usar Git**: Hacer `git checkout` para volver al estado anterior

4. **Limpiar backups**: Puedes eliminar la carpeta `src/assets/i18n-backups/` sin riesgo

### 🔧 Personalización

Puedes modificar los scripts para:
- Añadir más patrones de exclusión
- Cambiar el directorio de archivos
- Añadir más tipos de archivos
- Modificar el formato de backup
- Cambiar la carpeta de backups (`BACKUP_DIR`)

### 🎯 Casos de uso

#### Para SALUD-GPT:
```bash
node scripts/replace-dxgpt-for-salud-gpt.js --backup
```

#### Para placeholders dinámicos (multi-tenant):
```bash
node scripts/replace-dxgpt-in-translations.js --backup
```

#### Para restaurar:
```bash
node scripts/restore-backup.js
``` 