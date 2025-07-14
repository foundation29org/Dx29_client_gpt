# Integración de DxGPT/SALUD-GPT en iframe

Esta funcionalidad permite integrar DxGPT en aplicaciones externas mediante iframes, pasando parámetros específicos para hospitales y tenants como Aragón.

## 🎯 Casos de uso

### 1. Integración directa (sin iframe)
Para sistemas con URL propia o subdominio independiente:
```
https://sermas.azurewebsites.net/?centro=Hospital_X&ambito=urgencias&especialidad=cardiologia
```

### 2. Integración en iframe
Para portales sanitarios que quieren embeber DxGPT en su interfaz:
```html
<iframe src="https://dxgpt.app/?centro=Hospital_X&ambito=urgencias"></iframe>
```

### Parámetros disponibles para ambos casos:
- **Centro**: Identificador del hospital o centro sanitario
- **Ámbito**: `atencion_primaria`, `atencion_especializada`, `urgencias`, `hospitalizacion`
- **Especialidad**: `medicina_interna`, `cardiologia`, `neurologia`, `pediatria`, etc.
- **Texto médico**: Descripción médica pre-cargada

## 📋 Parámetros soportados

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `medicalText` | Descripción médica pre-cargada | "Paciente con dolor torácico..." |
| `centro` | Centro hospitalario/sanitario | "Hospital_de_Barbastro" |
| `ambito` | Ámbito sanitario | "atencion_primaria" |
| `especialidad` | Especialidad médica | "cardiologia" |

## 🚀 Métodos de integración

### Método 1: URL directa (sin iframe)

```html
<!-- Navegación directa con parámetros -->
https://dxgpt.app/?centro=Hospital_X&ambito=urgencias&especialidad=cardiologia&medicalText=Paciente con dolor torácico

<!-- También funciona con fragments -->
https://dxgpt.app/#centro=Hospital_X&ambito=urgencias&especialidad=cardiologia&medicalText=Paciente con dolor torácico
```

### Método 2: Iframe con parámetros en URL

```html
<iframe src="https://dxgpt.app/?ambito=urgencias&especialidad=cardiologia&medicalText=Paciente con dolor torácico"></iframe>
```

### Método 3: PostMessage (recomendado para iframe)

```html
<iframe id="dxgpt-frame" src="https://dxgpt.app/"></iframe>

<script>
// Esperar a que DxGPT esté listo
window.addEventListener('message', function(event) {
    if (event.data.type === 'dxgpt-ready') {
        // Enviar parámetros
        document.getElementById('dxgpt-frame').contentWindow.postMessage({
            type: 'dxgpt-params',
            params: {
                centro: 'Hospital_Miguel_Servet',
                ambito: 'atencion_primaria',
                especialidad: 'medicina_interna',
                medicalText: 'Descripción del caso clínico'
            }
        }, '*');
    }
});
</script>
```

### Método 4: PostMessage directo

```javascript
// También acepta mensajes directos con parámetros conocidos
iframe.contentWindow.postMessage({
    centro: 'Hospital_Miguel_Servet',
    medicalText: 'Paciente de 45 años con fiebre'
}, '*');
```

## 🔧 Implementación técnica

### Detección automática de iframe

La aplicación detecta automáticamente si está ejecutándose dentro de un iframe:

```typescript
// En iframe-params.service.ts
private detectIframe(): void {
    try {
        this.isInIframe = window.self !== window.top;
    } catch (e) {
        this.isInIframe = true;
    }
}
```

### Captura de parámetros

Los parámetros se capturan automáticamente de **todas las fuentes posibles**:

1. **Query parameters** de la URL (`?param=value`) - Para navegación directa e iframe
2. **Fragment parameters** (`#param=value`) - Para navegación directa e iframe  
3. **PostMessage** del iframe padre - Solo para iframe
4. **Route parameters** de Angular - Para navegación directa

**El mismo código funciona para ambos casos de uso** - no hay diferencia en la implementación.

### Eventos de Analytics

Se envían eventos específicos a Google Analytics:

- `Parameters received` - Cuando se reciben parámetros
- `Hospital center parameter: [centro]` - Centro hospitalario
- `Medical parameters: [json]` - Parámetros médicos (ámbito y especialidad)
- `Iframe execution` - Ejecución en iframe

### Envío al backend

Los parámetros se envían como un objeto `iframeParams` al backend, quien se encarga de validar y procesar qué parámetros específicos están presentes:

