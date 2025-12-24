# Sistema de Control y Mapeo para Coches RC

Este sistema permite controlar un coche RC con Arduino y generar mapas 3D de habitaciones usando odometría basada en encoders de ruedas.

## Estructura del Proyecto

```
rc/
├── arduino/
│   └── rc_car.ino          # Código Arduino para control del coche
├── js/
│   ├── rcCarController.js   # Controlador JavaScript principal
│   ├── odometryAlgorithm.js # Algoritmos de odometría
│   └── mapGenerator.js     # Generador de mapas 3D
├── components/
│   └── RCCarControlPanel.tsx # Panel de control React
└── README.md               # Este archivo
```

## Hardware Requerido

### Componentes Básicos
- Arduino Uno/Nano o compatible
- 2 motores DC con encoders
- Driver de motores L298N o similar
- Módulo Bluetooth/WiFi (opcional, para control inalámbrico)
- Fuente de alimentación adecuada (batería o adaptador)

### Conexiones Arduino

#### Motores
- **Motor Izquierdo:**
  - ENA → Pin 5 (PWM)
  - IN1 → Pin 6
  - IN2 → Pin 7
  - Encoder A → Pin 2 (Interrupción)
  - Encoder B → Pin 4

- **Motor Derecho:**
  - ENB → Pin 10 (PWM)
  - IN3 → Pin 8
  - IN4 → Pin 9
  - Encoder A → Pin 3 (Interrupción)
  - Encoder B → Pin 11

## Configuración

### 1. Cargar Código Arduino

1. Abre `arduino/rc_car.ino` en Arduino IDE
2. Ajusta las constantes según tu hardware:
   - `WHEEL_DIAMETER`: Diámetro de tus ruedas en cm
   - `ENCODER_PULSES_PER_REVOLUTION`: Pulsos por vuelta de tu encoder
   - `WHEELBASE`: Distancia entre ruedas en cm
3. Sube el código al Arduino

### 2. Configurar JavaScript

Ajusta los parámetros en `rcCarController.js` para que coincidan con Arduino:

```javascript
this.wheelDiameter = 6.5; // cm
this.wheelbase = 15.0; // cm
this.encoderPulsesPerRevolution = 20;
```

### 3. Integrar en la Aplicación

```typescript
import { RCCarControlPanel } from './rc/components/RCCarControlPanel';

// En tu componente
<RCCarControlPanel
  onMapGenerated={(mapData) => {
    // Crear habitación desde mapa generado
    createRoomFromMap(mapData);
  }}
  roomVertices={currentRoom?.vertices}
/>
```

## Uso

### 1. Conectar con Arduino

1. Abre la aplicación en Chrome/Edge (requiere Web Serial API)
2. Haz clic en "Conectar con Arduino"
3. Selecciona el puerto COM del Arduino

### 2. Controlar el Coche

- **Teclado:**
  - `W` / `↑`: Adelante
  - `S` / `↓`: Atrás
  - `A` / `←`: Girar izquierda
  - `D` / `→`: Girar derecha
  - Suelta la tecla para detener

- **Botones:** Usa los botones en pantalla o mantén presionado

### 3. Mapear Habitación

1. Haz clic en "Iniciar Mapeo"
2. Conduce el coche por los límites de la habitación
3. El sistema registra automáticamente el path
4. Haz clic en "Generar Mapa 3D" cuando termines
5. El mapa se creará en el visor 3D

## Algoritmos de Odometría

### Odometría Diferencial

El sistema usa odometría diferencial para calcular la posición:

```
distance = (distanceLeft + distanceRight) / 2
deltaTheta = (distanceRight - distanceLeft) / wheelbase
x += distance * cos(theta)
y += distance * sin(theta)
theta += deltaTheta
```

### Precisión

- **Error típico:** 2-5% de la distancia recorrida
- **Factores que afectan:**
  - Deslizamiento de ruedas
  - Desgaste de ruedas
  - Superficie irregular
  - Calibración de encoders

### Mejoras Posibles

- Filtro de Kalman para reducir error acumulado
- Sensores adicionales (IMU, ultrasonido)
- SLAM (Simultaneous Localization and Mapping)
- Corrección con landmarks o marcas

## Generación de Mapas

### Algoritmos Disponibles

1. **Simple Bounding Box:** Rectángulo alrededor del path
2. **Convex Hull:** Polígono convexo mínimo
3. **Wall Detection:** Detecta paredes por cambios de dirección

### Formato de Salida

El mapa generado es compatible con el formato `Room`:

```typescript
{
  name: string;
  svg_path: string;
  vertices: Array<{x: number, y: number}>;
  wall_height: number;
  pathHistory: Array<{x, y, theta, timestamp}>;
}
```

## Detección de Colisiones

El sistema puede detectar cuando el coche sale de los límites de la habitación:

1. Define los vértices de la habitación
2. El sistema verifica continuamente si la posición está dentro
3. Si sale, detiene el coche y retrocede

## Solución de Problemas

### Arduino no se conecta
- Verifica que el puerto COM esté disponible
- Asegúrate de usar Chrome/Edge (Web Serial API)
- Revisa la velocidad de baudios (115200)

### Odometría imprecisa
- Calibra los parámetros (diámetro, wheelbase)
- Verifica que los encoders funcionen correctamente
- Asegúrate de que las ruedas no patinen

### Mapa no se genera
- Verifica que hayas recorrido suficiente distancia
- Asegúrate de que el mapeo esté activo
- Revisa la consola del navegador para errores

## Limitaciones

- La precisión depende de la calidad de los encoders
- El error se acumula con la distancia
- Requiere superficie plana para mejor precisión
- No detecta obstáculos, solo sigue límites

## Próximas Mejoras

- [ ] Integración con sensores de distancia (ultrasonido/LIDAR)
- [ ] SLAM completo para mapeo más preciso
- [ ] Corrección de deriva usando landmarks
- [ ] Control autónomo para mapeo automático
- [ ] Visualización en tiempo real del path en 3D

