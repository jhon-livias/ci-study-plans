# Instrucciones para agentes — ci-frontend

SPA del centro de idiomas construida con TypeScript y Angular 22. Es el cliente de la API REST del Gateway; nunca se conecta directamente con Moodle, intranet, Niubiz, Nubefact, bases de datos ni microservicios internos.

## Stack

- Angular 22, zoneless, SPA sin SSR y compilación AOT en producción.
- Node.js 22, TypeScript estricto, Angular Signals y Signal Forms.
- Tailwind CSS para layouts y SCSS para componentes reutilizables.
- Vitest, Angular testing utilities y Axe para pruebas.
- Este repositorio provee su `Dockerfile`; `ci-deploy` orquesta frontend, backend e infraestructura con Docker Compose.

## Arquitectura

Estructura dentro de `src/app/`:

- `core/`: configuración de aplicación, clientes HTTP, interceptores, guards funcionales, manejo de sesión y utilidades transversales.
- `shared/ui/`: componentes presentacionales puros y reutilizables; no inyectan servicios de negocio.
- `layouts/`: shells de autenticación y aplicación.
- `features/`: dominios aislados: `auth`, `students`, `academic`, `enrollment`, `attendance-grades`, `exams` y `payments`.
  - Cada dominio contiene `components/`, `data-access/`, `models/`, `pages/` y, cuando corresponda, `state/`.

Un dominio no importa detalles internos de otro. Comparte únicamente UI, tipos o utilidades realmente transversales desde `shared/` o `core/`.

## TypeScript, DDD y diseño

- Todo el código de aplicación, pruebas y configuración se escribe en TypeScript estricto. Prohibido `any`, `@ts-ignore` y conversiones inseguras; usa `unknown`, type guards y validación al recibir datos externos.
- Aplica DDD pragmático, SOLID y DRY: evita duplicar conocimiento, pero no crees abstracciones prematuras ni servicios genéricos gigantes.
- Usa Adapter para convertir DTOs del backend en modelos de vista estrictos. El JSON crudo de `HttpClient` nunca llega a un componente.
- Mantén la lógica de negocio fuera de componentes y templates. Los guards solo mejoran la experiencia; la autorización real siempre la impone el backend.

## Angular 22

- Componentes pequeños, cohesionados y standalone por defecto. No declares explícitamente `standalone: true` ni `OnPush` cuando sean valores predeterminados.
- Usa `inject()` en lugar de inyección por constructor. Para servicios globales usa `@Service()`; para proveedores con otro alcance, usa `@Injectable()` de forma explícita.
- Usa `input()`, `output()` y `viewChild()`; no uses `@Input`, `@Output` ni `@ViewChild`.
- Usa Signals: `computed()` para estado derivado y `.set()`/`.update()` para cambios. No uses `.mutate()`.
- Limita RxJS a `data-access/`. Convierte resultados a Signals con `toSignal()` o usa `async`; cancela/limpia suscripciones cuando corresponda.
- Usa Signal Forms para formularios nuevos. Si no aplica, usa Reactive Forms; no uses formularios template-driven.

## Templates, estilos y accesibilidad

- Usa `@if`, `@for`, `@switch` y `@defer`; no uses `*ngIf`, `*ngFor` ni `*ngSwitch`.
- No uses `[ngClass]` ni `[ngStyle]`; usa bindings nativos de clase/estilo.
- Usa `NgOptimizedImage` (`ngSrc`) para imágenes estáticas cuando corresponda.
- Smart components (`features/`, `layouts/`) usan Tailwind en el template. `shared/ui/` usa nombres semánticos y SCSS con `@apply` para comportamiento visual reutilizable.
- Cumple WCAG 2.2 AA: semántica HTML, foco visible y administrado en cambios de ruta/modales, navegación por teclado, contraste, etiquetas accesibles y mensajes de error anunciables. Ejecuta Axe en flujos nuevos o modificados.

## Seguridad obligatoria

