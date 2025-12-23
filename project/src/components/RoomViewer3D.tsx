import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import earcut from 'earcut';
import type { Room, Installation, MedicalEquipment, Position3D, Dimensions } from '../types';
import { calculateCentroid } from '../utils/geometry';
import type { EquipmentTemplate } from '../data/medicalEquipmentCatalog';

interface RoomViewer3DProps {
  room: Room;
  installations: Installation[];
  equipment: MedicalEquipment[];
  onEquipmentUpdate?: (id: string, position: Position3D) => void;
  onEquipmentDrop?: (equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function RoomViewer3D({ room, installations, equipment, onEquipmentUpdate, onEquipmentDrop }: RoomViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const roomBoundsRef = useRef<{ minX: number; maxX: number; minZ: number; maxZ: number } | null>(null);
  const roomCenterRef = useRef<{ x: number; z: number } | null>(null);
  const maxRadiusRef = useRef<number>(0);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Esperar a que el contenedor tenga dimensiones
    const checkDimensions = () => {
      if (!containerRef.current) return false;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      return width > 0 && height > 0;
    };

    if (!checkDimensions()) {
      // Esperar un frame para que el DOM se actualice
      requestAnimationFrame(() => {
        if (!checkDimensions()) {
          console.warn('Container has no dimensions, retrying...');
          setTimeout(() => {
            if (containerRef.current && checkDimensions()) {
              initializeRenderer();
            }
          }, 100);
          return;
        }
        initializeRenderer();
      });
      return;
    }

    initializeRenderer();

    function initializeRenderer() {
      if (!containerRef.current) return;

      // Limpiar renderer anterior si existe
      if (rendererRef.current) {
        try {
          rendererRef.current.dispose();
          const canvas = rendererRef.current.domElement;
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        } catch (err) {
          console.warn('Error cleaning up previous renderer:', err);
        }
        rendererRef.current = null;
      }

      // Limpiar cualquier elemento hijo del container
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }

      let renderer: THREE.WebGLRenderer;
      let camera: THREE.PerspectiveCamera;
      let scene: THREE.Scene;
      
      try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        sceneRef.current = scene;

        const width = containerRef.current.clientWidth || 800;
        const height = containerRef.current.clientHeight || 600;

        camera = new THREE.PerspectiveCamera(
          60,
          width / height,
          0.1,
          1000
        );
        cameraRef.current = camera;

        renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          powerPreference: "high-performance"
        });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
      } catch (error) {
        console.error('Error creating WebGL renderer:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = '<div class="p-4 text-red-600">Error al inicializar WebGL. Por favor, recarga la página.</div>';
        }
        setIsLoading(false);
        return;
      }

      // Verificar que las variables se crearon correctamente
      if (!camera || !renderer || !scene) {
        console.error('Failed to create WebGL components');
        setIsLoading(false);
        return;
      }

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 50;
      controls.maxPolarAngle = Math.PI / 2 - 0.1;
      controls.minPolarAngle = 0.1;
      controlsRef.current = controls;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 20, 10);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      const bounds = {
        minX: Math.min(...room.vertices.map(v => v.x)),
        maxX: Math.max(...room.vertices.map(v => v.x)),
        minZ: Math.min(...room.vertices.map(v => v.y)),
        maxZ: Math.max(...room.vertices.map(v => v.y))
      };
      roomBoundsRef.current = bounds;

      // Calcular el centro de la habitación
      const centroid = calculateCentroid(room.vertices);
      const center = { x: centroid.x, z: centroid.y };
      roomCenterRef.current = center;

      // Calcular el radio máximo: distancia desde el centro hasta el vértice más lejano
      let maxRadius = 0;
      room.vertices.forEach(v => {
        const dx = v.x - center.x;
        const dz = v.y - center.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance > maxRadius) {
          maxRadius = distance;
        }
      });
      // Añadir un margen para permitir que la cámara esté ligeramente fuera de las paredes
      maxRadiusRef.current = maxRadius + 3;

      createRoom(scene, room);
      createFloorGrid(scene, room, bounds);
      createInstallations(scene, installations, room.wall_height);
      createEquipment(scene, equipment);

      // Posicionar la cámara inicialmente dentro del radio permitido
      const initialDistance = Math.min(maxRadiusRef.current * 0.7, room.wall_height * 1.5);
      camera.position.set(center.x, room.wall_height * 0.8, center.z + initialDistance);
      camera.lookAt(center.x, room.wall_height / 2, center.z);
      controls.target.set(center.x, room.wall_height / 2, center.z);

      setIsLoading(false);

      let isMounted = true;

      const animate = () => {
        if (!isMounted || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
          return;
        }
        animationIdRef.current = requestAnimationFrame(animate);
        controls.update();

      // Restricción de altura: piso y techo
      const minHeight = 0.5;
      const maxHeight = room.wall_height - 0.2;
      if (camera.position.y < minHeight) {
        camera.position.y = minHeight;
      }
      if (camera.position.y > maxHeight) {
        camera.position.y = maxHeight;
      }

      // Restricción de radio circular alrededor del centro de la habitación
      if (roomCenterRef.current && maxRadiusRef.current > 0) {
        const dx = camera.position.x - roomCenterRef.current.x;
        const dz = camera.position.z - roomCenterRef.current.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > maxRadiusRef.current) {
          // Normalizar y limitar al radio máximo
          const ratio = maxRadiusRef.current / distance;
          camera.position.x = roomCenterRef.current.x + dx * ratio;
          camera.position.z = roomCenterRef.current.z + dz * ratio;
        }
      }

      // Limitar el target (punto de mira) para que siempre esté dentro del área de la habitación
      if (roomBoundsRef.current && roomCenterRef.current && maxRadiusRef.current > 0) {
        const target = controls.target;
        const targetDx = target.x - roomCenterRef.current.x;
        const targetDz = target.z - roomCenterRef.current.z;
        const targetDistance = Math.sqrt(targetDx * targetDx + targetDz * targetDz);
        
        // Limitar el target a un radio ligeramente menor que el máximo para asegurar que siempre apunte al área
        const targetMaxRadius = maxRadiusRef.current * 0.8;
        if (targetDistance > targetMaxRadius) {
          const ratio = targetMaxRadius / targetDistance;
          target.x = roomCenterRef.current.x + targetDx * ratio;
          target.z = roomCenterRef.current.z + targetDz * ratio;
        }

        // También asegurar que el target esté dentro de los límites rectangulares
        const margin = 1;
        if (target.x < roomBoundsRef.current.minX - margin) {
          target.x = roomBoundsRef.current.minX - margin;
        }
        if (target.x > roomBoundsRef.current.maxX + margin) {
          target.x = roomBoundsRef.current.maxX + margin;
        }
        if (target.z < roomBoundsRef.current.minZ - margin) {
          target.z = roomBoundsRef.current.minZ - margin;
        }
        if (target.z > roomBoundsRef.current.maxZ + margin) {
          target.z = roomBoundsRef.current.maxZ + margin;
        }

        // Limitar altura del target
        if (target.y < 0) {
          target.y = 0;
        }
        if (target.y > room.wall_height) {
          target.y = room.wall_height;
        }
      }

        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();

      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };
      window.addEventListener('resize', handleResize);

      const handleKeyDown = (e: KeyboardEvent) => {
      if (!cameraRef.current || !controlsRef.current) return;

      const moveSpeed = 2;
      const cam = cameraRef.current;
      const target = controlsRef.current.target;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          cam.position.z -= moveSpeed;
          target.z -= moveSpeed;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          cam.position.z += moveSpeed;
          target.z += moveSpeed;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          cam.position.x -= moveSpeed;
          target.x -= moveSpeed;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          cam.position.x += moveSpeed;
          target.x += moveSpeed;
          break;
      }

      // Aplicar restricciones después del movimiento
      if (roomCenterRef.current && maxRadiusRef.current > 0) {
        const dx = cam.position.x - roomCenterRef.current.x;
        const dz = cam.position.z - roomCenterRef.current.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > maxRadiusRef.current) {
          const ratio = maxRadiusRef.current / distance;
          cam.position.x = roomCenterRef.current.x + dx * ratio;
          cam.position.z = roomCenterRef.current.z + dz * ratio;
        }
      }

        setCameraPosition({ x: cam.position.x, y: cam.position.y, z: cam.position.z });
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        isMounted = false;
        
        // Detener el bucle de animación
        if (animationIdRef.current !== null) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
        
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        
        // Limpiar controls
        if (controlsRef.current) {
          controlsRef.current.dispose();
          controlsRef.current = null;
        }
        
        // Limpiar renderer
        if (rendererRef.current) {
          try {
            rendererRef.current.dispose();
            const canvas = rendererRef.current.domElement;
            if (canvas && canvas.parentNode) {
              canvas.parentNode.removeChild(canvas);
            }
          } catch (err) {
            console.warn('Error disposing renderer:', err);
          }
          rendererRef.current = null;
        }
        
        // Limpiar referencias
        sceneRef.current = null;
        cameraRef.current = null;
      };
    }
  }, [room, installations, equipment]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (!onEquipmentDrop || !cameraRef.current || !containerRef.current) return;

    try {
      const equipmentData = JSON.parse(e.dataTransfer.getData('application/json')) as EquipmentTemplate;

      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera({ x, y }, cameraRef.current);

      const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(floorPlane, intersection);

      const gridSize = 0.5;
      const snappedX = Math.round(intersection.x / gridSize) * gridSize;
      const snappedZ = Math.round(intersection.z / gridSize) * gridSize;

      const newEquipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'> = {
        room_id: room.id,
        name: equipmentData.name,
        type: equipmentData.type,
        position: {
          x: snappedX,
          y: 0,
          z: snappedZ
        },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: equipmentData.defaultDimensions
      };

      onEquipmentDrop(newEquipment);
    } catch (err) {
      console.error('Error handling equipment drop:', err);
    }
  };

  const handleNavigation = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!cameraRef.current || !controlsRef.current) return;

    const moveSpeed = 2;
    const cam = cameraRef.current;
    const target = controlsRef.current.target;

    switch (direction) {
      case 'up':
        cam.position.z -= moveSpeed;
        target.z -= moveSpeed;
        break;
      case 'down':
        cam.position.z += moveSpeed;
        target.z += moveSpeed;
        break;
      case 'left':
        cam.position.x -= moveSpeed;
        target.x -= moveSpeed;
        break;
      case 'right':
        cam.position.x += moveSpeed;
        target.x += moveSpeed;
        break;
    }

    // Aplicar restricciones después del movimiento
    if (roomCenterRef.current && maxRadiusRef.current > 0) {
      const dx = cam.position.x - roomCenterRef.current.x;
      const dz = cam.position.z - roomCenterRef.current.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance > maxRadiusRef.current) {
        const ratio = maxRadiusRef.current / distance;
        cam.position.x = roomCenterRef.current.x + dx * ratio;
        cam.position.z = roomCenterRef.current.z + dz * ratio;
      }
    }

    setCameraPosition({ x: cam.position.x, y: cam.position.y, z: cam.position.z });
  };

  return (
    <div
      className="relative w-full h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
          <div className="text-slate-600">Cargando vista 3D...</div>
        </div>
      )}
      {isDraggingOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 bg-opacity-20 border-4 border-dashed border-emerald-500 rounded-lg pointer-events-none z-10">
          <div className="text-emerald-700 text-xl font-semibold bg-white px-6 py-3 rounded-lg shadow-lg">
            Suelta aquí para colocar el equipo
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => handleNavigation('up')}
          className="w-12 h-12 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
          aria-label="Mover hacia arriba"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleNavigation('left')}
            className="w-12 h-12 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
            aria-label="Mover hacia la izquierda"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <button
            onClick={() => handleNavigation('down')}
            className="w-12 h-12 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
            aria-label="Mover hacia abajo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          <button
            onClick={() => handleNavigation('right')}
            className="w-12 h-12 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
            aria-label="Mover hacia la derecha"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function createRoom(scene: THREE.Scene, room: Room) {
  const vertices2D = room.vertices.map(v => [v.x, v.y]).flat();
  const triangles = earcut(vertices2D);

  const vertices3D: number[] = [];
  for (let i = 0; i < triangles.length; i++) {
    const idx = triangles[i];
    vertices3D.push(
      room.vertices[idx].x,
      0,
      room.vertices[idx].y
    );
  }

  const floorGeometry = new THREE.BufferGeometry();
  floorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices3D, 3));
  floorGeometry.computeVertexNormals();

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.8,
    metalness: 0.2
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  scene.add(floor);

  const ceilingGeometry = floorGeometry.clone();
  ceilingGeometry.translate(0, room.wall_height, 0);
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    side: THREE.DoubleSide
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  scene.add(ceiling);

  for (let i = 0; i < room.vertices.length; i++) {
    const v1 = room.vertices[i];
    const v2 = room.vertices[(i + 1) % room.vertices.length];

    const width = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
    const wallGeometry = new THREE.PlaneGeometry(width, room.wall_height);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.receiveShadow = true;
    wall.castShadow = true;

    const angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
    wall.rotation.y = -angle + Math.PI / 2;
    wall.position.set(
      (v1.x + v2.x) / 2,
      room.wall_height / 2,
      (v1.y + v2.y) / 2
    );

    scene.add(wall);

    const edgeGeometry = new THREE.EdgesGeometry(wallGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x94a3b8 });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.copy(wall.position);
    edges.rotation.copy(wall.rotation);
    scene.add(edges);
  }
}

