# UI compartida

Componentes presentacionales reutilizables. No conocen endpoints, sesión ni
reglas de negocio. Agrega aquí `input`, `select`, `dialog`, `table`, `alert` y
otros primitives después de que el diseño de Figma los defina.

Disponibles: `ui-button`, `ui-icon-button`, `ui-icon`, `ui-field`, `ui-select`, `ui-stepper`, `ui-confirm`, `ui-card`, `ui-badge`,
`ui-alert`, `ui-table`, `ui-page-header` y `ui-filter-bar`. `ui-icon` dibuja trazos propios
(`edit`, `trash`, `key`, `chevron-left`, `chevron-right`, `chevron-down`) y `ui-icon-button` los usa con `label` accesible. El encabezado recibe `items`, `title` y
una `description` opcional; una miga con `href` navega y una con `action` emite `activate`.
La barra de filtros solo ordena los campos proyectados. El stepper recibe `steps` y `active`, y emite `stepChange`.
La confirmación recibe `message` y `details`, y emite `confirmed` o `cancelled`. La tabla recibe `columns` y `rows`. Con `totalItems` muestra esa página tal cual
y se controla con `pageIndex` y `selectedPageSize`. Una columna `kind: 'switch'`
emite `toggle`. Expone `sortChange`, `pageChange`, `edit`, `remove` y `reset`. Los campos exponen `model()` para el binding bidireccional
`[(value)]`; un formulario conectado a backend añadirá su Adapter y validación
de dominio en la feature correspondiente.
