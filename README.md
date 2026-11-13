# PAPEL OS

Escritorio web inspirado en Windows Aero. HTML, CSS y JavaScript, con Prettier como única herramienta de desarrollo externa.

## Empezar

Necesitas Node.js 18 o posterior. Abre **esta carpeta `retro-os`** en VS Code y ejecuta:

```sh
npm run dev
```

Abre http://localhost:4173. Para instalar Prettier: `npm install`. El servidor y el build funcionan sin dependencias. Después de editar, recarga el navegador.

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

| Quieres editar                        | Archivo o carpeta                                             |
| ------------------------------------- | ------------------------------------------------------------- |
| HTML y orden de carga                 | `src/index.html`                                              |
| Ventanas y registro base de apps      | `src/js/core/runtime.js`                                      |
| Terminal sencilla activa              | `src/js/apps/terminal.js`                                     |
| Notas, dibujo y filtros de pendientes | `src/js/apps/editor-tools.js`                                 |
| Archivos locales y reloj              | `src/js/apps/files-and-clock.js`                              |
| Documentos, presupuesto y Snake       | `src/js/apps/documents-budget-snake.js`                       |
| Arrastre y acomodo de iconos          | `src/js/desktop/icon-layout.js` y `icon-grid.js`              |
| Colores, fondo y galería              | `src/js/desktop/personalization.js`                           |
| Bandeja de sistema                    | `src/js/desktop/system-tray.js`                               |
| Ajuste y vista de ventanas            | `src/js/desktop/window-manager.js`                            |
| Menú Inicio                           | `src/js/ui/start-menu.js` y `src/styles/shell/start-menu.css` |
| Explorador                            | `src/js/ui/explorer.js` y `src/styles/apps/explorer.css`      |

## Cómo se carga la aplicación

Los scripts son clásicos y comparten el contexto global. `src/index.html` declara su orden: primero el núcleo, después las apps y por último las extensiones visuales. Algunas extensiones envuelven funciones anteriores (`setup`, `body`, `openApp`); conserva ese orden al mover o añadir archivos. Esta reorganización mantiene el comportamiento existente: no convierte todavía la aplicación a módulos ES.

Los estilos también mantienen su orden original para preservar la cascada. Las capas de estilo se separan por responsabilidad; `shell/start-menu.css` y `apps/explorer.css` se cargan al final.

## Datos y publicación

Las preferencias y documentos se guardan en el navegador; los archivos importados usan IndexedDB. No cambies las claves `papel-*` para conservar los datos existentes. El respaldo dentro de la app no incluye imágenes ni dibujos.

`npm run build` reemplaza **únicamente `dist`** con una copia de `src`. Edita siempre `src`; `dist` está oculto en VS Code para evitar confusiones. El hosting sigue sirviendo `dist` según `.openai/hosting.json`.

## Formato del código

```sh
npm run format        # Formatea src, scripts, documentación y configuración
npm run format:check  # Comprueba el formato sin cambiar archivos
```

Prettier usa dos espacios y líneas de hasta 100 caracteres cuando la sintaxis lo permite. `dist` queda excluido: se regenera con `npm run build`. VS Code recomienda la extensión Prettier y aplica el formato al guardar si está instalada.

## Organización de archivos locales

En Explorador → Mis archivos puedes crear carpetas, buscar dentro de la carpeta actual, renombrar y mover archivos usando el menú `⋯`. La papelera de esta pestaña permite recuperar elementos sin borrarlos definitivamente. Las carpetas con contenido deben vaciarse moviendo sus archivos antes de enviarlas a la papelera.

Los elementos existentes sin carpeta aparecen en la raíz. Las carpetas y la papelera usan el mismo almacén IndexedDB; no se envían archivos a un servidor. La galería omite los archivos enviados a la papelera al actualizar su lista.

## Sonido de clic

`src/js/desktop/interface-sounds.js` genera un clic corto con Web Audio al activar botones. Configuración → Sonidos de la interfaz permite silenciarlo o ajustar el volumen; ambas preferencias se guardan localmente. El sonido se inicia tras una interacción del usuario, no durante el arranque ni al arrastrar iconos.

## Música local

`src/js/apps/music-player.js` implementa Media Player con archivos de audio guardados en IndexedDB. Permite importar hasta 10 MB por canción, reproducir/pausar, avanzar, retroceder, buscar una posición, ajustar volumen, repetir y usar modo aleatorio. Cerrar la ventana detiene el audio; minimizarla permite seguir escuchando. Los formatos dependen del navegador.

## Recordatorios

`src/js/apps/reminders.js` guarda avisos con fecha y hora en `papel-reminders`. Se pueden editar, posponer diez minutos, completar y reactivar. El sitio muestra un aviso interno y destaca el acceso de la barra de tareas cuando hay recordatorios vencidos. No usa notificaciones del sistema: requiere la pestaña abierta; al regresar muestra los vencidos guardados.
