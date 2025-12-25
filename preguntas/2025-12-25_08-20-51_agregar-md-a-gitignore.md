# Prompt: Agregar archivos .md a gitignore (excepto README.md)

**Fecha y hora de creación:** 2025-12-25 08:20:51

## Prompt Original
```
agrega a gitignore todo lo que sea .md menos READEME.md o readme.md.
```

## Tipo de Prompt
Solicitud de cambio/implementación

## Cambios Realizados

### 1. Actualización de .gitignore
- Se agregaron las siguientes reglas al archivo `.gitignore`:
  - `*.md` - Ignora todos los archivos con extensión .md
  - `!README.md` - Excepción: NO ignorar README.md (mayúsculas)
  - `!readme.md` - Excepción: NO ignorar readme.md (minúsculas)

### Explicación técnica:
En Git, el patrón `*.md` ignora todos los archivos .md, y luego las líneas que comienzan con `!` crean excepciones para archivos específicos que NO deben ser ignorados. Esto permite ignorar todos los archivos markdown excepto los README principales del proyecto.

## Archivos Afectados
- `.gitignore` - Se agregaron 3 líneas nuevas al final del archivo

## Notas
- Los archivos en la carpeta `preguntas/` ahora serán ignorados por Git
- Los archivos README.md y readme.md seguirán siendo rastreados por Git
- Esta regla aplica a todos los archivos .md en cualquier nivel del proyecto

