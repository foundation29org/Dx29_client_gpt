# Plan de mejora de rendimiento móvil — dxgpt.app

**Estado actual (Lighthouse):** Desktop 74 / Móvil 51.
**Problema principal en móvil:** TBT 3.260 ms y LCP 4,4 s. El cuello de botella es JavaScript compitiendo por el hilo principal durante el arranque, no el peso de las imágenes ni el CSS.

**Metodología:** una tarea por vez. Después de cada tarea: desplegar, esperar a que propague, y volver a pasar Lighthouse móvil (3 pasadas, quedarse con la mediana) antes de tocar la siguiente. Anotar el resultado en la columna "Resultado" de la tabla.

---

## Resumen de tareas (en orden de ejecución)

| # | Tarea | Impacto esperado | Esfuerzo | Estado | Resultado |
|---|-------|------------------|----------|--------|-----------|
| 1 | Diferir GA / Google Ads / Hotjar hasta idle o primera interacción | Alto (TBT −1,5 a −2 s) | Bajo | **Hecho y desplegado** | Perf 51→54, **TBT 3.260→1.310 ms (−60%)**, LCP 4,4→4,8 s (ruido, ver nota) |
| 9b | Cloudflare: revisar Bot Fight Mode y cache de `index.html` | Medio (estabiliza mediciones) | Solo config | **Revisado — sin acción** | Ver nota abajo |
| 2 | App Insights: quitar handler `unload` (bfcache) | Medio | Bajo | Pendiente | |
| 3 | Listener de scroll fuera de la zona de Angular | Medio | Bajo | Pendiente | |
| 4 | Imágenes del footer: redimensionar y `width`/`height` | Bajo (CLS/LCP) | Bajo | Pendiente | |
| 5 | `ngZoneEventCoalescing` en el bootstrap | Medio | Bajo (probar bien) | Pendiente | |
| 6 | Auditar y reducir el bundle `main.js` (107 KiB sin usar) | Alto | Medio | Pendiente | |
| 7 | Font Awesome: subset o SVG inline (155 KiB de fuente) | Medio | Medio | Pendiente | |
| 8 | JSONs del arranque (countries, sponsors) fuera del camino crítico | Bajo | Bajo | Pendiente | |
| 9 | Cloudflare `jsd/main.js` (428 ms CPU) — revisar configuración | Medio | Solo config | Pendiente | |

---

## Tarea 1 — Diferir GA, Google Ads y Hotjar hasta idle / primera interacción ✅ IMPLEMENTADA

**Por qué es la primera:** es el mayor bloque de terceros en el TBT. Según el informe: Google Tag Manager 1.391 ms de CPU (3 scripts gtag) + Hotjar 856 ms. Todo esto se ejecuta a la vez que Angular está arrancando.

**Causa en el código:** en `src/app/app.component.ts`, cuando el usuario no es europeo (o ya dio consentimiento), `initializeCookieConsent()` llama a `analyticsService.setCookieConsent(true)` en cuanto llega la config de branding — es decir, en pleno arranque. Eso dispara inmediatamente `loadGoogleAnalytics()`, `loadGoogleAds()` y `loadHotjar()` en `src/app/shared/services/analytics.service.ts`.

**Hallazgo adicional durante la implementación — doble carga de GA/Ads:** en `app.component.ts` hay dos suscripciones que pueden llamar a `setCookieConsent(true)` para el mismo usuario ya consentido: `ccService.initialized$` (si `hasConsented()`) y `ccService.statusChange$` (si emite `'allow'`, algo que la librería de cookies puede hacer también al inicializarse si ya había consentimiento previo). Como el guard de "ya cargado" solo se marcaba `true` **dentro del callback `onload`** del script (asíncrono), una segunda llamada a `setCookieConsent(true)` que llegara antes de que el primer script terminara de cargar pasaba el guard sin problema → script duplicado, `gtag('config', ...)` duplicado y, más grave, **doble disparo del evento de conversión de Google Ads**. Esto coincide con las entradas duplicadas de `gtag/js?id=...` que aparecen en el informe de Lighthouse.

