# Prompt: Crear carpeta 'preguntas' con archivos para cada prompt

**Fecha y hora de creación:** 2025-12-25 08:19:00

## Prompt Original
```
crea una carpeta 'preguntas' donde crearas un archivo para cada promt que te haga. explicando lo que cambiaras si es que cambias algo, o respondiendo preguntas si es que el prompt es solo una pregunta. agregale tambien fecha y hora de creacion. ademas agrega como indicacion en un cursorrules crear estos archivos en esta carpeta cada vez que se te hace una pregunta
```

## Tipo de Prompt
Solicitud de cambio/implementación

## Cambios Realizados

### 1. Creación de carpeta 'preguntas'
- Se creó la carpeta `preguntas/` en la raíz del proyecto

### 2. Creación de archivo para este prompt
- Se creó el archivo `preguntas/2025-12-25_08-19-00_crear-carpeta-preguntas.md` con este contenido
- El nombre del archivo sigue el formato: `YYYY-MM-DD_HH-mm-ss_descripcion-corta.md`

### 3. Creación/Actualización de .cursorrules
- Se creó el archivo `.cursorrules` en la raíz del proyecto
- Se agregó una regla que indica que cada vez que se reciba un prompt (pregunta o solicitud), se debe crear automáticamente un archivo en la carpeta `preguntas/` con:
  - Fecha y hora de creación
  - El prompt original
  - Tipo de prompt (pregunta o solicitud de cambio)
  - Si es un cambio: explicación de los cambios realizados
  - Si es una pregunta: respuesta a la pregunta

## Estructura del Archivo de Pregunta
Cada archivo en la carpeta `preguntas/` seguirá este formato:
- **Título:** Descripción breve del prompt
- **Fecha y hora de creación**
- **Prompt Original:** El texto exacto del prompt recibido
- **Tipo de Prompt:** Pregunta o Solicitud de cambio/implementación
- **Cambios Realizados** (si aplica): Lista detallada de cambios
- **Respuesta** (si aplica): Respuesta a la pregunta

## Notas
- Los archivos se nombran con formato de fecha/hora para mantener un orden cronológico
- La descripción corta en el nombre del archivo ayuda a identificar rápidamente el contenido

