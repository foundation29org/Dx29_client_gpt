
---

# Scripts de Utilidad

## replace-dxgpt-for-tenant.js

Script genérico para reemplazar automáticamente "DxGPT" por el nombre del tenant que indiques en los archivos de traducción.

### Uso
```bash
node scripts/replace-dxgpt-for-tenant.js SALUD-GPT --backup
node scripts/replace-dxgpt-for-tenant.js OTRO-TENANT --dry-run
```
- El primer argumento es el nombre del tenant que quieres usar como branding.
- Puedes usar `--backup` para crear backups antes de modificar, y `--dry-run` para solo mostrar los cambios.

---

## prepare-tenant-release.js

Script genérico para preparar el branding y el index.html de cualquier tenant.

### Uso
```bash
node scripts/prepare-tenant-release.js salud-gpt
node scripts/prepare-tenant-release.js dxeugpt
```
- Ejecuta la configuración de index.html y el reemplazo de branding para el tenant indicado.
- Usa preferiblemente el id del tenant (`salud-gpt`). El script mantiene el alias antiguo `SALUD-GPT`.
- Muestra el estado de los cambios (`git status` y `git diff`).
- Te deja todo listo para commit.

---

## restore-dxgpt-branding.js

Script para restaurar el branding y el index.html a DxGPT tras lanzar un release de otro tenant.

### Uso
```bash
node scripts/restore-dxgpt-branding.js
```
- Ejecuta la configuración de index.html para DxGPT.
- Restaura los archivos de traducción desde los backups más recientes (si existen).
- Muestra el estado de los cambios para commit.

---

## restore-backup.js

Script para restaurar archivos de traducción desde los backups automáticos.

### Uso
```bash
# Simular restauración (recomendado primero)
node scripts/restore-backup.js --dry-run

# Restaurar archivos
node scripts/restore-backup.js
```
- Detecta el backup más reciente de cada archivo y lo restaura.
- Crea backup del archivo actual antes de restaurar.
- Modo dry-run para revisar antes de restaurar.

---

## 🚦 Flujo recomendado para lanzar cambios de branding multi-tenant

1. **Crear una rama específica** para el cambio (ej: `feature/tenant-nueva-funcionalidad`)
2. **Ejecutar el script de preparación** para el tenant:
   ```bash
   node scripts/prepare-tenant-release.js salud-gpt
   # o para otro tenant
   node scripts/prepare-tenant-release.js dxeugpt
   ```
3. **Revisar los cambios** (`git diff` o en tu editor)
4. **Hacer commit** de los archivos modificados
5. **Lanzar el pipeline dedicado al tenant**
6. **Restaurar a como estaba** `node scripts/restore-dxgpt-branding.js`
7. **(Opcional) Borrar la rama tras el deploy**

---

## ✅ Checklist para cambios multi-tenant

- [ ] 1. Crear rama específica para el cambio
- [ ] 2. Ejecutar `node scripts/prepare-tenant-release.js <TENANT>`
- [ ] 3. Revisar los cambios (`git diff` o en tu editor)
- [ ] 4. Hacer commit de los archivos modificados
- [ ] 5. Lanzar el pipeline dedicado al tenant
- [ ] 6. Restaurar a como estaba `node scripts/restore-dxgpt-branding.js`
- [ ] 7. (Opcional) Borrar la rama tras el deploy

---

## 🚨 Restaurar branding de DxGPT

Si necesitas volver al branding original de DxGPT (por ejemplo, tras un release de otro tenant):

```bash
node scripts/restore-dxgpt-branding.js
```
Esto regenerará `index.html` con la configuración actual de DxGPT y restaurará las traducciones desde los backups más recientes.

---

## Recomendaciones
- Usa siempre los scripts genéricos para mantener el flujo multi-tenant limpio y seguro.
- Haz backups antes de aplicar cambios masivos.
- Si tienes dudas, usa el modo `--dry-run` para revisar antes de modificar archivos.
- Mantén la carpeta de backups limpia periódicamente si ya no necesitas restaurar.

--- 

en resumen para actualizar un tenant existente con los ultimos cambios de dxgpt:
1. crear rama
2. ejecutar `node scripts/prepare-tenant-release.js salud-gpt` (id del tenant)
3. restaurar `node scripts/restore-dxgpt-branding.js`
4. cerrar rama si se desea

si es un nuevo tenant:
1. crear los environments necesarios
2. añadir el tenant a configure-index-html para adaptar los meta tags y favicon
3. establecer la configuracion en branding-config (para la UI)
4. poner el favicon en assets y los environments del tenant en angular.json, y poner en el package.json como se lanzar esos envs de angular.json
5. crear el swa y coger el token para ponerlo en los environments
6. enlazar con el apim de dev y prod y coger los keys de los subcription que crea para ponerlo en los environments
7. permitir la nueva url en los apim de dev y prod
8. crear pipes en devops (prod y dev)
9. Crear en la bbdd de prod y test en la coleccion clientconfigs los valores por si quieren guardar resultados y uso en bbdd
10. Hacer los 4 pasos de tenant existente
