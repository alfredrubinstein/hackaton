# Configuración de Google Cloud Vision API

Este proyecto utiliza Google Cloud Vision API para analizar fotos de habitaciones y generar automáticamente modelos 3D.

## Configuración

### 1. Obtener API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Vision:
   - Ve a "APIs & Services" > "Library"
   - Busca "Cloud Vision API"
   - Haz clic en "Enable"
4. Crea una API Key:
   - Ve a "APIs & Services" > "Credentials"
   - Haz clic en "Create Credentials" > "API Key"
   - Copia la API key generada

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_GOOGLE_VISION_API_KEY=tu_api_key_aqui
```

### 3. Restricciones de Seguridad (Recomendado)

Para mayor seguridad, restringe la API key:

1. En Google Cloud Console, ve a "APIs & Services" > "Credentials"
2. Haz clic en tu API key
3. En "API restrictions", selecciona "Restrict key"
4. Selecciona solo "Cloud Vision API"
5. En "Application restrictions", puedes agregar restricciones por dominio o IP

**Nota de Seguridad**: En producción, es altamente recomendable usar un backend para proteger la API key. Exponer la API key en el cliente puede resultar en uso no autorizado y costos inesperados.

## Uso

1. Haz clic en el botón de imagen (📷) en el header
2. Sube una o más fotos de la habitación desde diferentes ángulos
3. Haz clic en "Analizar Fotos con IA"
4. Revisa y ajusta los resultados generados
5. Confirma para crear la habitación en el visor 3D

## Limitaciones

- La precisión depende de la calidad y cantidad de fotos
- Las medidas son estimadas basándose en objetos de referencia (como puertas)
- Para mayor precisión, proporciona una medida de referencia conocida
- El análisis puede tomar varios segundos dependiendo del número de fotos

## Costos

Google Cloud Vision API tiene costos por uso. Consulta los [precios actuales](https://cloud.google.com/vision/pricing) antes de usar en producción.