**Qué se ha hecho en `analytics.service.ts`:**

1. **Guard síncrono e idempotente** (`googleTagsRequested` / `hotjarRequested`, marcados como `true` de inmediato, no en el `onload`): da igual cuántas veces se llame a `setCookieConsent(true)`, el script solo se inyecta una vez. Esto resuelve la duplicación de raíz sin depender de arreglar todas las posibles fuentes de doble evento en el banner de cookies.
2. **GA y Ads comparten un único `<script gtag.js>`** (antes cada uno cargaba el suyo). gtag.js admite múltiples `gtag('config', id)` sobre la misma carga; no hace falta un script por id. Menos peso y una sola inicialización de `dataLayer`/`gtag`.
3. **Cola de eventos para GA** (`gaEventQueue`, igual que ya hacía `InsightsService` con `queuedTelemetry`): antes, si `trackEvent`/`trackPageView` se llamaba antes de que `gtag.js` hubiera cargado, el evento se descartaba en silencio para siempre. Ahora se encola y se envía en cuanto el script está listo — **no se pierde ningún evento** (ni "Init Page" ni "diagnosis_started"), sea cual sea el momento en que ocurran respecto a la carga.
4. **GA + Ads**: se programan con `requestIdleCallback` (máx. 2 s de espera) o primera interacción (`pointerdown`/`keydown`/`touchstart`), lo que ocurra antes. 2 s es tiempo de sobra para que esté listo mucho antes de que un usuario real complete "diagnosis_started" (requiere escribir síntomas y pulsar un botón).
5. **Hotjar se separa por completo**, con su propio disparador más perezoso: primera interacción real (`pointerdown`/`touchstart`/`scroll`/`mousemove`) o hasta 8 s de idle. No compite por CPU con GA/Ads y dejará de arrastrar sus fuentes Roboto (los 30 ms de `font-display`) y el botón de encuestas (fallo de accesibilidad `aria-hidden`) durante el arranque.
6. Sin consentimiento, la cola de GA se vacía explícitamente (no se retiene telemetría de alguien que no lo aceptó).

**Ojo / a vigilar tras desplegar:**
- Confirmar en Google Ads que las conversiones se siguen registrando (ahora unos segundos más tarde, ya no duplicadas).
- Confirmar en GA4 (tiempo real) que "Init Page" y "diagnosis_started" siguen llegando con normalidad.
- **Hallazgo aparte, no corregido aquí:** `trackPageView()` solo envía a Application Insights, nunca a GA — el "page_view" que ves en GA4 es el automático de `gtag('config', ...)` al cargar, no un evento por cada navegación de la SPA. Si en algún momento os interesa medir page views por ruta en GA, sería una tarea nueva (llamar a `gtag('event', 'page_view', ...)` en cada `NavigationEnd`), separada de esta.

**Validación:** TBT en móvil debería bajar claramente (~1,5–2 s menos). También deberían desaparecer o mejorar: aviso de `font-display` (Roboto de Hotjar), fallo de accesibilidad `aria-hidden` (botón de Hotjar), parte de las cookies de terceros en el arranque, y las entradas duplicadas de `gtag/js` en "Reduce unused JavaScript".

**Resultado medido tras desplegar (19/08):** Performance 51→54, **TBT 3.260→1.310 ms (−60%)** — mejora real y esperada. LCP 4,4→4,8 s: no atribuible al cambio (diferir scripts no debería empeorar LCP); ambos valores están en zona "roja" de Lighthouse (>4 s) así que la puntuación no distingue entre ellos. Es variabilidad normal entre mediciones móviles, posiblemente agravada por el challenge de bot de Cloudflare que puede inyectarse en pruebas automatizadas (ver tarea 9b). El TBT seguirá bajando con las tareas 3, 5 y 6; el LCP requiere las tareas 6, 7 y 8 para moverse de forma visible en la puntuación global.

