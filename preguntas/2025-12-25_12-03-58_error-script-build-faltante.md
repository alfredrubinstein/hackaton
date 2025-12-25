# Prompt: Error script "build" faltante

**Fecha y hora de creación:** 2025-12-25 12:03:58

## Prompt Original
El usuario señaló un error en PowerShell donde aparece el mensaje "Missing script: 'build'" al intentar ejecutar `npm run build`.

## Tipo de Prompt
Pregunta / Diagnóstico de problema

## Análisis del Problema

El error indica que npm no encuentra el script "build" en el package.json. Sin embargo, al revisar el archivo `package.json` del proyecto, el script "build" **SÍ existe** en la línea 8:

```json
"build": "vite build"
```

El problema es que el usuario está ejecutando el comando desde el directorio incorrecto. El error muestra:
- **Directorio actual:** `C:\Users\שלמה\Downloads\hackaton_23d`
- **Directorio del proyecto:** `C:\Users\שלמה\Downloads\hackaton_23d\project`

El comando `npm run build` debe ejecutarse desde el directorio que contiene el `package.json`, es decir, desde la carpeta `project`.

## Solución

El usuario debe cambiar al directorio del proyecto antes de ejecutar el comando:

```powershell
cd project
npm run build
```

O ejecutar el comando desde el directorio correcto en una sola línea:

```powershell
cd project; npm run build
```

## Respuesta

El script "build" ya existe en el package.json del proyecto. El problema es que el comando se está ejecutando desde el directorio padre (`hackaton_23d`) en lugar del directorio del proyecto (`project`). Es necesario navegar al directorio correcto antes de ejecutar el comando.

