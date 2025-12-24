/**
 * Código Arduino para coche RC con odometría
 * Controla motores y lee encoders de las ruedas para mapeo
 * 
 * Hardware requerido:
 * - Arduino Uno/Nano o similar
 * - 2 motores DC con encoders
 * - Driver de motores (L298N o similar)
 * - Módulo Bluetooth/WiFi para comunicación (opcional)
 * 
 * Conexiones:
 * - Motor izquierdo: ENA, IN1, IN2, encoder A, encoder B
 * - Motor derecho: ENB, IN3, IN4, encoder A, encoder B
 */

// Pines para motor izquierdo
#define MOTOR_LEFT_ENA 5
#define MOTOR_LEFT_IN1 6
#define MOTOR_LEFT_IN2 7
#define ENCODER_LEFT_A 2  // Interrupción
#define ENCODER_LEFT_B 4

// Pines para motor derecho
#define MOTOR_RIGHT_ENA 10
#define MOTOR_RIGHT_IN1 8
#define MOTOR_RIGHT_IN2 9
#define ENCODER_RIGHT_A 3  // Interrupción
#define ENCODER_RIGHT_B 11

// Constantes de odometría
#define WHEEL_DIAMETER 6.5  // Diámetro de rueda en cm
#define WHEEL_CIRCUMFERENCE (PI * WHEEL_DIAMETER)  // Circunferencia en cm
#define ENCODER_PULSES_PER_REVOLUTION 20  // Pulsos por vuelta completa del encoder
#define WHEELBASE 15.0  // Distancia entre ruedas en cm
#define CM_PER_PULSE (WHEEL_CIRCUMFERENCE / ENCODER_PULSES_PER_REVOLUTION)

// Variables de encoders
volatile long encoderLeftCount = 0;
volatile long encoderRightCount = 0;
long lastEncoderLeftCount = 0;
long lastEncoderRightCount = 0;

// Variables de odometría
float x = 0.0;  // Posición X en cm
float y = 0.0;  // Posición Y en cm
float theta = 0.0;  // Orientación en radianes

// Variables de control
int leftSpeed = 0;   // Velocidad motor izquierdo (0-255)
int rightSpeed = 0;  // Velocidad motor derecho (0-255)
unsigned long lastOdometryUpdate = 0;
const unsigned long ODOMETRY_UPDATE_INTERVAL = 50;  // ms

// Buffer para comunicación serial
String serialBuffer = "";

void setup() {
  Serial.begin(115200);
  
  // Configurar pines de motores
  pinMode(MOTOR_LEFT_ENA, OUTPUT);
  pinMode(MOTOR_LEFT_IN1, OUTPUT);
  pinMode(MOTOR_LEFT_IN2, OUTPUT);
  pinMode(MOTOR_RIGHT_ENA, OUTPUT);
  pinMode(MOTOR_RIGHT_IN1, OUTPUT);
  pinMode(MOTOR_RIGHT_IN2, OUTPUT);
  
  // Configurar pines de encoders
  pinMode(ENCODER_LEFT_A, INPUT_PULLUP);
  pinMode(ENCODER_LEFT_B, INPUT_PULLUP);
  pinMode(ENCODER_RIGHT_A, INPUT_PULLUP);
  pinMode(ENCODER_RIGHT_B, INPUT_PULLUP);
  
  // Configurar interrupciones para encoders
  attachInterrupt(digitalPinToInterrupt(ENCODER_LEFT_A), encoderLeftISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENCODER_RIGHT_A), encoderRightISR, CHANGE);
  
  // Inicializar motores detenidos
  stopMotors();
  
  Serial.println("RC_CAR_READY");
  delay(1000);
}

void loop() {
  // Leer comandos seriales
  readSerialCommands();
  
  // Actualizar odometría
  updateOdometry();
  
  // Enviar datos periódicamente
  if (millis() - lastOdometryUpdate >= ODOMETRY_UPDATE_INTERVAL) {
    sendOdometryData();
    lastOdometryUpdate = millis();
  }
  
  delay(10);
}

/**
 * Interrupción para encoder izquierdo
 */
void encoderLeftISR() {
  int a = digitalRead(ENCODER_LEFT_A);
  int b = digitalRead(ENCODER_LEFT_B);
  
  if (a == b) {
    encoderLeftCount++;
  } else {
    encoderLeftCount--;
  }
}

/**
 * Interrupción para encoder derecho
 */
void encoderRightISR() {
  int a = digitalRead(ENCODER_RIGHT_A);
  int b = digitalRead(ENCODER_RIGHT_B);
  
  if (a == b) {
    encoderRightCount++;
  } else {
    encoderRightCount--;
  }
}

/**
 * Actualiza la posición del robot usando odometría diferencial
 */