- Diseña contra el [OWASP Top 10:2025](https://top10.owasp.org/2025/0x00_2025-Introduction/) y el [OWASP Web Frontend Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Web_Frontend_Security_Cheat_Sheet.html). Todo dato de usuario, API, caché, URL, `postMessage` o proveedor externo es no confiable.
- Mantén Angular, dependencias y `package-lock.json` actualizados. Ejecuta `npm audit` y no despliegues hallazgos altos/críticos sin evaluación y mitigación documentada.
- No uses `innerHTML`, `outerHTML`, `document.write`, `eval`, `Function`, compilación JIT ni plantillas dinámicas con datos externos. No llames a `DomSanitizer.bypassSecurityTrust*` salvo revisión explícita de seguridad, allowlist estricta y prueba dedicada.
- Producción usa AOT. En hosting estático, conserva `optimization.styles.inlineCritical: false` para evitar scripts inline de CSS crítico y mantener `script-src 'self'`; Angular puede insertar estilos de componentes en tiempo de ejecución, por lo que sin nonces únicos por respuesta `style-src 'self' 'unsafe-inline'` es la excepción mínima documentada. Configura en proxy/CDN una CSP con `frame-ancestors`, `base-uri`, `object-src`, `connect-src`, `img-src`, `form-action` y Trusted Types. `upgrade-insecure-requests` se habilita solo en el perfil TLS/HTTPS, nunca en el perfil HTTP temporal porque bloquearía los bundles. No agregues `unsafe-eval`; cualquier excepción de CSP requiere justificación y prueba.
- Configura Trusted Types con `require-trusted-types-for 'script'` y las políticas Angular mínimas necesarias (`angular`, `angular#bundler`). No habilites `angular#unsafe-bypass` ni `angular#unsafe-jit` salvo revisión formal.
- El frontend no controla CORS: el Gateway debe permitir únicamente orígenes explícitos. `environment` solo contiene URLs públicas de API; nunca secretos, claves de Niubiz/Nubefact, tokens de Moodle ni credenciales.
- Prefiere sesión con cookies `HttpOnly`, `Secure`, `SameSite` apropiado y protección CSRF del backend. No guardes access tokens, refresh tokens, contraseñas, DNI, datos de pago o PII sensible en `localStorage`, `sessionStorage`, URL, logs, analytics o estado persistente.
- Envía `withCredentials` y encabezados CSRF solo al Gateway de origen explícitamente confiable. No reenvíes tokens/headers a URLs elegidas por el usuario ni a terceros.
- Al cerrar sesión, limpia estado en memoria, cachés de aplicación y datos mostrados. Las respuestas sensibles deben llegar con `Cache-Control: no-store` desde el backend; el cliente no debe guardarlas offline.
- Valida formularios en cliente para UX, pero asume que el backend vuelve a validar, autoriza y limita toda operación. Muestra errores genéricos; no reveles stack traces, DTOs internos ni detalles de seguridad.
- Para enlaces externos usa URLs con allowlist y `rel="noopener noreferrer"` al abrir otra pestaña. Valida origen, esquema y formato de todo `postMessage` antes de procesarlo.
- Para pagos usa checkout/redirección o campos hospedados por Niubiz. Nunca captures, registres, almacenes ni proceses PAN, CVV o datos de tarjeta; el estado final proviene del backend/webhook, no de parámetros de retorno del navegador.
- Para cargas de archivos limita formato y tamaño en UI solo como ayuda; el backend realiza la validación y antivirus definitivos. No previsualices HTML/SVG/PDF no confiable como contenido ejecutable.
- No incluyas Swagger, paneles administrativos ni archivos fuente/mapas de producción públicamente sin necesidad. Los source maps se publican solo si están protegidos y son requeridos para observabilidad.

## HTTP, estado e interoperabilidad

- Centraliza `HttpClient` en `data-access/` con interceptores para credenciales, CSRF, correlación y errores. No implementes autenticación ni redirecciones de pago mediante llamadas manuales dispersas.
- Define DTOs de entrada/salida, validadores y Adapters por endpoint. Trata las respuestas incompletas o malformadas como errores controlados.
- Usa HTTPS y una base URL configurada por entorno. La API pública final conserva el prefijo `https://services.uprit.edu.pe/api/v1`; no cambies `/api/v1` por rutas no versionadas. No construyas URLs desde texto controlado por usuario ni permitas redirecciones abiertas.
- Moodle, intranet, Nubefact y Niubiz son integraciones exclusivas del backend. La SPA consume únicamente contratos REST públicos versionados del Gateway.

## Regla de cierre de notas

- Cuando un grupo culmina, el docente asignado dispone de dos semanas para subir y guardar sus notas. Al terminar ese plazo, oculta la acción para entrar a registrar o editar notas del grupo culminado.
- Usa el estado y la disponibilidad informados por el backend; no confíes en el reloj del navegador como control de seguridad. El backend debe rechazar las solicitudes fuera de plazo aunque se manipule la interfaz.

## Verificación antes de entregar

- Ejecuta `npm run build`, `npm run test` y `npm audit`.
- Añade o actualiza pruebas para componentes, adapters, guards, interceptores, formularios y rutas modificadas; incluye pruebas de autorización de UX y accesibilidad cuando aplique.
- Revisa manualmente CORS/CSP, ausencia de secretos/PII en bundles y logs, manejo de sesión/CSRF y la respuesta de errores del backend en flujos sensibles.
