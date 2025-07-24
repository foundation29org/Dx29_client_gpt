# Guía de Branding Multi-Tenant

# DxGPT (azul)
npm run start:dxgpt

# SALUD-GPT (verde)  
npm run start:salud-gpt

Este documento explica cómo funciona el sistema de branding multi-tenant implementado para DxGPT y SALUD-GPT.

## Arquitectura

```
SWA (dxgpt/salud-gpt) → (X-MS-AUTH-TOKEN + Ocp-Apim-Subscription-Key) → APIM (IP fija: 108.143.55.53) → Container App (solo acepta esa IP)
```

## Configuración de Branding

### Archivo de Configuración

El branding se configura en `src/assets/config/branding-config.json`:

```json
{
  "dxgpt": {
    "name": "DxGPT",
    "displayName": "DxGPT",
    "description": "AI-powered diagnostic assistance",
    "colors": {
      "primary": "#1f232e",
      "secondary": "#764ba2",
      "accent": "#B30000",
      "background": "#ffffff",
      "text": "#333333",
      "sidebar": "man-of-steel"
    },
    "logos": {
      "header": "assets/img/logo-Dx29.webp",
      "footer": "assets/img/Foundation29logo.webp",
      "favicon": "favicon.ico"
    },
    "links": {
      "donate": "https://www.foundation29.org/donate/",
      "foundation": "https://foundation29.org",
      "support": "DxGPT support"
    },
    "tenantId": "dxgpt-prod",
    "apiSubscriptionKey": "9d83f1ddacaa4653b40e1965f0b3c6d8",
    "hotjarSiteId": "3279828",
    "instrumentationKey": "0534798e-09ad-45c9-a864-d0a1654d172e"
  },
  "salud-gpt": {
    "name": "SALUD-GPT",
    "displayName": "SALUD-GPT",
    "description": "Servicio de IA para Aragón de Salud",
    "colors": {
      "primary": "#2E7D32",
      "secondary": "#388E3C",
      "accent": "#4CAF50",
      "background": "#ffffff",
      "text": "#333333",
      "sidebar": "green"
    },
    "logos": {
      "header": "assets/img/salud-gpt-logo.webp",
      "footer": "assets/img/aragon-salud-logo.webp",
      "favicon": "favicon-salud.ico"
    },
    "links": {
      "donate": null,
      "foundation": "https://www.aragon.es/organismos/departamento-de-sanidad",
      "support": "SALUD-GPT support"
    },
    "tenantId": "salud-gpt-prod",
    "apiSubscriptionKey": "9d83f1ddacaa4653b40e1965f0b3c6d8",
    "hotjarSiteId": "3279828",
    "instrumentationKey": "0534798e-09ad-45c9-a864-d0a1654d172e"
  }
}
```

## Detección Automática de Tenant

El sistema detecta automáticamente el tenant usando el siguiente orden de prioridad:

1. **Configuración de entorno**: `environment.tenantId` (método principal)
2. **Subdominio**: `salud-gpt.dxgpt.com` (solo en producción)
3. **Fallback**: `dxgpt`

### Archivos de Environment

- `environment.ts` - DxGPT desarrollo (tenantId: 'dxgpt-local')
- `environment.prod.ts` - DxGPT producción (tenantId: 'dxgpt-prod')
- `environment.salud-gpt.ts` - SALUD-GPT desarrollo (tenantId: 'salud-gpt-local')
- `environment.salud-gpt.prod.ts` - SALUD-GPT producción (tenantId: 'salud-gpt-prod')

## Scripts de Desarrollo

### Desarrollo Local

```bash
# DxGPT (desarrollo)
npm run start:dxgpt

# SALUD-GPT (desarrollo)
npm run start:salud-gpt
```

### Build para Producción

```bash
# DxGPT (producción)
npm run build:dxgpt

# SALUD-GPT (producción)
npm run build:salud-gpt
```

## Servicios Principales

### BrandingService

Maneja la configuración de branding dinámica:

```typescript
// Obtener configuración actual
const config = this.brandingService.getBrandingConfig();

// Obtener valores específicos
const primaryColor = this.brandingService.getPrimaryColor();
const headerLogo = this.brandingService.getHeaderLogo();
const appName = this.brandingService.getAppName();

// Verificar si mostrar enlace de donación
const showDonate = this.brandingService.shouldShowDonateLink();
```

### TenantDetectorService

Detecta automáticamente el tenant:

