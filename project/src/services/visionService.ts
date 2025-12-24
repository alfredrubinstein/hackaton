/**
 * Servicio para analizar imágenes usando Google Cloud Vision API
 * Extrae información sobre habitaciones, geometría e instalaciones
 */

export interface VisionAnalysisResult {
  geometry: {
    vertices: Array<{ x: number; y: number }>;
    estimatedWidth: number;
    estimatedDepth: number;
    estimatedHeight: number;
  };
  installations: Array<{
    type: 'door' | 'window' | 'power_point';
    position: { x: number; y: number; z?: number } | { start: { x: number; y: number }; end: { x: number; y: number } };
    subtype: string;
    confidence: number;
  }>;
  detectedObjects: Array<{
    label: string;
    confidence: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>;
}

export interface PhotoAnalysisRequest {
  imageData: string; // Base64 encoded image
  imageType: 'file' | 'camera';
}

class VisionService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY || null;
  }

  /**
   * Analiza una imagen usando Google Cloud Vision API
   * Nota: En producción, esto debería hacerse desde un backend por seguridad
   */
  async analyzeImage(imageData: string): Promise<VisionAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('Google Vision API key no configurada. Por favor, configura VITE_GOOGLE_VISION_API_KEY en tu archivo .env');
    }

    try {
      // Convertir base64 a formato que Vision API acepta
      const base64Data = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Data,
                },
                features: [
                  { type: 'LABEL_DETECTION', maxResults: 50 },
                  { type: 'OBJECT_LOCALIZATION', maxResults: 50 },
                  { type: 'TEXT_DETECTION', maxResults: 50 },
                  { type: 'IMAGE_PROPERTIES' },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Error de Vision API: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      return this.processVisionResponse(data);
    } catch (error: any) {
      console.error('Error analizando imagen:', error);
      throw new Error(`Error al analizar imagen: ${error.message}`);
    }
  }

  /**
   * Analiza múltiples imágenes y combina los resultados
   */
  async analyzeMultipleImages(images: PhotoAnalysisRequest[]): Promise<VisionAnalysisResult> {
    const results = await Promise.all(
      images.map(img => this.analyzeImage(img.imageData))
    );

    // Combinar resultados de múltiples fotos
    return this.combineResults(results);
  }

  /**
   * Procesa la respuesta de Vision API y extrae información relevante
   */
  private processVisionResponse(apiResponse: any): VisionAnalysisResult {
    const response = apiResponse.responses?.[0];
    if (!response) {
      throw new Error('Respuesta inválida de Vision API');
    }

    const labels = response.labelAnnotations || [];
    const objects = response.localizedObjectAnnotations || [];
    const textAnnotations = response.textAnnotations || [];

    // Detectar instalaciones
    const installations = this.detectInstallations(labels, objects, textAnnotations);

    // Estimar geometría de la habitación
    const geometry = this.estimateRoomGeometry(objects, labels);

    // Detectar objetos para referencia de escala
    const detectedObjects = objects.map((obj: any) => ({
      label: obj.name,
      confidence: obj.score,
      boundingBox: this.normalizeBoundingBox(obj.boundingPoly),
    }));

    return {
      geometry,
      installations,
      detectedObjects,
    };
  }

  /**
   * Detecta puertas, ventanas y puntos de energía en la imagen
   */
  private detectInstallations(
    labels: any[],
    objects: any[],
    textAnnotations: any[]
  ): VisionAnalysisResult['installations'] {
    const installations: VisionAnalysisResult['installations'] = [];

    // Buscar puertas
    const doorLabels = labels.filter(
      label =>
        label.description?.toLowerCase().includes('door') &&
        label.score > 0.7
    );
    const doorObjects = objects.filter(
      obj => obj.name?.toLowerCase().includes('door') && obj.score > 0.6
    );

    doorLabels.forEach((label, index) => {
      installations.push({
        type: 'door',
        position: { x: 0, y: 0 }, // Se calculará basado en bounding box
        subtype: 'hinged',
        confidence: label.score,
      });
    });

    doorObjects.forEach((obj) => {
      const bbox = this.normalizeBoundingBox(obj.boundingPoly);
      installations.push({
        type: 'door',
        position: {
          start: { x: bbox.x, y: bbox.y },
          end: { x: bbox.x + bbox.width, y: bbox.y },
        },
        subtype: 'hinged',
        confidence: obj.score,
      });
    });

    // Buscar ventanas
    const windowLabels = labels.filter(
      label =>
        (label.description?.toLowerCase().includes('window') ||
          label.description?.toLowerCase().includes('glass')) &&
        label.score > 0.7
    );
    const windowObjects = objects.filter(
      obj =>
        (obj.name?.toLowerCase().includes('window') ||
          obj.name?.toLowerCase().includes('glass')) &&
        obj.score > 0.6
    );

    windowLabels.forEach((label) => {
      installations.push({
        type: 'window',
        position: { x: 0, y: 0 },
        subtype: 'fixed',
        confidence: label.score,
      });
    });

    windowObjects.forEach((obj) => {
      const bbox = this.normalizeBoundingBox(obj.boundingPoly);
      installations.push({
        type: 'window',
        position: {
          start: { x: bbox.x, y: bbox.y },
          end: { x: bbox.x + bbox.width, y: bbox.y },
        },
        subtype: 'fixed',
        confidence: obj.score,
      });
    });

    // Buscar puntos de energía (enchufes, interruptores)
    const powerLabels = labels.filter(
      label =>
        (label.description?.toLowerCase().includes('outlet') ||
          label.description?.toLowerCase().includes('socket') ||
          label.description?.toLowerCase().includes('switch')) &&
        label.score > 0.6
    );

    powerLabels.forEach((label) => {
      installations.push({
        type: 'power_point',
        position: { x: 0, y: 0.3, z: 0 },
        subtype: 'wall-mounted',
        confidence: label.score,
      });
    });

    return installations;
  }

  /**
   * Estima la geometría de la habitación basándose en objetos detectados
   */
  private estimateRoomGeometry(objects: any[], labels: any[]): VisionAnalysisResult['geometry'] {
    // Por defecto, asumimos una habitación rectangular estándar
    // En una implementación más avanzada, se usaría detección de profundidad o múltiples fotos
    const defaultVertices = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 4 },
      { x: 0, y: 4 },
    ];

    // Intentar detectar objetos de referencia para escala
    const doorObjects = objects.filter(
      obj => obj.name?.toLowerCase().includes('door') && obj.score > 0.6
    );

    // Si detectamos una puerta, podemos usarla como referencia (puertas estándar ~2m de alto)
    let scaleFactor = 1.0;
    if (doorObjects.length > 0) {
      const doorBbox = this.normalizeBoundingBox(doorObjects[0].boundingPoly);
      // Asumir que una puerta ocupa aproximadamente el 30-40% de la altura de la imagen
      // y que una puerta real mide ~2m
      scaleFactor = 2.0 / (doorBbox.height * 0.35); // Ajuste empírico
    }

    // Estimar dimensiones basadas en objetos detectados
    let estimatedWidth = 5.0;
    let estimatedDepth = 4.0;

    if (objects.length > 0) {
      // Calcular bounding box de todos los objetos
      const allX: number[] = [];
      const allY: number[] = [];

      objects.forEach((obj) => {
        const bbox = this.normalizeBoundingBox(obj.boundingPoly);
        allX.push(bbox.x, bbox.x + bbox.width);
        allY.push(bbox.y, bbox.y + bbox.height);
      });

      if (allX.length > 0 && allY.length > 0) {
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const minY = Math.min(...allY);
        const maxY = Math.max(...allY);

        estimatedWidth = (maxX - minX) * scaleFactor * 1.5; // Factor de expansión
        estimatedDepth = (maxY - minY) * scaleFactor * 1.5;
      }
    }

    // Generar vértices basados en dimensiones estimadas
    const vertices = [
      { x: 0, y: 0 },
      { x: estimatedWidth, y: 0 },
      { x: estimatedWidth, y: estimatedDepth },
      { x: 0, y: estimatedDepth },
    ];

    return {
      vertices,
      estimatedWidth,
      estimatedDepth,
      estimatedHeight: 2.6, // Altura estándar
    };
  }

  /**
   * Normaliza un bounding box de Vision API a formato {x, y, width, height}
   */
  private normalizeBoundingBox(boundingPoly: any): { x: number; y: number; width: number; height: number } {
    if (!boundingPoly?.normalizedVertices || boundingPoly.normalizedVertices.length < 2) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const vertices = boundingPoly.normalizedVertices;
    const xs = vertices.map((v: any) => v.x);
    const ys = vertices.map((v: any) => v.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Combina resultados de múltiples fotos para mayor precisión
   */
  private combineResults(results: VisionAnalysisResult[]): VisionAnalysisResult {
    // Combinar instalaciones de todas las fotos
    const allInstallations = results.flatMap(r => r.installations);
    
    // Eliminar duplicados basados en tipo y posición similar
    const uniqueInstallations = this.deduplicateInstallations(allInstallations);

    // Usar la geometría más confiable (la que tenga más objetos detectados)
    const bestGeometry = results.reduce((best, current) => {
      return current.detectedObjects.length > best.detectedObjects.length
        ? current.geometry
        : best.geometry;
    }, results[0].geometry);

    // Combinar todos los objetos detectados
    const allObjects = results.flatMap(r => r.detectedObjects);

    return {
      geometry: bestGeometry,
      installations: uniqueInstallations,
      detectedObjects: allObjects,
    };
  }

  /**
   * Elimina instalaciones duplicadas basándose en similitud
   */
  private deduplicateInstallations(
    installations: VisionAnalysisResult['installations']
  ): VisionAnalysisResult['installations'] {
    const unique: VisionAnalysisResult['installations'] = [];
    const seen = new Set<string>();

    installations.forEach((inst) => {
      const key = `${inst.type}-${JSON.stringify(inst.position)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(inst);
      }
    });

    return unique;
  }
}

export const visionService = new VisionService();

