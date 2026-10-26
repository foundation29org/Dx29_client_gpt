# Auditoría de flujos DxGPT (cliente Angular + servidor Node.js)

**Alcance.** Se ha revisado el código real, sin modificarlo, de `Dx29_client_gpt` (`main`@`fec3889`) y `Dx29_server_gpt` (`main`@`68b5099`). La evidencia de calidad viene del banco `dxgpt-bench-lab` (pipeline_v4). Las cifras marcadas con «≈» son estimaciones; hay que validarlas con el `duration` de `costTracking`.

**Notación.**
Símbolos: `→` serie · `‖` paralelo · `⟿` Web PubSub. Servicios: AT = Azure Translator · DI = Document Intelligence. Ficheros: UD/BP = `undiagnosed-page`/`beta-page.component.ts` · HD, FU, SS, MQ, CI = `services/{helpDiagnose, followUpService, summarizeService, medicalQuestionService, callInfoDiseaseService}.js` · MI = `controllers/all/multimodalInput.js` · IRS = `services/multimodalImageRoutingService.js`.

**Diferencias con el enunciado.**
`controllers/all/helpDiagnose.js` no existe: `routes/index.js:34-35` apunta a HD:1957. `sonarService.js` tampoco existe. Perplexity se usa a través de su Search API (MQ:395) y la respuesta la redacta gpt-6.1-sol. `/medical/analyze` no describe las imágenes. La cadena analyze → summarize → diagnose la ejecuta el servidor en el mismo proceso (MI:613-670, 865-910).

## 1. Mapa real de los 6 flujos

**1.1 Diagnóstico (`POST /api/diagnose`).**
*Cliente:* `checkText()` (UD:2772) ofrece resumir por encima de 3.000 caracteres y lo exige por encima de 8.000 → `callAI()` (UD:1324) → negotiate + WS (UD:865) → POST (UD:1440). *Servidor síncrono* (HD:1957-2215): validación → `resolveDiagnosticImages` (2133) → utilización en memoria (2157). Si hay saturación responde `queued` vía Service Bus (el cliente sondea cada 10 s); si no, `processing` (2198). *Servidor asíncrono* (HD:154-1857), en serie: (1) `detectLanguageSmart` (213) → AT del texto (254) → AT de `diseases_list` (260). (2) `classifyIntent` con gpt-5.4-mini (331). Si falla, deja pasar; se omite con `forceDiagnosis`. (3) Prompt + imágenes ‖ (990-1030) → **gpt-5.6-terra** `low`, 180 s, con failover (1050) → `parseJsonWithFixes`. (4) `anonymizeText` con gpt-5.4-mini (1213) → AT del texto anonimizado (1244) → `saveQuestion` (1297). (5) AT inverso ‖ por campo y síntoma (1324-1347) → perfil (1379) → blob (1477) ⟿ `result` (133). (6) Además, 5 `await sendProgress` intercalados.

**Balance:** 3 LLM en el caso típico (hasta 6) y unas 40-50 llamadas a AT. Solo las imágenes y el AT inverso van en paralelo.

**1.2 Multimodal (`POST /api/medical/analyze`).**
(1) UD:3658 → WS → POST multipart ⇒ `processing` (MI:408). (2) Documentos **en serie** con DI `prebuilt-layout`; `pollUntilDone` no tiene timeout (MI:442-472). (3) **Después**, imágenes ‖2: clasificador **gpt-5.6-terra** (umbral 0,9) → OCR con DI si es documental o mixta → al Blob solo `vision` (IRS:96-376). (4) `combinedInput` (MI:530) → **`summarize` si supera 1.000 caracteres** (MI:126, 654). (5) `handleDiagnoseOrAsk` simulado (MI:865) = flujo 1.1, que vuelve a descargar las imágenes. (6) ⟿ `preprocessing`: el cliente **sustituye el texto por el resumen** (UD:3999) ⟿ `result`.

**1.3 Refinamiento.**
`/questions/followup` (UD:3053 → FU:126): detección → AT del texto → AT del diferencial → gpt-5.4-mini (5-8 preguntas; 5 en `hypothesis`) → AT ‖. `/questions/emergency` (FU:1146): igual pero sin diferencial. Solo se llega tras un modo oculto de 5 clics (UD:2964). `/patient/update` (UD:3114 → FU:684): detección → AT del texto → AT ‖ por par → gpt-5.4-mini **reescribe** (≤5.000) → AT inverso. El cliente **sustituye** el original (UD:3181) y se repite el flujo 1.1 completo. **Load more** (UD:1984): `diseases_list` con nombres **ya traducidos** → flujo 1.1 con `withDiseases`. **Recalcular** (UD:2165): solo los síntomas **marcados** → flujo 1.1.