---

## Tarea 9b — Cloudflare: bots y cache rules (config, sin código)

**Contexto:** al comprobar si la caché de Cloudflare podía estar sirviendo una versión antigua del sitio tras el despliegue, una petición simple recibió `403 Forbidden` con cabecera `Cf-Mitigated: challenge` — Cloudflare está lanzando un challenge de bot (Turnstile) ante tráfico que detecta como automatizado. Esto no invalida la medición del TBT (que sí mejoró, demostrando que el build nuevo se sirve correctamente), pero puede añadir variabilidad puntual al LCP si Cloudflare decide challengear también al bot de Lighthouse/PageSpeed Insights en alguna pasada.

**Qué se revisó:**
1. **Caché**: sin Cache Rules propias, "TTL de caché del navegador" en "Respetar los encabezados existentes" y nivel "Standard" → Cloudflare no cachea `index.html` en el borde por defecto (solo activos estáticos por extensión). No hace falta ninguna acción; se purgó la caché una vez para descartar dudas.
2. **Bots (Super Bot Fight Mode)**: "Bots verificados: Permitir" ya está activo. "Detecciones JS: On" no afecta a navegadores reales (incluido el Chrome headless de Lighthouse), solo a clientes que no ejecutan JS. "Tráfico definitivamente automatizado: Desafío administrado" sí puede challengear ocasionalmente a Lighthouse/PSI (Chrome headless con marcadores de automatización tipo `navigator.webdriver`), pero **no afecta a usuarios reales** (no tienen esos marcadores). Bajar esta protección para "arreglar" una métrica de laboratorio no compensa el riesgo de abrir la puerta a scraping/abuso real.

**Conclusión:** no se cambia nada en Cloudflare. El ruido de LCP entre pasadas de Lighthouse es esperable y no viene de caché ni de una configuración corregible sin asumir riesgo de seguridad. Para verificar mejoras reales, dar más peso a los **datos de campo (Field Data/CrUX)** de PageSpeed Insights si están disponibles para dxgpt.app (provienen de usuarios reales, no pasan por el challenge de bots) frente a los datos de laboratorio, que son más ruidosos.

---

## Tarea 2 — Application Insights: eliminar el handler `unload` (bfcache) y sacarlo del camino crítico

**Síntomas en el informe:**
- "Page prevented back/forward cache restoration: The page has an unload handler in the main frame".
- "Unload event listeners are deprecated" atribuido a `polyfills.js` (es zone.js parcheando el listener que registra App Insights, no un código tuyo directo).
- `/v2/track` (dc.services.visualstudio.com) aparece en la cadena crítica con 2.660 ms.

**Causa:** el SDK `@microsoft/applicationinsights-web` registra por defecto handlers en `unload`/`beforeunload` para hacer flush de telemetría. El handler `unload` rompe el bfcache (las navegaciones atrás/adelante dejan de ser instantáneas).

**Qué hacer:** en `src/app/shared/services/azureInsights.service.ts`, añadir a la config:

```ts
disablePageUnloadEvents: ['unload'],
```

El SDK usará `pagehide`/`visibilitychange` en su lugar, que son compatibles con bfcache. La inicialización diferida con `requestIdleCallback` ya la tienes bien hecha; opcionalmente se puede subir el `timeout` de 2000 a 5000 ms para que el primer `/v2/track` no compita con el LCP.

**Validación:** en Lighthouse debe desaparecer el fallo de bfcache y el warning de `unload` deprecated. En DevTools: Application → Back/forward cache → Test.

---

## Tarea 3 — Listener de scroll fuera de la zona de Angular

**Causa:** en `src/app/app.component.ts` (ngOnInit):

```ts
window.addEventListener('scroll', this.onScroll.bind(this), true);
```

