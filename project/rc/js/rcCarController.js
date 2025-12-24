/**
 * Controlador JavaScript para coche RC
 * Se comunica con Arduino vía Serial API (Web Serial API)
 * Calcula odometría y genera mapa 3D
 */

export class RCCarController {
  constructor() {
    this.port = null;
    this.reader = null;
    this.isConnected = false;
    this.isRunning = false;
    
    // Estado del coche
    this.position = { x: 0, y: 0, theta: 0 }; // cm y radianes
    this.encoderCounts = { left: 0, right: 0 };
    this.velocity = { left: 0, right: 0 }; // -255 a 255
    
    // Historial de posiciones para mapeo
    this.pathHistory = [];
    this.maxPathHistory = 1000;
    
    // Parámetros de odometría (deben coincidir con Arduino)
    this.wheelDiameter = 6.5; // cm
    this.wheelbase = 15.0; // cm
    this.encoderPulsesPerRevolution = 20;
    this.cmPerPulse = (Math.PI * this.wheelDiameter) / this.encoderPulsesPerRevolution;
    
    // Callbacks
    this.onPositionUpdate = null;
    this.onPathUpdate = null;
    this.onConnectionChange = null;
    
    // Detección de colisiones (límites de habitación)
    this.roomBounds = null;
    this.collisionDetected = false;
  }

  /**
   * Conecta con el Arduino vía Serial API
   */
  async connect() {
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API no está disponible. Usa Chrome/Edge.');
      }

      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      
      this.isConnected = true;
      this.startReading();
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
      