**1.4 Ask e información de enfermedad.**
`/ask` (BP:308 → 341), sin paralelismo: detección → AT → intención (HD:331) → anonimización (423) → gpt-6.1-sol genera 3 consultas (MQ:320) → **Perplexity Search API** (MQ:385-497) → síntesis con gpt-6.1-sol (MQ:539) → `saveQuestion` ⟿ `result`, **enviado dos veces** (HD:760, 133). `/disease/info` (UD:2035 → CI:101): prompt según `questionType` (0-6) → gpt-5.4-mini (Terra si hay `uploadId`) → AT inverso. Sin caché ni citas.

**1.5 Resumen (`/medical/summarize`, SS:57).** Se llama por HTTP síncrono desde la UI, `fitDescription` (UD:3227), Ask (BP:544) y multimodal. Secuencia: detección (SS:141) → AT a inglés → **gpt-5.4-mini** `low` sin tope de salida (254) → AT inverso (326). No se puede cancelar.

**1.6 Voz (`/internal/speech/transcribe`).** El audio se corta en segmentos de ~5 min aprovechando las pausas (`dictation-segmenter.ts:8-11`) y se sube ‖ mientras se habla, con 3 reintentos. `transcribe()` (`speechTranscribe.js:101-170`) atiende solo a tenants y usa **gpt-4o-transcribe** en EU con 60 s de timeout; el texto va al textarea. `takeUntil` aborta el XHR, pero el servidor no cancela la llamada a Azure.

**Patrón común.**
Cada llamada repite detectar → traducir → LLM → retraducir, sin reutilizar nada. Se responde `processing` antes de trabajar, así que no se puede cancelar.

## 2. Auditoría técnica (eficiencia y deuda)

Etiquetas: [lat] latencia · [cost] coste · [acop] acoplamiento · [deuda] · [bug]

| # · Flujo | Archivo / función | Problema | Mejora |
|---|---|---|---|
| **P1-1** · 1,2,4 | UD:1393, 966; HD:2198; `aiUtils.js:605` | [cost][bug] Cancelar solo cierra el WS: Terra, DI, Sol y Perplexity siguen. Sin `requestId`, al relanzar se puede pintar el diferencial **de otro caso**. | `requestId` + `AbortController` con `signal` en axios |
| **P1-2** · 1,4 | HD:1050→1213-1297; 331→423 | [lat] La anonimización (sin timeout, `anonymizeService.js:98`), el AT y `saveQuestion` esperan a Terra. En Ask, intención y anonimización van en serie y el AT a inglés solo lo usa el clasificador (HD:413). | `Promise.all` (≈ −1-3 s) |
| **P1-3** · 2→5 | MI:126, 654; SS:188, 326 | [lat][cost] Se resume todo lo que pasa de 1.000 caracteres y se traduce en círculo (EN → resumen → idioma → EN). | Umbral ≥ 8.000; pasar `englishSummary` |
| **P1-4** · 2 | MI:442-526; HD:2133, 1030 | [lat] Documentos en serie e imágenes después. Diagnose vuelve a descargar lo que ya estaba en memoria. | Documentos ‖ imágenes; pasar buffers |
| **P1-5** · 1,3 | HD:254/260, 1324-1347; FU:471, 784 | [lat][cost] Unas 30-50 llamadas a AT de un solo texto. Si falla una, se aborta el diagnóstico (HD:1369). | Un lote AT + `Promise.all` |
| **P1-6** · 3 | UD:1984, 3192; HD:213-330 | [lat][bug] Load more, `patient/update` y recalcular repiten detección, traducción, **intención** y anonimización. Un caso ya diagnosticado puede volver como `enrich`. | `forceDiagnosis`; reutilizar EN e idioma |
| **P2-7** · cola | `queueService.js:385-403` | [bug] El mensaje no lleva `flow`, `countryCode` ni `forceDiagnosis`: con carga, **`/ask` se procesa como diagnose**. | Serializar `sanitizedData` |
| **P2-8** · 1,4 | HD:127-1698, 1477; 133/760 | [lat] `await` de progreso, BD y blob en la ruta crítica. Ask envía `result` dos veces. | `void`; un solo envío |
| **P2-9** · 1,2,4 | UD:865-949 | [lat] Negociación del WS (≤10 s) antes de cada POST. | WS persistente por sesión |
| **P2-10** · 1,3,5 | HD:1119-1151; `aiUtils.js:779-1410` | [deuda] Sin `response_format`: ~600 líneas de reparación + un LLM reparador. El resumen síncrono no comprueba `finish_reason`. | `json_schema` estricto; topes; 202 + PubSub |
| **P2-11** · capacidad | `queueService.js:320-330, 444-458` | [acop] La utilización vive en memoria de cada instancia, así que no escala en horizontal. | Contador distribuido |
| **P2-12** · 4, 2 | CI:275-301, 319; MI:758-862 | [cost][bug] `/disease/info` usa Terra e imágenes también en los tipos 0-2, `questionType` no está declarado y no hay caché. Multimodal no borra las subidas fallidas. | Imágenes solo en 3-6, caché, corregir; borrar en `catch` |
| **P3-13** · varios | HD:119, 154-1857, 1528; MI:613; FU:1146 | [deuda][acop] Rama muerta; ~700 líneas de costes copiadas; `ask` en una función de 1.700 líneas; `req`/`res` simulados; `emergency` oculto; `promptsold.js` sin uso. | `CostLedger`, controladores y servicios tipados |
| **P3-14** · varios | `translation.js:115,174,259` | [deuda] El texto clínico acaba en App Insights cuando hay errores. | Registrar solo longitudes y códigos |

