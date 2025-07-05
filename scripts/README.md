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

---

## 🚦 Flujo recomendado para lanzar cambios a SALUD-GPT

### 1. Crear una rama específica
Por ejemplo:
- Para desarrollo: `feature/salud-gpt-nueva-funcionalidad`
- Para producción: `release/salud-gpt-vX.Y.Z`

### 2. Ejecutar los scripts de configuración
Configura el branding y el index.html para SALUD-GPT:

```bash
# Configurar index.html para SALUD-GPT
node scripts/configure-index-html.js salud-gpt

# Reemplazar branding en traducciones (con backup recomendado)
node scripts/replace-dxgpt-for-salud-gpt.js --backup
```
Puedes usar `--dry-run` primero para revisar los cambios antes de aplicarlos.

### 3. Hacer commit de los cambios
Incluye los archivos modificados (`index.html`, traducciones, etc.):
```bash
git add src/index.html src/assets/i18n/*.json
# ...otros archivos modificados

git commit -m "chore(salud-gpt): branding y traducciones actualizados para SALUD-GPT"
```

### 4. Lanzar el pipeline dedicado a SALUD-GPT
- Selecciona la rama que acabas de preparar.
- El pipeline debe estar configurado para:
  - Usar los environments de SALUD-GPT (`environment.salud-gpt.ts`, etc.)
  - Hacer el build con la configuración de SALUD-GPT (`ng build --configuration=salud-gpt-prod`)
  - Deploy al SWA de SALUD-GPT

### 5. (Opcional) Borrar la rama después del deploy
Así evitas confusiones y dejas el repo limpio:
```bash
git checkout develop # o main
# ...verifica que todo está bien

git branch -d feature/salud-gpt-nueva-funcionalidad
```

### 🟢 Ventajas de este flujo
- Separación total de branding/configuración
- No contaminas el branding de DxGPT
- Puedes revisar los cambios antes de lanzar
- Tienes backups automáticos de traducciones e index.html
- El pipeline solo deploya lo que corresponde a cada tenant

### 📝 Resumen visual

1. Crear rama específica para SALUD-GPT
2. Ejecutar scripts de configuración y reemplazo
3. Commit y push de los cambios
4. Lanzar pipeline dedicado a SALUD-GPT
5. (Opcional) Borrar la rama tras el deploy 

---

## ✅ Checklist para lanzar cambios a SALUD-GPT

- [ ] 1. Crear rama específica para el cambio
- [ ] 2. Ejecutar scripts de configuración:
    - [ ] `node scripts/configure-index-html.js salud-gpt`
    - [ ] `node scripts/replace-dxgpt-for-salud-gpt.js --backup`
- [ ] 3. Revisar los cambios (`git diff` o en tu editor)
- [ ] 4. Hacer commit de los archivos modificados
- [ ] 5. Lanzar el pipeline dedicado a SALUD-GPT
- [ ] 6. (Opcional) Borrar la rama tras el deploy

---

## 🤖 Automatización del flujo

Puedes crear un script para automatizar los pasos 2 y 3. Ejemplo:

```js
// scripts/prepare-salud-gpt-release.js
const { execSync } = require('child_process');

console.log('Configurando index.html para SALUD-GPT...');
execSync('node scripts/configure-index-html.js salud-gpt', { stdio: 'inherit' });

console.log('Reemplazando branding en traducciones...');
execSync('node scripts/replace-dxgpt-for-salud-gpt.js --backup', { stdio: 'inherit' });

console.log('Mostrando cambios realizados:');
execSync('git status', { stdio: 'inherit' });
execSync('git diff', { stdio: 'inherit' });

console.log('\n✅ Listo. Revisa los cambios y haz commit.');
```

Y luego ejecutas:
```bash
node scripts/prepare-salud-gpt-release.js
```

Esto te ahorra pasos manuales y asegura que no se te olvida nada importante.

--- 

---

## 🚀 Scripts de automatización multi-tenant

### replace-dxgpt-for-tenant.js

Script genérico para reemplazar automáticamente "DxGPT" por el nombre del tenant que indiques en los archivos de traducción.

#### Uso:
```bash
node scripts/replace-dxgpt-for-tenant.js SALUD-GPT --backup
node scripts/replace-dxgpt-for-tenant.js OTRO-TENANT --dry-run
```
- El primer argumento es el nombre del tenant que quieres usar como branding.
- Puedes usar `--backup` para crear backups antes de modificar, y `--dry-run` para solo mostrar los cambios.

---

### prepare-tenant-release.js

Script genérico para preparar el branding y el index.html de cualquier tenant.

#### Uso:
```bash
node scripts/prepare-tenant-release.js SALUD-GPT
node scripts/prepare-tenant-release.js OTRO-TENANT
```
- Ejecuta la configuración de index.html y el reemplazo de branding para el tenant indicado.
- Muestra el estado de los cambios (`git status` y `git diff`).
- Te deja todo listo para commit.

#### ¿Cómo funciona?
- Llama a `configure-index-html.js` con el tenant indicado.
- Llama a `replace-dxgpt-for-tenant.js` con el tenant indicado.
- Puedes usarlo para cualquier tenant presente en tu configuración.

---

### restore-dxgpt-branding.js

Script para restaurar el branding y el index.html a DxGPT tras lanzar un release de otro tenant.

#### Uso:
```bash
node scripts/restore-dxgpt-branding.js
```
- Ejecuta la configuración de index.html para DxGPT.
- (Opcional) Puedes descomentar la línea para restaurar traducciones desde backup si lo necesitas.
- Muestra el estado de los cambios para commit.

---

### Recomendaciones
- Usa `prepare-tenant-release.js` antes de lanzar un release de cualquier tenant.
- Usa `restore-dxgpt-branding.js` para dejar el repo listo para seguir trabajando con DxGPT o para restaurar el estado base.
- Extiende estos scripts para otros tenants añadiendo lógica similar si necesitas personalizaciones.

--- 