/**
 * Generador de mapa 3D desde datos de odometría
 * Convierte el path recorrido en un modelo 3D de la habitación
 */

export class MapGenerator3D {
  constructor() {
    this.pathHistory = [];
    this.walls = [];
    this.obstacles = [];
  }

  /**
   * Agrega punto al path
   */
  addPathPoint(x, y, theta, timestamp = Date.now()) {
    this.pathHistory.push({ x, y, theta, timestamp });
  }

  /**
   * Genera mapa rectangular simple desde bounding box del path
   */
  generateSimpleMap(margin = 0.5) {
    if (this.pathHistory.length < 2) {
      return null;
    }
    
    const xs = this.pathHistory.map(p => p.x);
    const ys = this.pathHistory.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const vertices = [
      { x: minX - margin, y: minY - margin },
      { x: maxX + margin, y: minY - margin },
      { x: maxX + margin, y: maxY + margin },
      { x: minX - margin, y: maxY + margin }
    ];
    
    const svgPath = this.verticesToSvgPath(vertices);
    
    return {
      vertices,
      svgPath,
      wallHeight: 2.6, // Altura estándar
      pathHistory: [...this.pathHistory]
    };
  }

  /**
   * Genera mapa usando algoritmo de convex hull
   * Encuentra el polígono convexo más pequeño que contiene todo el path
   */
  generateConvexHullMap(margin = 0.3) {
    if (this.pathHistory.length < 3) {
      return this.generateSimpleMap(margin);
    }
    
    // Aplicar margen a cada punto
    const expandedPoints = this.pathHistory.map(p => ({
      x: p.x + (Math.random() - 0.5) * margin * 2,
      y: p.y + (Math.random() - 0.5) * margin * 2
    }));
    
    // Calcular convex hull usando algoritmo de Graham scan
    const hull = this.grahamScan(expandedPoints);
    
    const svgPath = this.verticesToSvgPath(hull);
    
    return {
      vertices: hull,
      svgPath,
      wallHeight: 2.6,
      pathHistory: [...this.pathHistory]
    };
  }

  /**
   * Algoritmo de Graham Scan para calcular convex hull
   */
  grahamScan(points) {
    if (points.length < 3) {
      return points;
    }
    
    // Encontrar punto más bajo (y más a la izquierda si hay empate)
    let bottom = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < points[bottom].y || 
          (points[i].y === points[bottom].y && points[i].x < points[bottom].x)) {
        bottom = i;
      }
    }
    
    // Intercambiar punto más bajo al inicio
    [points[0], points[bottom]] = [points[bottom], points[0]];
    
    // Ordenar puntos por ángulo polar respecto al punto más bajo
    const pivot = points[0];
    points.slice(1).sort((a, b) => {
      const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
      const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
      return angleA - angleB;
    });
    
    // Construir convex hull
    const hull = [points[0], points[1]];
    
    for (let i = 2; i < points.length; i++) {
      while (hull.length > 1 && this.crossProduct(
        hull[hull.length - 2],
        hull[hull.length - 1],
        points[i]
      ) <= 0) {
        hull.pop();
      }
      hull.push(points[i]);
    }
    
    return hull;
  }

  /**
   * Calcula producto cruzado para determinar orientación
   */
  crossProduct(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  /**
   * Genera mapa usando detección de paredes basada en cambios de dirección
   */
  generateWallDetectionMap(angleThreshold = Math.PI / 6) {
    if (this.pathHistory.length < 3) {
      return this.generateSimpleMap();
    }
    
    // Detectar cambios bruscos de dirección (posibles paredes)
    const wallPoints = [];
    
    for (let i = 1; i < this.pathHistory.length - 1; i++) {
      const prev = this.pathHistory[i - 1];
      const curr = this.pathHistory[i];
      const next = this.pathHistory[i + 1];
      
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      
      const angleDiff = Math.abs(angle2 - angle1);
      const normalizedDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
      
      if (normalizedDiff > angleThreshold) {
        wallPoints.push(curr);
      }
    }
    
    if (wallPoints.length < 3) {
      return this.generateConvexHullMap();
    }
    
    // Usar convex hull de los puntos de pared
    const hull = this.grahamScan(wallPoints);
    const svgPath = this.verticesToSvgPath(hull);
    
    return {
      vertices: hull,
      svgPath,
      wallHeight: 2.6,
      pathHistory: [...this.pathHistory],
      wallPoints
    };
  }

  /**
   * Convierte vértices a formato SVG path
   */
  verticesToSvgPath(vertices) {
    if (vertices.length === 0) return '';
    
    const pathParts = [`M ${vertices[0].x},${vertices[0].y}`];
    
    for (let i = 1; i < vertices.length; i++) {
      pathParts.push(`L ${vertices[i].x},${vertices[i].y}`);
    }
    
    pathParts.push('Z');
    return pathParts.join(' ');
  }

  /**
   * Resetea el generador
   */
  reset() {
    this.pathHistory = [];
    this.walls = [];
    this.obstacles = [];
  }

  /**
   * Exporta mapa en formato compatible con Room
   */
  exportToRoomFormat(roomName = 'Habitación Mapeada') {
    const map = this.generateConvexHullMap();
    
    if (!map) {
      return null;
    }
    
    return {
      name: roomName,
      svg_path: map.svgPath,
      vertices: map.vertices,
      wall_height: map.wallHeight,
      installations: [], // Se pueden agregar después
      pathHistory: map.pathHistory
    };
  }
}

