# Documentación del Sistema RC

## Visión General

El sistema RC permite controlar un coche robot con Arduino y generar mapas 3D de habitaciones mediante odometría basada en encoders de ruedas.

## Arquitectura

```
Arduino (rc_car.ino)
    ↓ (Serial Communication)
rcCarController.js (Web Serial API)
    ↓
RCCarControlPanel.tsx (UI React)
    ↓
App.tsx (Integración)
```

## Componentes

### 1. Arduino (rc_car.ino)
**Responsabilidad**: Control de hardware del coche RC.

**Funcionalidades**:
- Control de motores DC con PWM
- Lectura de encoders en ambas ruedas
- Cálculo de odometría (posición y orientación)
- Comunicación serial con JavaScript
- Detección de comandos de movimiento

**Protocolo Serial**:
- Envía: `ODOM:X:Y:THETA:LEFT_COUNT:RIGHT_COUNT`
- Recibe: `MOVE:LEFT:RIGHT`, `STOP`, `RESET`

### 2. rcCarController.js
**Responsabilidad**: Controlador JavaScript que se comunica con Arduino.

**Clase**: `RCCarController`

**Métodos Principales**:
- `connect()`: Conecta vía Web Serial API
- `disconnect()`: Desconecta del Arduino
- `move(left, right)`: Controla velocidad de motores
- `forward(speed)`, `backward(speed)`, `turnLeft(speed)`, `turnRight(speed)`: Movimientos predefinidos
- `resetOdometry()`: Resetea posición a (0,0,0)
- `generateMap3D()`: Genera mapa desde path recorrido

**Odometría**:
Calcula posición usando:
- Conteo de pulsos de encoder
- Diámetro de rueda
- Distancia entre ruedas (wheelbase)
- Fórmulas de odometría diferencial

**Parámetros Configurables**:
```javascript
this.wheelDiameter = 6.5; // cm
this.wheelbase = 15.0; // cm
this.encoderPulsesPerRevolution = 20;
```

### 3. RCCarControlPanel.tsx
**Responsabilidad**: Interfaz React para controlar el coche RC.

**Funcionalidades**:
- Botones de control (adelante, atrás, izquierda, derecha)
- Indicador de conexión
- Visualización de posición actual
- Generación de mapa desde path recorrido
- Integración con sistema de habitaciones

**Props**:
```typescript
interface RCCarControlPanelProps {
  onMapGenerated?: (mapData: {
    name: string;
    svg_path: string;
    vertices: Vertex[];
    wall_height: number;
  }) => void;
  roomVertices?: Array<{ x: number; y: number }>;
}
```

## Flujo de Funcionamiento

### 1. Conexión
```
Usuario hace clic en "Conectar"
    ↓
RCCarController.connect()
    ↓
Web Serial API solicita puerto
    ↓
Arduino envía "RC_CAR_READY"
    ↓
Conexión establecida
```

### 2. Movimiento
```
Usuario presiona botón de movimiento
    ↓
RCCarControlPanel → RCCarController.move(left, right)
    ↓
Comando serial enviado a Arduino
    ↓
Arduino mueve motores
    ↓
Encoders envían pulsos
    ↓
Arduino calcula odometría
    ↓
Arduino envía ODOM:X:Y:THETA
    ↓
RCCarController actualiza posición
    ↓
UI se actualiza
```

### 3. Generación de Mapa
```
Usuario hace clic en "Generar Mapa"
    ↓
RCCarController.generateMap3D()
    ↓
Calcula bounding box del path
    ↓
Genera vértices de habitación estimada
    ↓
Crea SVG path
    ↓
onMapGenerated callback
    ↓
App.tsx crea nueva habitación
```

## Hardware Requerido

### Componentes
- Arduino Uno/Nano
- 2 motores DC con encoders
- Driver L298N o similar
- Fuente de alimentación
- Opcional: Bluetooth/WiFi para control inalámbrico

### Conexiones Arduino
Ver `rc/README.md` para detalles completos de conexiones.

## Configuración

### Arduino
Ajustar en `rc_car.ino`:
- `WHEEL_DIAMETER`: Diámetro de ruedas en cm
- `ENCODER_PULSES_PER_REVOLUTION`: Pulsos por vuelta
- `WHEELBASE`: Distancia entre ruedas en cm

### JavaScript
Ajustar en `rcCarController.js` para que coincida con Arduino.

## Limitaciones

1. **Precisión**: La odometría acumula error con el tiempo
2. **Deriva**: Sin corrección externa (GPS, landmarks), la posición puede desviarse
3. **Superficie**: Funciona mejor en superficies planas y uniformes
4. **Navegador**: Web Serial API solo disponible en Chrome/Edge

## Mejoras Futuras

1. Corrección de deriva usando landmarks visuales
2. SLAM (Simultaneous Localization and Mapping)
3. Integración con sensores adicionales (IMU, ultrasonido)
4. Control inalámbrico vía WiFi/Bluetooth

