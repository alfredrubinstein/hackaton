/**
 * Algoritmos de odometría diferencial
 * Calcula posición y orientación basándose en encoders de ruedas
 */

export class OdometryAlgorithm {
  constructor(config = {}) {
    // Parámetros físicos del robot
    this.wheelDiameter = config.wheelDiameter || 6.5; // cm
    this.wheelbase = config.wheelbase || 15.0; // cm (distancia entre ruedas)
    this.encoderPulsesPerRevolution = config.encoderPulsesPerRevolution || 20;
    
    // Calcular constantes
    this.wheelCircumference = Math.PI * this.wheelDiameter;
    this.cmPerPulse = this.wheelCircumference / this.encoderPulsesPerRevolution;
    
    // Estado inicial
    this.reset();
  }

  /**
   * Resetea la odometría
   */
  reset() {
    this.x = 0.0;
    this.y = 0.0;
    this.theta = 0.0;
    this.lastLeftCount = 0;
    this.lastRightCount = 0;
  }

  /**
   * Actualiza la posición usando odometría diferencial
   * @param {number} leftCount - Contador de encoder izquierdo
   * @param {number} rightCount - Contador de encoder derecho
   * @returns {Object} Nueva posición {x, y, theta}
   */
  update(leftCount, rightCount) {
    // Calcular diferencia de pulsos
    const deltaLeft = leftCount - this.lastLeftCount;
    const deltaRight = rightCount - this.lastRightCount;
    
    // Convertir pulsos a distancia (cm)
    const distanceLeft = deltaLeft * this.cmPerPulse;
    const distanceRight = deltaRight * this.cmPerPulse;
    
    // Calcular distancia promedio y diferencia
    const distance = (distanceLeft + distanceRight) / 2.0;
    const deltaTheta = (distanceRight - distanceLeft) / this.wheelbase;
    
    // Actualizar orientación
    this.theta += deltaTheta;
    
    // Normalizar theta a [-PI, PI]
    while (this.theta > Math.PI) this.theta -= 2 * Math.PI;
    while (this.theta < -Math.PI) this.theta += 2 * Math.PI;
    
    // Actualizar posición
    this.x += distance * Math.cos(this.theta);
    this.y += distance * Math.sin(this.theta);
    
    // Guardar valores actuales
    this.lastLeftCount = leftCount;
    this.lastRightCount = rightCount;
    
    return {
      x: this.x,
      y: this.y,
      theta: this.theta
    };
  }

  /**
   * Calcula la velocidad lineal y angular
   * @param {number} leftCount - Contador actual izquierdo
   * @param {number} rightCount - Contador actual derecho
   * @param {number} deltaTime - Tiempo transcurrido en segundos
   * @returns {Object} {linearVelocity, angularVelocity}
   */
  calculateVelocities(leftCount, rightCount, deltaTime) {
    if (deltaTime <= 0) {
      return { linearVelocity: 0, angularVelocity: 0 };
    }
    
    const deltaLeft = leftCount - this.lastLeftCount;
    const deltaRight = rightCount - this.lastRightCount;
    
    const distanceLeft = deltaLeft * this.cmPerPulse;
    const distanceRight = deltaRight * this.cmPerPulse;
    
    const distance = (distanceLeft + distanceRight) / 2.0;
    const deltaTheta = (distanceRight - distanceLeft) / this.wheelbase;
    
    const linearVelocity = distance / deltaTime; // cm/s
    const angularVelocity = deltaTheta / deltaTime; // rad/s
    
    return { linearVelocity, angularVelocity };
  }

  /**
   * Estima el error acumulado de odometría
   * Basado en la distancia total recorrida
   */
  estimateError() {
    const totalDistance = Math.sqrt(this.x * this.x + this.y * this.y);
    
    // Error típico: 2-5% de la distancia recorrida
    const errorRate = 0.03; // 3%
    const estimatedError = totalDistance * errorRate;
    
    return {
      estimatedError,
      totalDistance,
      errorRate
    };
  }

  /**
   * Obtiene la posición actual
   */
  getPosition() {
    return {
      x: this.x,
      y: this.y,
      theta: this.theta
    };
  }
}

/**
 * Filtro de Kalman simple para mejorar precisión de odometría
 */
export class OdometryKalmanFilter {
  constructor() {
    // Estado: [x, y, theta]
    this.state = [0, 0, 0];
    
    // Covarianza del error
    this.P = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0.1]
    ];
    
    // Ruido del proceso
    this.Q = [
      [0.01, 0, 0],
      [0, 0.01, 0],
      [0, 0, 0.001]
    ];
    
    // Ruido de medición
    this.R = [
      [0.1, 0, 0],
      [0, 0.1, 0],
      [0, 0, 0.01]
    ];
  }

  /**
   * Predice el siguiente estado
   */
  predict(deltaX, deltaY, deltaTheta) {
    // Actualizar estado
    this.state[0] += deltaX;
    this.state[1] += deltaY;
    this.state[2] += deltaTheta;
    
    // Actualizar covarianza
    // P = P + Q (simplificado)
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        this.P[i][j] += this.Q[i][j];
      }
    }
  }

  /**
   * Actualiza con una medición
   */
  update(measurement) {
    // Calcular ganancia de Kalman
    const S = [
      [this.P[0][0] + this.R[0][0], 0, 0],
      [0, this.P[1][1] + this.R[1][1], 0],
      [0, 0, this.P[2][2] + this.R[2][2]]
    ];
    
    const K = [
      [this.P[0][0] / S[0][0], 0, 0],
      [0, this.P[1][1] / S[1][1], 0],
      [0, 0, this.P[2][2] / S[2][2]]
    ];
    
    // Actualizar estado
    this.state[0] += K[0][0] * (measurement.x - this.state[0]);
    this.state[1] += K[1][1] * (measurement.y - this.state[1]);
    this.state[2] += K[2][2] * (measurement.theta - this.state[2]);
    
    // Actualizar covarianza
    this.P[0][0] = (1 - K[0][0]) * this.P[0][0];
    this.P[1][1] = (1 - K[1][1]) * this.P[1][1];
    this.P[2][2] = (1 - K[2][2]) * this.P[2][2];
  }

  /**
   * Obtiene el estado filtrado
   */
  getState() {
    return {
      x: this.state[0],
      y: this.state[1],
      theta: this.state[2]
    };
  }
}

