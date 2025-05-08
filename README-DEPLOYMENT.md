# Guía de despliegue multisitio para DxGPT

Este documento explica cómo funciona y cómo utilizar el sistema de despliegue multisitio que permite personalizar DxGPT para diferentes servicios de salud manteniendo un único código base.

## Arquitectura

### Frontend (Cliente)
- **Código base único**: Un solo repositorio que genera múltiples builds
- **Despliegue**: Azure Static Web Apps o CDN para servir la SPA de Angular
- **Configuración por tenant**: Archivos JSON que personalizan cada despliegue

### Backend (Servidor)
- **Opción 1 - Backend compartido**: Todos los tenants usan la misma API (https://dxgpt.app)
- **Opción 2 - Backends dedicados**: Cada tenant tiene su propio backend containerizado

![Arquitectura](https://via.placeholder.com/800x400.png?text=Arquitectura+Multi-Tenant+DxGPT)

## Estructura de archivos

1. **Configuraciones de despliegue**: Cada servicio de salud tiene un archivo de configuración JSON en `src/assets/jsons/deployments/`
2. **Angular configurations**: El archivo `angular.json` contiene configuraciones específicas para cada despliegue
3. **Componente de logo**: `DeploymentLogoComponent` muestra dinámicamente el logo y nombre del despliegue
4. **Servicio de configuración**: `DeploymentConfigService` gestiona la carga y aplicación de la configuración

## Crear un nuevo despliegue

### 1. Frontend (Cliente Angular)

#### 1.1 Crear archivo de configuración
Añade un nuevo archivo JSON en `src/assets/jsons/deployments/[cliente].json`:

```json
{
  "deploymentId": "[cliente]",
  "name": "Nombre del cliente",
  "logo": "assets/img/clients/[cliente]-logo.png",
  "favicon": "assets/img/clients/[cliente]-favicon.ico",
  "theme": {
    "primaryColor": "#HEXCOLOR",
    "secondaryColor": "#HEXCOLOR",
    "backgroundColor": "#HEXCOLOR",
    "textColor": "#HEXCOLOR"
  },
  "footer": "© 2023 [Cliente] - Powered by DxGPT",
  "api": {
    "baseUrl": "https://[cliente]-api.azurecontainerapps.io",
    "features": {
      "anonymize": true,
      "diagnose": true,
      "summarize": true
    },
    "rateLimit": {
      "requestsPerMinute": 60,
      "tokensPerDay": 100000
    }
  },
  "deployment": {
    "type": "dedicated",
    "region": "westeurope"
  }
}
```

#### 1.2 Añadir recursos gráficos
- Añade el logo en `src/assets/img/clients/[cliente]-logo.png`
- Añade el favicon en `src/assets/img/clients/[cliente]-favicon.ico`

#### 1.3 Añadir configuración a Angular
Edita `angular.json` para añadir la nueva configuración:

```json
"[cliente]": {
  "budgets": [...],
  "optimization": true,
  "outputHashing": "all",
  "sourceMap": true,
  "namedChunks": false,
  "extractLicenses": true,
  "vendorChunk": false,
  "buildOptimizer": true,
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    },
    {
      "replace": "src/assets/jsons/deployment-config.json",
      "with": "src/assets/jsons/deployments/[cliente].json"
    }
  ]
}
```

#### 1.4 Añadir script de build
Edita `package.json` para añadir un nuevo comando:

```json
"build[Cliente]": "ng build --configuration [cliente]"
```

### 2. Backend (Servidor API - Opcional)

Si el cliente necesita un backend dedicado:

#### 2.1 Crear Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]
```

#### 2.2 Desplegar en Azure Container Apps
```bash
# Crear registro de contenedores
az acr create --resource-group myResourceGroup --name myacr --sku Basic

# Crear imagen y subirla
az acr build --registry myacr --image dxgpt-api:[cliente] .

# Crear Azure Container App
az containerapp create \
  --name [cliente]-api \
  --resource-group myResourceGroup \
  --environment myEnvironment \
  --registry-server myacr.azurecr.io \
  --image myacr.azurecr.io/dxgpt-api:[cliente] \
  --target-port 8080 \
  --ingress external \
  --query properties.configuration.ingress.fqdn
```

## Uso del componente de logo

```html
<app-deployment-logo [showName]="true" size="medium"></app-deployment-logo>
```

Propiedades:
- `showName`: booleano que controla si se muestra el nombre junto al logo
- `size`: tamaño del logo ('small', 'medium', 'large')

## Compilar y desplegar el frontend

### Compilación
```bash
npm run buildSermas    # Para SERMAS
npm run buildIaSalut   # Para IA Salut
npm run buildHmGpt     # Para HM GPT
npm run buildAragon    # Para Aragón
```

### Despliegue en Azure Static Web Apps

```bash
# Instalar CLI
npm install -g @azure/static-web-apps-cli

# Desplegar
swa deploy ./dist --env production --deployment-token $DEPLOYMENT_TOKEN --app-name [cliente]-dxgpt
```

## Acceso a la configuración en código

Puedes acceder a la configuración del despliegue en cualquier componente:

```typescript
import { DeploymentConfigService } from 'app/shared/services/deployment-config.service';

constructor(private deploymentConfig: DeploymentConfigService) { }

ngOnInit() {
  // Obtener el nombre del despliegue
  const nombre = this.deploymentConfig.getName();
  
  // Obtener la URL de la API
  const apiUrl = this.deploymentConfig.getApiBaseUrl();
  
  // Suscribirse a cambios en la configuración
  this.deploymentConfig.config$.subscribe(config => {
    // Usar config
  });
}
```

## Consideraciones de mantenimiento

### Flujo de trabajo recomendado:
1. Desarrollo en ramas de características
2. Integración en rama principal
3. Build y despliegue automatizado con CI/CD para todos los tenants
4. Pruebas específicas por tenant

### CI/CD con GitHub Actions
Ejemplo de workflow para Azure Static Web Apps:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        tenant: [sermas, iasalut, hmgpt, aragon]
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v1
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
      
    - name: Build for ${{ matrix.tenant }}
      run: npm run build${{ matrix.tenant }}
      
    - name: Deploy to Azure Static Web Apps
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_${{ matrix.tenant }} }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        app_location: "dist"
        skip_app_build: true
```

## Próximos pasos

1. **Azure Container Apps o AKS para microservicios**:
   - Crear arquitectura de microservicios para el backend
   - Containerizar cada componente
   - Implementar escalado automático

2. **Frontend en Azure Static Web Apps**:
   - Configurar CI/CD para cada tenant
   - Implementar pruebas E2E específicas por tenant
   - Configurar dominios personalizados

3. **Integración con Azure API Management**:
   - Centralizar gestión de APIs
   - Implementar limits y throttling
   - Monitorización y analytics

4. **Marketplace de Azure**:
   - Preparar oferta para Azure Marketplace
   - Implementar sistema de suscripciones por SaaS
   - Integrar con sistemas de facturación 