Está registrado dentro de la zona de Angular y en fase de captura, así que **cada evento de scroll dispara un ciclo de change detection** de toda la app. En móvil (scroll táctil continuo) esto es trabajo de hilo principal constante. Contribuye al "Minimize main-thread work: 8,7 s".

**Qué hacer:** registrarlo fuera de la zona:

```ts
this.ngZone.runOutsideAngular(() => {
  window.addEventListener('scroll', this.onScroll, { passive: true });
});
```

`onScroll` solo actualiza `scrollPosition` y un flag de `requestAnimationFrame`; no necesita change detection. Además, guardar la referencia bound una sola vez para poder quitar el listener en `ngOnDestroy` (ahora mismo `bind` crea una función nueva y nunca se elimina).

Revisar si `beta-page` / `undiagnosed-page` tienen listeners similares y aplicar lo mismo.

**Validación:** grabación de Performance en DevTools con throttling de CPU x4: al hacer scroll no deberían aparecer tareas de change detection de Angular.

---

## Tarea 4 — Imágenes del footer

**Del informe (21 KiB ahorrables + CLS):**

1. `assets/img/Foundation29logo.webp`: es de 586×200 pero se muestra a 100×34. Generar una versión de ~200×68 (2x para retina). Ahorro ~14 KiB. Se usa como fallback en `footer.component.ts` y `branding.service.ts` (`getFooterLogo()`).
2. `assets/img/logo-f29-white.webp`: recomprimir (ahorro ~6 KiB). Es el footer de todos los tenants en `src/assets/config/branding-config.json`.
3. Añadir `width` y `height` explícitos a los `<img>` del footer (`footer.component.html`) para evitar layout shift.
4. `assets/img/logo-Dx29.webp` (header): el informe dice lo contrario — se sirve a **baja** resolución para su tamaño mostrado en pantallas retina. Generar versión 2x.

**Validación:** desaparecen los avisos "Improve image delivery" e "Image elements do not have explicit width and height".

---

## Tarea 5 — Event coalescing en el bootstrap de Angular

**Contexto:** `polyfills.js` (zone.js) acumula 1.692 ms de CPU en móvil. Parte es inevitable con zone.js, pero se puede reducir el número de ciclos de change detection agrupando eventos.

**Qué hacer:** en `src/main.ts`:

```ts
platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
  ngZoneRunCoalescing: true,
});
```

**Riesgo:** bajo, pero probar bien el flujo principal (formulario de síntomas, resultados, popups de SweetAlert, banner de cookies) porque cambia el timing de la detección de cambios.

**Nota a futuro (no para ahora):** la solución de fondo al coste de zone.js es migrar hacia change detection zoneless / signals en versiones modernas de Angular. Apuntado como tarea mayor separada.

---

## Tarea 6 — Reducir JavaScript del bundle principal

**Del informe:** `main.js` = 257 KiB transferidos, ~107 KiB sin usar en el arranque; 1.558 ms de CPU. `406.js` (114 KiB) también está en la cadena crítica del LCP.

**Qué hacer, por pasos:**

1. Generar source maps de producción y analizar: `ng build --source-map` + `npx source-map-explorer dist/**/main.*.js`. (Esto también quita el aviso "Missing source maps" si se despliegan, aunque desplegarlos es opcional.)
2. Candidatos típicos a revisar en este proyecto:
   - `sweetalert2` importado en `app.component.ts` y probablemente en muchas páginas → cargarlo dinámicamente (`await import('sweetalert2')`) solo cuando se muestra un popup.
   - Componentes/páginas que estén en el módulo raíz en vez de en módulos lazy (revisar `app.module.ts` y el routing; `undiagnosed-page` y `beta-page` tienen ~3.200 líneas cada una).
   - Locales/módulos de librerías importados enteros (ngx-translate, bootstrap JS, etc.).
3. Mover lo que se pueda a rutas lazy-load y dynamic imports.