      return true;
    } catch (error) {
      console.error('Error conectando:', error);
      this.isConnected = false;
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }
      throw error;
    }
  }

  /**
   * Desconecta del Arduino
   */
  async disconnect() {
    this.isRunning = false;
    
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {
        // Ignorar errores al cancelar
      }
      this.reader = null;
    }
    
    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {
        // Ignorar errores al cerrar
      }
      this.port = null;
    }
    
    this.isConnected = false;
    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }

  /**
   * Inicia la lectura de datos del puerto serial
   */
  async startReading() {
    if (!this.port) return;
    
    this.isRunning = true;
    const decoder = new TextDecoder();
    
    let buffer = '';
    
    while (this.isRunning && this.port.readable) {
      try {
        this.reader = this.port.readable.getReader();
        
        while (this.isRunning) {
          const { value, done } = await this.reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Procesar líneas completas
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Guardar línea incompleta
          
          for (const line of lines) {
            if (line.trim()) {
              this.processSerialData(line.trim());
            }
          }
        }
      } catch (error) {
        if (this.isRunning) {
          console.error('Error leyendo serial:', error);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } finally {
        if (this.reader) {
          this.reader.releaseLock();
          this.reader = null;
        }
      }
    }
  }

  /**
   * Procesa datos recibidos del Arduino
   */
  processSerialData(data) {
    if (data.startsWith('ODOM:')) {
      // Formato: ODOM:X:Y:THETA:LEFT_COUNT:RIGHT_COUNT
      const parts = data.substring(5).split(':');
      if (parts.length >= 5) {
        this.position = {
          x: parseFloat(parts[0]),
          y: parseFloat(parts[1]),
          theta: parseFloat(parts[2])
        };
        
        this.encoderCounts = {
          left: parseInt(parts[3]),
          right: parseInt(parts[4])
        };
        
        // Agregar a historial de path
        this.addToPathHistory(this.position);
        
        // Verificar colisiones con límites
        this.checkCollisions();
        
        // Notificar actualización
        if (this.onPositionUpdate) {
          this.onPositionUpdate(this.position, this.encoderCounts);
        }
        
        if (this.onPathUpdate) {
          this.onPathUpdate(this.pathHistory);
        }
      }
    } else if (data === 'RC_CAR_READY') {
      console.log('Coche RC listo');
    } else if (data === 'ODOMETRY_RESET') {
      this.pathHistory = [];
      this.position = { x: 0, y: 0, theta: 0 };
    }
  }

  /**
   * Envía comando al Arduino
   */
  async sendCommand(command) {
    if (!this.port || !this.port.writable) {
      console.warn('Puerto serial no disponible');
      return;
    }
    
    try {
      const encoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      await writer.write(encoder.encode(command + '\n'));
      writer.releaseLock();
    } catch (error) {
      console.error('Error enviando comando:', error);
    }
  }

  /**
   * Controla el movimiento del coche
   * @param {number} left - Velocidad motor izquierdo (-255 a 255)
   * @param {number} right - Velocidad motor derecho (-255 a 255)
   */
  async move(left, right) {
    this.velocity = { left, right };
    await this.sendCommand(`MOVE:${left}:${right}`);
  }

  /**
   * Detiene el coche
   */
  async stop() {
    this.velocity = { left: 0, right: 0 };
    await this.sendCommand('STOP');
  }

  /**
   * Mueve hacia adelante
   */
  async forward(speed = 150) {
    await this.move(speed, speed);
  }

  /**
   * Mueve hacia atrás
   */
  async backward(speed = 150) {
    await this.move(-speed, -speed);
  }

  /**
   * Gira a la izquierda
   */
  async turnLeft(speed = 150) {
    await this.move(-speed, speed);
  }

  /**
   * Gira a la derecha
   */
  async turnRight(speed = 150) {
    await this.move(speed, -speed);
  }

  /**
   * Resetea la odometría
   */
  async resetOdometry() {
    await this.sendCommand('RESET');
    this.pathHistory = [];
    this.position = { x: 0, y: 0, theta: 0 };
  }

  /**
   * Establece los límites de la habitación para detección de colisiones
   */
  setRoomBounds(vertices) {
    if (!vertices || vertices.length < 3) {
      this.roomBounds = null;
      return;
    }
    
    // Calcular bounding box
    const xs = vertices.map(v => v.x);
    const ys = vertices.map(v => v.y);
    
    this.roomBounds = {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      vertices: vertices
    };
  }

  /**
   * Verifica si hay colisión con los límites de la habitación
   */
  checkCollisions() {
    if (!this.roomBounds) return;
    
    // Convertir posición de cm a metros (asumiendo que roomBounds está en metros)
    const posX = this.position.x / 100; // cm a metros
    const posY = this.position.y / 100;
    
    // Verificar si está dentro del polígono
    const isInside = this.isPointInPolygon(
      { x: posX, y: posY },
      this.roomBounds.vertices
    );
    
    if (!isInside) {
      this.collisionDetected = true;
      this.stop();
      
      // Retroceder un poco
      setTimeout(() => {
        this.backward(100);
        setTimeout(() => this.stop(), 200);
      }, 100);
    } else {
      this.collisionDetected = false;
    }
  }

  /**
   * Verifica si un punto está dentro de un polígono
   */
  isPointInPolygon(point, vertices) {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x;
      const yi = vertices[i].y;
      const xj = vertices[j].x;
      const yj = vertices[j].y;
      
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Agrega posición al historial de path
   */
  addToPathHistory(position) {
    this.pathHistory.push({
      x: position.x / 100, // Convertir cm a metros
      y: position.y / 100,
      theta: position.theta,
      timestamp: Date.now()
    });
    
    // Limitar tamaño del historial
    if (this.pathHistory.length > this.maxPathHistory) {
      this.pathHistory.shift();
    }
  }

  /**
   * Genera mapa 3D desde el path recorrido
   */
  generateMap3D() {
    if (this.pathHistory.length < 2) {
      return null;
    }
    
    // Calcular bounding box del path
    const xs = this.pathHistory.map(p => p.x);
    const ys = this.pathHistory.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // Generar vértices de la habitación estimada
    // Usar un margen alrededor del path recorrido
    const margin = 0.5; // metros
    
    const vertices = [
      { x: minX - margin, y: minY - margin },
      { x: maxX + margin, y: minY - margin },
      { x: maxX + margin, y: maxY + margin },
      { x: minX - margin, y: maxY + margin }
    ];
    
    // Generar SVG path
    const svgPath = `M ${vertices[0].x},${vertices[0].y} L ${vertices[1].x},${vertices[1].y} L ${vertices[2].x},${vertices[2].y} L ${vertices[3].x},${vertices[3].y} Z`;
    
    return {
      vertices,
      svgPath,
      pathHistory: this.pathHistory,
      estimatedArea: (maxX - minX) * (maxY - minY)
    };
  }
}