function createFloorGrid(scene: THREE.Scene, room: Room, bounds: { minX: number; maxX: number; minZ: number; maxZ: number }) {
  const { minX, maxX, minZ, maxZ } = bounds;
  // Cada cuadrado de la cuadrícula representa 0.5 metros
  const gridSize = 0.5;

  const gridGroup = new THREE.Group();

  // Líneas verticales (paralelas al eje Z)
  for (let x = Math.floor(minX / gridSize) * gridSize; x <= maxX; x += gridSize) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.01, minZ),
      new THREE.Vector3(x, 0.01, maxZ)
    ]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xcccccc, 
      transparent: true, 
      opacity: 0.5,
      linewidth: 1
    });
    const line = new THREE.Line(geometry, material);
    gridGroup.add(line);
  }

  // Líneas horizontales (paralelas al eje X)
  for (let z = Math.floor(minZ / gridSize) * gridSize; z <= maxZ; z += gridSize) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(minX, 0.01, z),
      new THREE.Vector3(maxX, 0.01, z)
    ]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xcccccc, 
      transparent: true, 
      opacity: 0.5,
      linewidth: 1
    });
    const line = new THREE.Line(geometry, material);
    gridGroup.add(line);
  }

  // Borde de la habitación
  const borderGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(minX, 0.02, minZ),
    new THREE.Vector3(maxX, 0.02, minZ),
    new THREE.Vector3(maxX, 0.02, maxZ),
    new THREE.Vector3(minX, 0.02, maxZ),
    new THREE.Vector3(minX, 0.02, minZ)
  ]);
  const borderMaterial = new THREE.LineBasicMaterial({ 
    color: 0x64748b, 
    linewidth: 2 
  });
  const border = new THREE.Line(borderGeometry, borderMaterial);
  gridGroup.add(border);

  scene.add(gridGroup);
}