## 3. Propuestas para mejorar las hipótesis diagnósticas

**Punto de partida.** Terra `low` con el prompt histórico (`assets/prompts.js`) obtiene en `all_256_clean` R@1 74,6 %, R@3 94,9 % y R@5 98,1 %. El margen está en **ordenar**, no en cubrir.

Lo que ya enseña el banco (`docs/analysis/product-mixed-count-ablation-2026-07.md`, `docs/archive/summarization_feat-README.md`):
Los retoques de prompt «razonables» empeoran: el encuadre mínimo baja R@1 3,5 pp y «hasta 4» lo baja 4,7 pp. Dejar `N` libre es intencionado. Resumir los casos hundió el acierto un 26-31 %.

**Punto ciego.** El banco mide el prompt sobre `case_en`, que ya viene traducido. No mide la traducción en vivo, el resumen, `patient/update` ni Load more.

| Paso | Qué se pierde (evidencia) | Propuesta |
|---|---|---|
| Resumen (multimodal >1.000; UI >3.000) | Analíticas, unidades, fechas, fármacos, negativos y cronología. El prompt dice *«keeping only relevant clinical information…»* y *«The result should be shorter»* (SS:217). | Subir el tope y hacer **una extracción clínica estructurada de todos los documentos** (no una por documento) |
| Saneado del OCR | Las tablas se aplanan («Hemoglobina9.1g/dL12-16») por `sanitizeInput` (`aiUtils.js:159-165`). | Convertir `</td>` en ` \| ` y `</tr>` en salto de línea antes de sanear |
| Traducción previa | Siglas, marcas locales, negaciones y unidades. La salida se retraduce campo a campo (HD:254, 1324). | A/B por idioma: AT, texto original y LLM con glosario |
| `patient/update` | Original → AT → reescritura → AT → AT. Los negativos explícitos solo se piden en `hypothesis` (FU:862), la regla *«merge… instead of appending»* (FU:17) anima a fusionar y el original se sustituye (UD:3181). | **Solo añadir:** original + bloque «Follow-up findings» (sí/no/no sé, «Denies X») |
| Preguntas | Abiertas, y dan por hecho *«none of these seem to match»* (FU:320). Las genera un modelo mini. | Preguntas cerradas y discriminativas; probar Terra |
| Recalcular | Los síntomas **no marcados** no se envían, así que se pierden negativos (UD:2165). | Checklist de tres estados → «No X» |
| Load more | Excluye por nombres retraducidos, lo que genera duplicados (UD:1972; HD:260). | Reenviar el nombre en inglés (`responseEnglish`, HD:1437) |
| Imágenes | No se pasan a texto y se pierden a las 24 h (FU:10-13). | Campo `image_findings` en la salida de Terra |

**Prompts.**
**Diagnóstico:** es mínimo y está validado. No recoge negativos ni hallazgos esperables ausentes, no pide orden por probabilidad y no marca los graves. Como tocar el encuadre baja R@1, es mejor **añadir pasos fuera del prompt**. **Ask:** etiqueta como «VERIFIED» fuentes que solo pasan una denylist (MQ:549). **`/disease/info`:** asume *«I am a doctor»* (CI:213).

**Sobra:**
el resumen genérico previo; la reescritura libre en `patient/update`; las traducciones de ida y vuelta; reclasificar y volver a anonimizar al refinar.

**Falta:**
(1) **Representación clínica canónica** por caso, en inglés y en el servidor: cronología, positivos y **negativos pertinentes**, antecedentes y fármacos por separado, laboratorio con unidades, imagen y fuente. Alimentaría follow-up, info y Load more, y acompañaría al texto original en el diagnóstico. (2) **Verificador de evidencia** barato, que no reordena: retira de `symptoms_in_common` lo que no aparece o está negado (`product_mixed_24`). (3) **Chequeo de graves** en paralelo. (4) **Preguntas por valor de información.** (5) **Evaluar el pipeline completo**, no solo el prompt.

