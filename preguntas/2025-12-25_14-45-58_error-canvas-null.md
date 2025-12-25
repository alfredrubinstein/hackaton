# Prompt: Error mainCanvasRef.current es null

**Fecha y hora de creación:** 2025-12-25 14:45:58

## Prompt Original
MeasurementTool.tsx:153 [MeasurementTool] ERROR: mainCanvasRef.current es null

## Tipo de Prompt
Solicitud de cambio/implementación - Corrección de bug

## Análisis del Problema
El error indica que `mainCanvasRef.current` es `null` cuando se intenta cargar una imagen. Esto ocurre porque el canvas solo se renderiza cuando `hasImage` es `true`, pero necesitamos el canvas para cargar la imagen en primer lugar. Es un problema de orden de renderizado.

## Cambios Realizados

**Problema identificado:** El canvas (`mainCanvasRef`) solo se renderizaba cuando `hasImage` era `true`, pero necesitamos el canvas disponible para cargar la imagen en primer lugar. Esto causaba que `mainCanvasRef.current` fuera `null` cuando se intentaba cargar una imagen.

**Solución implementada (líneas 540-554):**
- El canvas ahora se renderiza siempre, pero se oculta visualmente cuando no hay imagen usando la clase `hidden`
- El placeholder visual (icono y texto) ahora se muestra como un overlay absoluto cuando `!hasImage`
- Esto asegura que el canvas esté disponible en el DOM cuando se llama a `loadImage()`

**Cambios específicos:**
- Canvas siempre renderizado con `ref={mainCanvasRef}`
- Clase condicional: `cursor-crosshair` cuando hay imagen, `hidden` cuando no hay
- Placeholder ahora es un overlay absoluto en lugar de reemplazar el canvas

## Respuesta

El error ocurría porque el canvas solo se renderizaba después de tener una imagen cargada, pero necesitamos el canvas para cargar la imagen. 

**Solución:** El canvas ahora está siempre renderizado en el DOM (pero oculto cuando no hay imagen), lo que permite que `mainCanvasRef.current` esté disponible cuando se intenta cargar una imagen.

El canvas se oculta visualmente cuando no hay imagen usando `hidden`, y el placeholder se muestra como overlay. Cuando se carga una imagen, el canvas se muestra y el placeholder desaparece.