function createInstallations(scene: THREE.Scene, installations: Installation[], wallHeight: number) {
  installations.forEach(inst => {
    if (inst.type === 'power_point' && 'x' in inst.position) {
      const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.1);
      const material = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
      const outlet = new THREE.Mesh(geometry, material);
      outlet.position.set(inst.position.x, inst.position.z, inst.position.y);
      outlet.castShadow = true;
      scene.add(outlet);
    } else if (inst.type === 'door' && 'start' in inst.position) {
      const start = inst.position.start;
      const end = inst.position.end;
      const width = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

      const doorGeometry = new THREE.BoxGeometry(width, wallHeight * 0.9, 0.1);
      const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5cf6 });
      const door = new THREE.Mesh(doorGeometry, doorMaterial);
      door.position.set((start.x + end.x) / 2, wallHeight * 0.45, (start.y + end.y) / 2);
      door.castShadow = true;
      scene.add(door);
    }
  });
}

function createEquipment(scene: THREE.Scene, equipment: MedicalEquipment[]) {
  equipment.forEach(eq => {
    const geometry = new THREE.BoxGeometry(eq.dimensions.width, eq.dimensions.height, eq.dimensions.depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(eq.position.x, eq.position.y + eq.dimensions.height / 2, eq.position.z);
    mesh.rotation.set(eq.rotation.x, eq.rotation.y, eq.rotation.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x059669 });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    edgeLines.position.copy(mesh.position);
    edgeLines.rotation.copy(mesh.rotation);
    scene.add(edgeLines);
  });
}
