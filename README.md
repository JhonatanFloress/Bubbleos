# BubbleOs

Escritorio web de HTML, CSS y JavaScript. **`src/` es la aplicación completa**, tanto en desarrollo como en producción. No hay compilación, empaquetado ni generación de archivos.

## Desarrollo y comprobaciones

Node.js 18 o posterior se utiliza solo para el servidor local y las comprobaciones:

```sh
npm run dev       # http://localhost:4173, sirve src/
npm run preview   # http://localhost:4174, también sirve src/
npm run check     # rutas y sintaxis de los scripts
npm test          # configuración estática, recursos y servidor HTTP
```

No se necesita instalar dependencias para servir, comprobar o probar la aplicación. Para formatear el código, instala la única dependencia de desarrollo (Prettier):

```sh
npm ci
npm run format
npm run format:check
```

Puedes cambiar el puerto: `npm run dev -- --port 5000`. Recarga el navegador después de editar. No hay comando `build` porque el navegador recibe directamente los archivos de `src`.

## Estructura

```text
src/
  index.html
  js/
    core/       # núcleo y registro de aplicaciones
    apps/       # aplicaciones
    desktop/    # ventanas, iconos, almacenamiento y preferencias
    ui/         # interfaz, Inicio e iconos SVG
  styles/
    base/
    shell/
    apps/
scripts/
  dev.mjs       # servidor local, solo src/
  check.mjs     # validación sin generar archivos
tests/
  static-site.test.mjs
vercel.json
package.json
```

Los scripts son clásicos y comparten contexto global. Conserva su orden en `src/index.html`: las extensiones dependen del núcleo y de otras extensiones anteriores. El orden de las hojas CSS también forma parte del diseño. No se necesitan módulos de servidor, un framework o un bundler.

Los iconos SVG están incluidos en JavaScript. Los fondos personalizados, imágenes y audios importados usan archivos del navegador. La única referencia externa en CSS es Google Fonts; hay tipografías alternativas si la conexión no está disponible.

## Vercel: publicar directamente src

La configuración local es:

```json
{
  "framework": null,
  "buildCommand": "",
  "outputDirectory": "src",
  "installCommand": ""
}
```

En el proyecto de Vercel, usa:

| Ajuste           | Valor                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Root Directory   | Carpeta del repositorio donde están este README, package.json y vercel.json; `retro-os` si está anidada |
| Framework Preset | Other                                                                                                   |
| Build Command    | Vacío; sin `npm run build`                                                                              |
| Output Directory | `src`                                                                                                   |
| Install Command  | Vacío; se omite la instalación                                                                          |

Las cadenas vacías en `vercel.json` desactivan expresamente build e instalación. El archivo declara la configuración para el próximo despliegue; no modifica la configuración remota ni genera un despliegue por sí solo. No selecciones `src` como Root Directory si usas este `vercel.json`: `src` es la **Output Directory**.

Flujo: **editar src → commit/push manual a GitHub → Vercel sirve src**. El despliegue futuro depende de la integración Git configurada por el propietario. Verifica los ajustes existentes en Vercel antes de publicar; esta tarea no los cambia remotamente.

## Copia local anterior

`dist/` quedó fuera del seguimiento Git y de los archivos enviados a Vercel. Su copia local se conserva únicamente como copia antigua, hasta que autorices borrarla. Está ignorada por Git, Prettier y Vercel; ningún script la usa ni la regenera. También se mantiene oculta en VS Code para evitar editarla por error. Puedes verla cambiando `files.exclude.dist` a `false` en `.vscode/settings.json`.

## Datos existentes

Las claves internas `papel-*` y el nombre del almacén IndexedDB se conservan para mantener la compatibilidad. No se modificaron el código ni el diseño de la app al cambiar la arquitectura. Los datos guardados en el navegador están asociados a cada dominio y no se trasladan automáticamente a otro dominio.
