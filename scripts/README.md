
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
node scripts/prepare-tenant-release.js SALUD-GPT
node scripts/prepare-tenant-release.js SermasGPT
node scripts/prepare-tenant-release.js OTRO-TENANT
node scripts/prepare-tenant-release.js IASalutAjudaDx
node scripts/prepare-tenant-release.js dxeugpt (no hace falta, es mmismos literales que DxGPT)
```
- Ejecuta la configuración de index.html y el reemplazo de branding para el tenant indicado.
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
done scripts/restore-backup.js
```
- Detecta el backup más reciente de cada archivo y lo restaura.
- Crea backup del archivo actual antes de restaurar.
- Modo dry-run para revisar antes de restaurar.

---

## 🚦 Flujo recomendado para lanzar cambios de branding multi-tenant

1. **Crear una rama específica** para el cambio (ej: `feature/tenant-nueva-funcionalidad`)
2. **Ejecutar el script de preparación** para el tenant:
   ```bash
   node scripts/prepare-tenant-release.js SALUD-GPT
   # o para otro tenant
   node scripts/prepare-tenant-release.js OTRO-TENANT
   ```
3. **Revisar los cambios** (`git diff` o en tu editor)
4. **Hacer commit** de los archivos modificados
5. **Lanzar el pipeline dedicado al tenant**
6. **Restaurar a como estaba** node scripts/restore-dxgpt-branding.js
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
Esto restaurará el index.html y los archivos de traducción desde los backups más recientes.

---

## Recomendaciones
- Usa siempre los scripts genéricos para mantener el flujo multi-tenant limpio y seguro.
- Haz backups antes de aplicar cambios masivos.
- Si tienes dudas, usa el modo `--dry-run` para revisar antes de modificar archivos.
- Mantén la carpeta de backups limpia periódicamente si ya no necesitas restaurar.

--- 

en resumen para actualizar un tenant existente con los ultimos cambios de dxgpt:
1. crear rama
2. ejecutar node scripts/prepare-tenant-release.js SALUD-GPT (nombre tenant)
3. restaurar node scripts/restore-dxgpt-branding.js
4. cerrar rama si se desea

si es un nuevo tenant:
1. crear los environments necesarios
2. añadir el tenant a configure-index-html para adaptar el html (analitycs, etc)
3. establecer la configuracion en branding-config (para la UI)
4. poner el favicon en assets y los environments del tenant en angular.json, y poner en el package.json como se lanzar esos envs de angular.json
5. crear el swa y coger el token para ponerlo en los environments
6. enlazar con el apim de dev y prod y coger los keys de los subcription que crea para ponerlo en los environments
7. permitir la nueva url en los apim de dev y prod
8. crear pipes en devops (prod y dev)
9. Crear en la bbdd de prod y test en la coleccion clientconfigs los valores por si quieren guardar resultados y uso en bbdd
10. Hacer los 4 pasos de tenant existente

---

## 🏥 Modelo Self-Hosted (para hospitales)

Cuando una empresa va a hacer el deploy del SWA en el tenant de Azure del hospital y el backend está en un container del hospital:

### Configuración necesaria en el cliente:

1. **Crear/actualizar el environment del tenant** con la URL absoluta del backend:
   ```typescript
   // environment.tenant-name.prod.ts
   export const environment = {
     production: true,
     api: 'https://api-del-hospital.ejemplo.com/api', // URL absoluta del container
     INSTRUMENTATION_KEY: '...', // Si el hospital quiere analytics
     apiSubscriptionKey: '', // Vacío si no usan APIM, o key del APIM del hospital si lo usan
     tenantId: 'tenant-name-prod'
   };
   ```

2. **Configurar en branding-config.json**:
   ```json
   "tenant-name": {
     "name": "TENANT-NAME",
     "displayName": "Nombre del Tenant",
     "IS_SELF_HOSTED": true,  // ← IMPORTANTE: marcar como self-hosted
     // ... resto de configuración
   }
   ```

3. **AuthInterceptor ya está configurado** para:
   - No enviar `Ocp-Apim-Subscription-Key` si `apiSubscriptionKey` está vacío/undefined
   - Siempre enviar `X-Tenant-Id` (necesario para el backend)

4. **Build del cliente**:
   ```bash
   npm run build:tenant-name
   ```
   Esto generará los archivos estáticos que la empresa desplegará en el SWA del hospital.

### Consideraciones importantes:

- **URL del API**: Debe ser una URL absoluta (no relativa `/api`) que apunte directamente al container del backend del hospital
- **APIM**: Si el hospital tiene su propio APIM, puedes configurar `useApim: true` y poner la subscription key correspondiente
- **CORS**: El backend del hospital debe permitir las peticiones desde el dominio del SWA
- **Autenticación**: El backend debe manejar la autenticación (Azure AD del hospital, etc.)
- **Tenant ID**: El `tenantId` en el environment debe coincidir con el que espera el backend

### Checklist para self-hosted:

- [ ] 1. Crear/actualizar environment con URL absoluta del backend del hospital
- [ ] 2. Marcar `IS_SELF_HOSTED: true` en branding-config.json
- [ ] 3. Dejar `apiSubscriptionKey` vacío si no usan APIM, o poner la key si el hospital tiene su propio APIM
- [ ] 4. Build del cliente: `npm run build:tenant-name`
- [ ] 5. Entregar los archivos de build (carpeta `dist/`) a la empresa que hará el deploy
- [ ] 6. La empresa desplegará el SWA en el tenant de Azure del hospital
- [ ] 7. Verificar que el SWA puede conectarse al container del backend (CORS configurado)
- [ ] 8. Verificar que el backend acepta el `X-Tenant-Id` header con el valor correcto