# Seguridad: skill `security-audit` de Cloudflare

Este repositorio incluye la skill [`security-audit`](https://github.com/cloudflare/security-audit-skill) de Cloudflare. Con ella, un agente de código como GitHub Copilot puede hacer auditorías de seguridad estructuradas y verificables sobre el código.

## Qué se ha instalado

| Elemento | Ubicación | Descripción |
|----------|-----------|-------------|
| Skill | [`.agents/skills/security-audit/`](../.agents/skills/security-audit/) | Copia sin modificar de `skills/security-audit` del repo upstream |
| Lockfile | [`skills-lock.json`](../skills-lock.json) | Origen y hash de la skill, para restaurarla o actualizarla con el Skills CLI |
| Licencia | [`LICENSE-security-audit-skill`](./LICENSE-security-audit-skill) | Licencia MIT original de Cloudflare. Se incluye porque la copia instalada no la trae |

- **Origen:** `cloudflare/security-audit-skill` (rama `main`, commit `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`)
- **Comando usado:**

  ```bash
  npx skills add https://github.com/cloudflare/security-audit-skill \
    --skill security-audit --agent github-copilot --copy -y
  ```

  `--copy` copia los archivos en vez de crear symlinks, que fallan con frecuencia en Windows y en git.

GitHub Copilot (CLI, VS Code, Visual Studio y el agente en la nube) detecta automáticamente las skills de proyecto en `.agents/skills/`, `.github/skills/` y `.claude/skills/`. No hace falta configurar nada más. En Copilot CLI se puede comprobar con `/skills list`.

## Qué hace la skill

Ejecuta una auditoría en seis fases. Cada fase usa subagentes aislados:

1. **Reconocimiento.** Mapea la arquitectura, las fronteras de confianza y las superficies de entrada. Genera `architecture.md` y `coverage-ledger.json`.
2. **Búsqueda guiada por cobertura.** Asigna "hunters" a cada unidad del ledger y usa críticos para detectar huecos.
3. **Validación de candidatos.** Un verificador nuevo intenta refutar cada hallazgo.
4. **Salida estructurada.** Escribe en `findings.json` registros `confirmed`, `needs_validation` y `rejected`, validados contra `report-schema.json`.
5. **Verificación independiente.** Otros agentes nuevos vuelven a verificar las afirmaciones finales.
6. **Informe.** Genera `REPORT.md`, `FINDINGS-DETAIL.md` y `NEEDS-VALIDATION.md`.

Las clases de ataque relevantes para este proyecto (cliente Angular + API con LLM) están en `CLIENT-SIDE.md`, `AI-AND-LLM.md`, `WEB-PROTOCOL-AND-AUTH.md`, `SUPPLY-CHAIN-AND-RELEASE.md` y `CLOUD-AND-DEPLOYMENT.md`.

## Cómo usarla

Abre el agente en la raíz del repo y pide una auditoría:

```
security audit this codebase
```

```
find security vulnerabilities in ./src
```

```
do a security review, output to ~/audits/dxgpt-client
```

Si la petición es una auditoría completa, la skill usa el **modo auditoría completa**. Si es una pregunta o un trabajo acotado, usa el **modo guía**, salvo que pidas los artefactos del informe.

### Dónde se guardan los resultados

- Por defecto: `~/security-audit-skill/<repo-name>/run-<N>`, **fuera del repositorio**.
- Solo escribe dentro del repo si eliges un directorio ignorado por git. **No subas los informes al repo**, porque pueden describir vulnerabilidades no corregidas.
- Las ejecuciones se acumulan: cada nueva ejecución reutiliza los ledgers y hallazgos anteriores para cubrir los huecos que quedaron.

## Requisitos

- Un agente con soporte de herramientas y subagentes en paralelo, como GitHub Copilot.
- Node.js para los validadores `validate-findings.cjs` y `validate-coverage-ledger.cjs`, que no tienen dependencias.
- Un **sandbox aislado por el sistema operativo** si la auditoría va a ejecutar código del proyecto (builds, tests, navegadores…), sin red externa y con escritura limitada. Sin sandbox, la skill no ejecuta código y deja esos hallazgos como `needs_validation`.

### ⚠️ Limitación en Windows nativo

Los validadores necesitan `O_NOFOLLOW` y `O_NONBLOCK` para leer archivos de forma segura (sin seguir symlinks ni bloquearse). Esas flags solo existen en sistemas POSIX, así que en Windows nativo los validadores se niegan a leer archivos (*fail-closed*) y muestran este error:

```
OS no-follow and nonblocking input protection is unavailable
```

Resultado de los tests incluidos al ejecutarlos en Windows (Node 24):

```bash
cd .agents/skills/security-audit
node --test validate-findings.test.cjs validate-coverage-ledger.test.cjs
# tests 65 · pass 46 · fail 7 · skipped 12
```

Los 7 tests que fallan leen archivos desde la CLI y fallan solo por esta protección. Para auditorías completas usa **Linux, macOS, WSL, Codespaces o un dev container**. No modifiques los validadores para saltarte la protección.

## Mantenimiento

```bash
# Actualizar a la última versión upstream
npx skills update security-audit

# Restaurar desde skills-lock.json
npx skills experimental_install

# Desinstalar
npx skills remove security-audit
```

Al actualizar, revisa el diff de `.agents/skills/security-audit/`. Las skills se ejecutan con todos los permisos del agente.

## Licencia

La skill es © 2025-2026 Cloudflare, Inc., bajo licencia MIT. Consulta [`LICENSE-security-audit-skill`](./LICENSE-security-audit-skill).