```typescript
const value = {
    description: this.medicalTextEng,
    // ... otros parámetros
    isInIframe: this.isInIframe,
    // Todos los parámetros del iframe para que el backend los procese
    iframeParams: this.iframeParams
    // Ejemplo de iframeParams:
    // {
    //   centro: "Hospital_Clinico_Zaragoza",
    //   ambito: "urgencias", 
    //   especialidad: "cardiologia",
    //   medicalText: "Paciente con dolor torácico..."
    // }
};
```

**Ventajas de este enfoque:**
- ✅ **Escalable**: Añadir nuevos parámetros no requiere cambios en el frontend
- ✅ **Mantenible**: La lógica de validación está centralizada en el backend  
- ✅ **Flexible**: El backend puede procesar cualquier combinación de parámetros
- ✅ **Futuro-proof**: Fácil extensión para nuevos casos de uso

## 📊 Ejemplos específicos

### Ejemplo URL directa - SermasGPT

```html
<!-- URL directa con subdominio propio -->
https://sermas.azurewebsites.net/?centro=Hospital_Clinico_Zaragoza&ambito=urgencias&especialidad=cardiologia&medicalText=Paciente de 65 años con dolor torácico opresivo de 2 horas de evolución
```

### Ejemplo Iframe - Portal Sanitario (ej: Aragón)

```html
<!-- Iframe embebido en portal sanitario -->
<iframe 
    src="https://dxgpt.app/?centro=Hospital_Infantil_Miguel_Servet&ambito=atencion_especializada&especialidad=pediatria"
    width="100%" 
    height="800px">
</iframe>

<!-- O con postMessage dinámico -->
<iframe id="aragon-frame" src="https://dxgpt.app/"></iframe>

<script>
window.addEventListener('message', function(event) {
    if (event.data.type === 'dxgpt-ready') {
        document.getElementById('aragon-frame').contentWindow.postMessage({
            type: 'dxgpt-params',
            params: {
                centro: 'Hospital_Infantil_Miguel_Servet',
                ambito: 'atencion_especializada',
                especialidad: 'pediatria',
                medicalText: 'Niño de 8 años con fiebre de 39°C y dolor de garganta'
            }
        }, '*');
    }
});
</script>
```

## 🔐 Consideraciones de seguridad

1. **Validación de origen**: En producción, considerar validar el origen de los mensajes postMessage
2. **Sanitización**: Los parámetros se validan y sanitizan antes del envío al backend
3. **HTTPS**: Siempre usar conexiones seguras en producción

## 🧪 Testing

Usar el archivo `examples/url-vs-iframe.html` incluido para probar la integración:

1. Abrir `examples/url-vs-iframe.html` en un navegador
2. Comparar ambos métodos (URL directa vs iframe)
3. Probar diferentes métodos de envío de parámetros
4. Verificar en la consola del navegador que se reciben correctamente

## 📱 Responsividad

El iframe se adapta automáticamente al contenedor padre. Recomendaciones:

```css
.iframe-container {
    width: 100%;
    height: 800px; /* Altura mínima recomendada */
    border: none;
    border-radius: 8px;
}

@media (max-width: 768px) {
    .iframe-container {
        height: 600px;
    }
}
```

## 🐛 Troubleshooting

### Los parámetros no se reciben

1. Verificar que el iframe esté completamente cargado
2. Comprobar la consola del navegador para errores
3. Asegurar que el formato del mensaje postMessage sea correcto

### La aplicación no detecta el iframe

1. Verificar las políticas de seguridad del navegador
2. Comprobar que no hay conflictos de dominio
3. Revisar la configuración X-Frame-Options del servidor

### Problemas de Analytics

1. Verificar que Google Analytics esté configurado
2. Comprobar que los eventos se envían en la consola de desarrollador
3. Revisar los filtros de Analytics si no aparecen eventos

## 🌐 Comparación: URL directa vs Iframe

| Aspecto | URL directa | Iframe |
|---------|-------------|--------|
| **Implementación** | `window.location = 'https://dxgpt.app/?params'` | `<iframe src="https://dxgpt.app/?params">` |
| **Parámetros** | Query/Fragment en URL | Query/Fragment + postMessage |
| **Integración** | Navegación completa de página | Embebido en interfaz existente |
| **Casos de uso** | URLs propias, subdominios independientes | Portales sanitarios integrados |
| **Ejemplo** | SermasGPT (sermas.azurewebsites.net) | Aragón (iframe en portal), EMR integrations |

## 📞 Soporte

Para soporte técnico o consultas sobre la integración, contactar con el equipo de desarrollo de DxGPT. 