## 4. Evaluación de la capa agéntica post-diferencial

**Dónde.** En `processAIRequestInternal`, después de validar `parsedResponseEnglish` (HD:1119-1151) y antes de anonimizar y retraducir (HD:1211/1303). Trabaja en inglés, con el caso, las imágenes y las 5 hipótesis, y en paralelo con la anonimización.

**Qué haría** (1-2 turnos):
buscar evidencia a favor y en contra de cada hipótesis (negativos, edad, sexo, cronología); detectar diagnósticos graves ausentes; reordenar solo con justificación; proponer 2-3 pasos discriminativos para el follow-up; opcionalmente, consultar HPO/Orphanet o la búsqueda de MQ para enfermedades raras.

**Impacto (≈).**
Una pasada extra de Terra: +5-9 s y +60-120 % del coste de la etapa (Terra tarda 6,9 s de media en el banco). Con búsqueda por hipótesis: +8-15 s y 2-3× el coste. Si es síncrona, duplica la espera.

**Valor.** Con R@5 en 98,1 %, solo puede mejorar R@1 (74,6 %).
*Hipótesis:* sin información nueva, la autocrítica aporta poco en modelos de razonamiento. Las mejoras claras de los sistemas agénticos (DeepRare, Nature 2025) vienen de herramientas especializadas.

**PubSub.** Es viable en dos fases: primero `result` y después `verification` con indicadores, sin reordenar lo que ya se ha mostrado. Requiere no cerrar el WS al recibir `result` (UD:966) y tener `requestId` (P1-1).

**Recomendación: aparcar.**
Hacer ya solo el verificador de evidencia. Retomar la capa agéntica como PoC offline (2-3 semanas) cuando estén el banco del pipeline y P1-1. Seguir solo si se cumplen todos estos criterios: R@1 +3 pp, sin perder R@5 ni HPO; −50 % de síntomas sin respaldo; p50 adicional ≤ 6 s; coste ≤ +60 %. Si se cumplen, ofrecerla como «segunda opinión» asíncrona para tenants profesionales.

## 5. Hoja de ruta recomendada

**Dejar como está:**
enrutado multimodal V1; prompt histórico con `N` libre sobre Terra `low`; frases de país e imagen (MedReaMM); clasificador de intención con `json_schema` y fail-open; detección de idioma por niveles; 202 + PubSub con Service Bus como válvula; failover con `Retry-After`; dictado segmentado.

**Quick wins (< 2 días):**

| # | Cambio (referencia) | Esfuerzo |
|---|---|---|
| 1 | `requestId` y un solo `result` en Ask (P1-1, P2-8) | 0,5 d |
| 2 | Terra ‖ anonimización; intención ‖ anonimización (P1-2) | 0,5 d |
| 3 | AT por lotes + `Promise.all` (P1-5) | 1 d |
| 4 | `forceDiagnosis` y reutilizar inglés e idioma al refinar (P1-6) | 1 d |
| 5 | `void` en progreso, BD y blob (P2-8) | 0,5 d |
| 6 | Multimodal: documentos ‖ imágenes, umbral ≥ 8.000, sin traducción circular (P1-3, P1-4) | 2 d |
| 7 | Conservar las tablas de DI antes de sanear (§3) | 0,5 d |
| 8 | Prompts de resumen y `patient/update`: valores, unidades, fechas y negativos; topes (§3, P2-10) | 1 d + validación |
| 9 | Cola con `flow`, `countryCode` y `forceDiagnosis` (P2-7) | 0,5 d |
| 10 | Cancelación mínima con `AbortController` (P1-1) | 2 d |
| 11 | CI:319, imágenes solo en los tipos 3-6, borrar subidas, código muerto y PHI fuera de logs (P2-12, P3) | 1 d |
| 12 | Voz: `prompt` clínico en gpt-4o-transcribe | 0,5 d |

**Experimentos y evolución mayor (backlog, con benchmark previo):**
(1) Banco del pipeline de producción (requisito previo del resto). (2) Traducción: AT frente al texto original frente a un LLM con glosario. (3) Extracción estructurada única frente al resumen, con umbrales de 1.000 a 24.000 caracteres. (4) Verificador de evidencia. (5) Representación clínica canónica. (6) Salidas estructuradas en el diagnóstico. (7) `patient/update` que solo añade, frente a la reescritura. (8) Preguntas por valor de información. (9) Capa agéntica (§4). (10) Arquitectura: WS persistente o SSE, capacidad distribuida, cancelación de extremo a extremo e `image_findings`.