```typescript
// Detectar tenant actual
const tenant = this.tenantDetector.detectTenant();

// Verificar tipo de tenant
const isSaludGpt = this.tenantDetector.isSaludGpt(tenant);
const isDxgpt = this.tenantDetector.isDxgpt(tenant);

// Obtener tenant desde environment
const envTenant = this.tenantDetector.getCurrentTenantFromEnvironment();
```

## Variables CSS Personalizadas

El sistema aplica automáticamente variables CSS para el branding:

```css
:root {
  --primary-color: #1f232e;
  --secondary-color: #764ba2;
  --accent-color: #B30000;
  --background-color: #ffffff;
  --text-color: #333333;
  --primary-gradient: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
}
```

### Clases Utilitarias

```css
.brand-primary { color: var(--primary-color); }
.brand-primary-bg { background-color: var(--primary-color); }
.brand-gradient { background: var(--primary-gradient); }
.btn-brand-primary { /* Estilos de botón primario */ }
```

## Implementación en Componentes

### Navbar

```html
<!-- Logo dinámico -->
<img [src]="headerLogo" alt="logo">

<!-- Enlace de donación condicional -->
<li *ngIf="shouldShowDonate">
  <a [href]="brandingService.getDonateLink()">Donate</a>
</li>
```

### Footer

```html
<!-- Logo y enlace dinámicos -->
<a [href]="foundationLink">
  <img [src]="footerLogo" alt="Foundation logo">
</a>

<!-- Título de soporte dinámico -->
<h4>{{brandingService.getSupportText()}}</h4>
```

## Agregar un Nuevo Tenant

1. **Crear archivos de environment**:
```typescript
// environment.nuevo-tenant.ts
export const environment = {
  production: false,
  api: 'http://localhost:8443/api',
  tenantId: 'nuevo-tenant-local'
};

// environment.nuevo-tenant.prod.ts
export const environment = {
  production: true,
  api: '/api',
  tenantId: 'nuevo-tenant-prod'
};
```

2. **Agregar configuración** en `branding-config.json`:
```json
"nuevo-tenant": {
  "name": "NUEVO-TENANT",
  "displayName": "Nuevo Tenant",
  "colors": { /* colores personalizados */ },
  "logos": { /* logos personalizados */ },
  "links": { /* enlaces personalizados */ }
}
```

3. **Agregar configuraciones de build** en `angular.json`:
```json
"nuevo-tenant": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.nuevo-tenant.ts"
    }
  ]
}
```

4. **Agregar scripts** en `package.json`:
```json
"start:nuevo-tenant": "ng serve --configuration=nuevo-tenant",
"build:nuevo-tenant": "ng build --configuration=nuevo-tenant-prod"
```

5. **Agregar logos** en `src/assets/img/`:
   - `nuevo-tenant-logo.webp`
   - `nuevo-tenant-footer-logo.webp`
   - `favicon-nuevo-tenant.ico`

## Despliegue

### DxGPT (Producción)
- **Build**: `npm run build:dxgpt`
- **Tenant**: `dxgpt-prod`
- **Configuración**: Por defecto

### SALUD-GPT (Producción)
- **Build**: `npm run build:salud-gpt`
- **Tenant**: `salud-gpt-prod`
- **Configuración**: Verde, logos de Aragón de Salud

### Desarrollo Local
- **DxGPT**: `npm run start:dxgpt`
- **SALUD-GPT**: `npm run start:salud-gpt`

## Consideraciones

1. **Logos**: Asegúrate de que los archivos de logo existan en `src/assets/img/`
2. **Favicon**: Cada tenant puede tener su propio favicon
3. **Colores**: Usa el sistema de variables CSS para consistencia
4. **Enlaces**: Algunos tenants pueden no tener enlace de donación
5. **Configuración**: Los valores de API y analytics pueden ser diferentes por tenant
6. **Environment**: El tenant se detecta principalmente desde `environment.tenantId`

## Troubleshooting

### El branding no se aplica
1. Verifica que el archivo `branding-config.json` existe
2. Comprueba que el `environment.tenantId` está configurado correctamente
3. Revisa la consola del navegador para errores

### Los logos no se cargan
1. Verifica que los archivos de imagen existen en `src/assets/img/`
2. Comprueba las rutas en la configuración JSON
3. Asegúrate de que los archivos están incluidos en el build

### Los colores no se aplican
1. Verifica que `branding-variables.css` está incluido en `angular.json`
2. Comprueba que las variables CSS se aplican correctamente
3. Revisa si hay conflictos con otros estilos

### El tenant no se detecta correctamente
1. Verifica que el `environment.tenantId` contiene el identificador correcto
2. Comprueba que estás usando la configuración de build correcta
3. Revisa que el archivo de environment se está reemplazando correctamente 