**Validación:** comparar tamaño de `main.js` antes/después y el "Reduce unused JavaScript" del informe.

---

## Tarea 7 — Font Awesome: reducir 155 KiB de fuente + 27 KiB de CSS

**Contexto:** `free-fa-solid-900.woff2` (155 KiB) está precargado en `src/index.html` y el CSS completo (`free.min.css`, 27,5 KiB) se inyecta en `IconsService.loadIcons()` desde el arranque. Se descarga la fuente entera para usar (probablemente) unas pocas decenas de iconos.

**Opciones (de menor a mayor esfuerzo):**

1. Verificar que `@font-face` usa `font-display: block` de FA por defecto; con subset esto deja de importar.
2. Hacer un **subset**: inventariar los iconos usados (`grep -r "fa-" src/app src/index.html`) y generar fuente+CSS solo con ellos (herramientas: `fontawesome-subset` en npm). El preload de `index.html` pasaría a apuntar al subset.
3. Alternativa más limpia: sustituir por SVGs inline en los componentes y eliminar la fuente por completo.

**Validación:** el woff2 debería bajar de 155 KiB a <15 KiB y salir de la cadena crítica del LCP.

---

## Tarea 8 — JSONs del arranque fuera del camino crítico

**Del informe:** en la cadena crítica aparecen `countries.json` (7,6 KiB), `sponsors.json`, `branding-config.json` y `i18n/es.json` (41,8 KiB).

- `branding-config.json` e `i18n/es.json` sí son necesarios para pintar. Añadir en `index.html` hints de precarga para acortar la cadena (se descubren tarde, tras ejecutar `main.js`). Para i18n el idioma es dinámico, así que valorar `<link rel="preload">` generado o al menos `modulepreload`/`preconnect` si aplica.
- `countries.json` y `sponsors.json`: localizar quién los pide en el arranque y cargarlos bajo demanda (cuando el usuario abre el selector de país / cuando el footer con sponsors entra en viewport con `IntersectionObserver`).

**Validación:** la cadena crítica del informe ("Network dependency tree") debe acortarse.

---

## Tarea 9 — Cloudflare `jsd/main.js` (solo configuración, sin código)

**Contexto:** el `…jsd/main.js(dxgpt.app)` con 428 ms de CPU y el `…aae2b9a1c261/main.js` con cache de 4 h **no son código del repo**: es el script de *JavaScript Detections* / Bot Management de Cloudflare, servido bajo tu dominio. También es el origen de los warnings de APIs deprecadas ("Shared Storage API", "Protected Audience API", `StorageType.persistent`) atribuidos a `main.js:1`.

**Qué hacer:** en el dashboard de Cloudflare, revisar Security → Bots → *JavaScript Detections* / Bot Fight Mode. Si no se está usando activamente para decisiones de bloqueo, desactivarlo elimina esos 428 ms de CPU y los warnings. Si se necesita, no hay nada que hacer en el código.

---

## Cosas del informe que NO merecen acción (para no perder tiempo)

- **Cookies de terceros (43) y warnings del panel Issues:** vienen de Google Ads/DoubleClick y Hotjar. Se reducen solas con la Tarea 1, pero no desaparecerán mientras uses Google Ads con conversiones. No es un problema de rendimiento.
- **Cache TTL de 1 min de `hotjar-3279828.js`:** es de Hotjar, no controlable.
- **Fuentes Roboto de Hotjar:** desaparecen del arranque con la Tarea 1.
- **"Unattributable" 1.413 ms:** mejorará como consecuencia de las tareas 1, 3 y 5; no es accionable directamente.

## Orden de re-medición

Tras cada despliegue: PageSpeed Insights (móvil) sobre `https://dxgpt.app` en incógnito, 3 pasadas, apuntar mediana de Performance, TBT y LCP en la tabla de arriba. Objetivo razonable tras las tareas 1–5: **móvil ≥ 70**.
