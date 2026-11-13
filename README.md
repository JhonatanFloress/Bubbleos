# PAPEL OS

Escritorio web inspirado en Windows Aero. HTML, CSS y JavaScript, sin dependencias externas de desarrollo.

## Empezar

Necesitas Node.js 18 o posterior. Abre **esta carpeta `retro-os`** en VS Code y ejecuta:

```sh
npm run dev
```

Abre http://localhost:4173. No hace falta `npm install`. Después de editar, recarga el navegador.

```sh
npm run check    # Comprueba rutas y sintaxis de todos los scripts
npm run build    # Genera dist a partir de src
npm run preview  # Sirve dist en http://localhost:4174
```

Para otro puerto: `npm run dev -- --port 5000`.

## Organización

```text
retro-os/
├── src/
│   ├── index.html              # Estructura y orden de carga
│   ├── js/
│   │   ├── core/               # Registro de apps, ventanas y utilidades base
│   │   ├── apps/               # Notas, dibujo, documentos, juegos y terminal
│   │   ├── desktop/            # Iconos, cuadrícula, ventanas, bandeja y fondos
│   │   └── ui/                 # Iconos SVG, animaciones, Inicio y Explorador
│   └── styles/
│       ├── base/               # Base visual y escritorio original
│       ├── shell/              # Ventanas, Aero, Inicio y barra de tareas
│       └── apps/               # Estilos de las aplicaciones
├── scripts/                    # Servidor local, validación y generación
├── dist/                       # Salida generada; no editar directamente
├── .openai/hosting.json         # Identidad y configuración del sitio publicado
├── .vscode/settings.json        # Oculta la salida generada en el editor
├── package.json
└── README.md
```

## Dónde cambiar cada cosa

| Quieres editar | Archivo o carpeta |
| --- | --- |
| HTML y orden de carga | `src/index.html` |
| Ventanas y registro base de apps | `src/js/core/runtime.js` |
| Terminal sencilla activa | `src/js/apps/terminal.js` |
| Notas, dibujo y filtros de pendientes | `src/js/apps/editor-tools.js` |
| Archivos locales y reloj | `src/js/apps/files-and-clock.js` |
| Documentos, presupuesto y Snake | `src/js/apps/documents-budget-snake.js` |
| Arrastre y acomodo de iconos | `src/js/desktop/icon-layout.js` y `icon-grid.js` |
| Colores, fondo y galería | `src/js/desktop/personalization.js` |
| Bandeja de sistema | `src/js/desktop/system-tray.js` |
| Ajuste y vista de ventanas | `src/js/desktop/window-manager.js` |
| Menú Inicio | `src/js/ui/start-menu.js` y `src/styles/shell/start-menu.css` |
| Explorador | `src/js/ui/explorer.js` y `src/styles/apps/explorer.css` |

## Cómo se carga la aplicación

Los scripts son clásicos y comparten el contexto global. `src/index.html` declara su orden: primero el núcleo, después las apps y por último las extensiones visuales. Algunas extensiones envuelven funciones anteriores (`setup`, `body`, `openApp`); conserva ese orden al mover o añadir archivos. Esta reorganización mantiene el comportamiento existente: no convierte todavía la aplicación a módulos ES.

Los estilos también mantienen su orden original para preservar la cascada. Las capas de estilo se separan por responsabilidad; `shell/start-menu.css` y `apps/explorer.css` se cargan al final.

## Datos y publicación

Las preferencias y documentos se guardan en el navegador; los archivos importados usan IndexedDB. No cambies las claves `papel-*` para conservar los datos existentes. El respaldo dentro de la app no incluye imágenes ni dibujos.

`npm run build` reemplaza **únicamente `dist`** con una copia de `src`. Edita siempre `src`; `dist` está oculto en VS Code para evitar confusiones. El hosting sigue sirviendo `dist` según `.openai/hosting.json`.