void updateOdometry() {
  // Calcular diferencia de pulsos desde última actualización
  long deltaLeft = encoderLeftCount - lastEncoderLeftCount;
  long deltaRight = encoderRightCount - lastEncoderRightCount;
  
  // Convertir pulsos a distancia (cm)
  float distanceLeft = deltaLeft * CM_PER_PULSE;
  float distanceRight = deltaRight * CM_PER_PULSE;
  
  // Calcular distancia promedio y diferencia
  float distance = (distanceLeft + distanceRight) / 2.0;
  float deltaTheta = (distanceRight - distanceLeft) / WHEELBASE;
  
  // Actualizar orientación
  theta += deltaTheta;
  
  // Normalizar theta a [-PI, PI]
  while (theta > PI) theta -= 2 * PI;
  while (theta < -PI) theta += 2 * PI;
  
  // Actualizar posición
  x += distance * cos(theta);
  y += distance * sin(theta);
  
  // Guardar valores actuales
  lastEncoderLeftCount = encoderLeftCount;
  lastEncoderRightCount = encoderRightCount;
}

/**
 * Lee y procesa comandos desde el puerto serial
 * Formato: "CMD:VALUE" o "CMD:VALUE1:VALUE2"
 * Comandos:
 * - MOVE:LEFT:RIGHT - Control de motores (-255 a 255)
 * - STOP - Detener motores
 * - RESET - Resetear odometría
 */
void readSerialCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    
    if (c == '\n' || c == '\r') {
      if (serialBuffer.length() > 0) {
        processCommand(serialBuffer);
        serialBuffer = "";
      }
    } else {
      serialBuffer += c;
    }
  }
}

/**
 * Procesa un comando recibido
 */
void processCommand(String cmd) {
  if (cmd.startsWith("MOVE:")) {
    int colonIndex1 = cmd.indexOf(':', 5);
    int colonIndex2 = cmd.indexOf(':', colonIndex1 + 1);
    
    if (colonIndex1 > 0 && colonIndex2 > 0) {
      int left = cmd.substring(5, colonIndex1).toInt();
      int right = cmd.substring(colonIndex1 + 1, colonIndex2).toInt();
      setMotorSpeeds(left, right);
    }
  } else if (cmd == "STOP") {
    stopMotors();
  } else if (cmd == "RESET") {
    resetOdometry();
  } else if (cmd.startsWith("SPEED:")) {
    int speed = cmd.substring(6).toInt();
    setSpeed(speed);
  }
}

/**
 * Establece velocidades de ambos motores
 */
void setMotorSpeeds(int left, int right) {
  leftSpeed = constrain(left, -255, 255);
  rightSpeed = constrain(right, -255, 255);
  
  // Motor izquierdo
  if (leftSpeed > 0) {
    digitalWrite(MOTOR_LEFT_IN1, HIGH);
    digitalWrite(MOTOR_LEFT_IN2, LOW);
    analogWrite(MOTOR_LEFT_ENA, abs(leftSpeed));
  } else if (leftSpeed < 0) {
    digitalWrite(MOTOR_LEFT_IN1, LOW);
    digitalWrite(MOTOR_LEFT_IN2, HIGH);
    analogWrite(MOTOR_LEFT_ENA, abs(leftSpeed));
  } else {
    digitalWrite(MOTOR_LEFT_IN1, LOW);
    digitalWrite(MOTOR_LEFT_IN2, LOW);
    analogWrite(MOTOR_LEFT_ENA, 0);
  }
  
  // Motor derecho
  if (rightSpeed > 0) {
    digitalWrite(MOTOR_RIGHT_IN1, HIGH);
    digitalWrite(MOTOR_RIGHT_IN2, LOW);
    analogWrite(MOTOR_RIGHT_ENA, abs(rightSpeed));
  } else if (rightSpeed < 0) {
    digitalWrite(MOTOR_RIGHT_IN1, LOW);
    digitalWrite(MOTOR_RIGHT_IN2, HIGH);
    analogWrite(MOTOR_RIGHT_ENA, abs(rightSpeed));
  } else {
    digitalWrite(MOTOR_RIGHT_IN1, LOW);
    digitalWrite(MOTOR_RIGHT_IN2, LOW);
    analogWrite(MOTOR_RIGHT_ENA, 0);
  }
}

/**
 * Detiene ambos motores
 */
void stopMotors() {
  setMotorSpeeds(0, 0);
}

/**
 * Establece velocidad base (ambos motores igual)
 */
void setSpeed(int speed) {
  setMotorSpeeds(speed, speed);
}

/**
 * Resetea la odometría
 */
void resetOdometry() {
  x = 0.0;
  y = 0.0;
  theta = 0.0;
  encoderLeftCount = 0;
  encoderRightCount = 0;
  lastEncoderLeftCount = 0;
  lastEncoderRightCount = 0;
  Serial.println("ODOMETRY_RESET");
}

/**
 * Envía datos de odometría por serial
 * Formato: "ODOM:X:Y:THETA:LEFT_COUNT:RIGHT_COUNT"
 */
void sendOdometryData() {
  Serial.print("ODOM:");
  Serial.print(x, 2);
  Serial.print(":");
  Serial.print(y, 2);
  Serial.print(":");
  Serial.print(theta, 4);
  Serial.print(":");
  Serial.print(encoderLeftCount);
  Serial.print(":");
  Serial.print(encoderRightCount);
  Serial.println();
}

