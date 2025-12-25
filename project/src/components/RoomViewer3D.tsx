import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import earcut from 'earcut';
import type { Room, Installation, MedicalEquipment, Position3D } from '../types';
import { calculateCentroid, isEquipmentInValidPosition } from '../utils/geometry';
import type { EquipmentTemplate } from '../data/medicalEquipmentCatalog';

interface RoomViewer3DProps {
  room: Room;
  installations: Installation[];
  equipment: MedicalEquipment[];
  onEquipmentUpdate?: (id: string, position: Position3D) => void;
  onEquipmentDrop?: (equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>) => void;
  onEquipmentDelete?: (id: string) => void;
  selectedEquipmentId?: string | null;
  onEquipmentSelect?: (id: string | null) => void;
  cameraEnabled?: boolean;
}

export function RoomViewer3D({ room, installations, equipment, onEquipmentUpdate, onEquipmentDrop, onEquipmentDelete, selectedEquipmentId, onEquipmentSelect, cameraEnabled = false }: RoomViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [_cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const roomBoundsRef = useRef<{ minX: number; maxX: number; minZ: number; maxZ: number } | null>(null);
  const roomCenterRef = useRef<{ x: number; z: number } | null>(null);
  const maxRadiusRef = useRef<number>(0);
  const animationIdRef = useRef<number | null>(null);
  const equipmentMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const equipmentHandlesRef = useRef<Map<string, THREE.Group>>(new Map());
  const [draggingEquipmentId, setDraggingEquipmentId] = useState<string | null>(null);
  const [draggingAxis, setDraggingAxis] = useState<'x' | 'y' | 'z' | null>(null);
  const dragStartPositionRef = useRef<Position3D | null>(null);
  const dragStartMouseRef = useRef<THREE.Vector2 | null>(null);
  const currentDragPositionRef = useRef<Position3D | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  
  // Configurar raycaster con threshold para objetos pequeños
  useEffect(() => {
    if (raycasterRef.current) {
      raycasterRef.current.params.Line = { threshold: 0.1 };
      raycasterRef.current.params.Points = { threshold: 0.1 };
    }
  }, []);
  const isInitializingRef = useRef<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!containerRef.current || isInitializingRef.current) return;
    
    isInitializingRef.current = true;

    // Esperar a que el contenedor tenga dimensiones
    const checkDimensions = () => {
      if (!containerRef.current) return false;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      return width > 0 && height > 0;
    };

    const initWithDelay = () => {
      if (!checkDimensions()) {
        requestAnimationFrame(() => {
          if (!checkDimensions()) {
            setTimeout(() => {
              if (containerRef.current && checkDimensions() && isInitializingRef.current) {
                initializeRenderer();
              }
            }, 100);
            return;
          }
          if (isInitializingRef.current) {
            initializeRenderer();
          }
        });
        return;
      }
      if (isInitializingRef.current) {
        initializeRenderer();
      }
    };

    initWithDelay();

    function initializeRenderer() {
      if (!containerRef.current || !isInitializingRef.current) return;

      // Limpiar renderer anterior si existe
      if (rendererRef.current) {
        try {
          // Detener animación
          if (animationIdRef.current !== null) {
            cancelAnimationFrame(animationIdRef.current);
            animationIdRef.current = null;
          }
          
          // Limpiar controls
          if (controlsRef.current) {
            controlsRef.current.dispose();
            controlsRef.current = null;
          }
          
          // Limpiar renderer
          rendererRef.current.dispose();
          const canvas = rendererRef.current.domElement;
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
          
          // Forzar pérdida del contexto para liberarlo
          const gl = rendererRef.current.getContext();
          if (gl) {
            const loseContext = (gl as any).getExtension('WEBGL_lose_context');
            if (loseContext) {
              loseContext.loseContext();
            }
          }
        } catch (err) {
          console.warn('Error cleaning up previous renderer:', err);
        }
        rendererRef.current = null;
      }

      // Limpiar cualquier elemento hijo del container
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      
      // Limpiar referencias de escena y cámara
      sceneRef.current = null;
      cameraRef.current = null;

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

        // Intentar crear renderer con manejo de errores mejorado
        try {
          renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false
          });
        } catch (webglError) {
          // Si falla, intentar sin antialiasing
          try {
            renderer = new THREE.WebGLRenderer({ 
              antialias: false,
              powerPreference: "default"
            });
          } catch (fallbackError) {
            throw new Error('No se pudo crear el contexto WebGL. Por favor, recarga la página.');
          }
        }
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
      isInitializingRef.current = false;
        return;
      }

      // Verificar que las variables se crearon correctamente
      if (!camera || !renderer || !scene) {
        console.error('Failed to create WebGL components');
        setIsLoading(false);
      isInitializingRef.current = false;
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

      // Posicionar la cámara inicialmente dentro del radio permitido
      const initialDistance = Math.min(maxRadiusRef.current * 0.7, room.wall_height * 1.5);
      camera.position.set(center.x, room.wall_height * 0.8, center.z + initialDistance);
      camera.lookAt(center.x, room.wall_height / 2, center.z);
      controls.target.set(center.x, room.wall_height / 2, center.z);

    setIsLoading(false);
      isInitializingRef.current = false;

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

      // Actualizar posición visual de equipos si están siendo arrastrados
      // Usar la posición del arrastre actual si está disponible, de lo contrario usar la del estado
      if (draggingEquipmentId && equipmentMeshesRef.current && equipmentHandlesRef.current) {
        const draggedEquipment = equipment.find(eq => eq.id === draggingEquipmentId);
        if (draggedEquipment) {
          const mesh = equipmentMeshesRef.current.get(draggingEquipmentId);
          const handleGroup = equipmentHandlesRef.current.get(draggingEquipmentId);
          if (mesh && handleGroup) {
            // Usar la posición del arrastre actual si está disponible (actualización inmediata)
            const currentPos = currentDragPositionRef.current || draggedEquipment.position;
            mesh.position.set(
              currentPos.x,
              currentPos.y + draggedEquipment.dimensions.height / 2,
              currentPos.z
            );
            // Actualizar posición del grupo de ejes
            handleGroup.position.set(
              currentPos.x,
              currentPos.y + draggedEquipment.dimensions.height + 0.3,
              currentPos.z
            );
          }
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
        isInitializingRef.current = false;
        
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
        
        // Limpiar equipos
        equipmentMeshesRef.current.forEach((mesh) => {
          if (sceneRef.current) {
            sceneRef.current.remove(mesh);
          }
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        });
        equipmentHandlesRef.current.forEach((handleGroup) => {
          if (sceneRef.current) {
            sceneRef.current.remove(handleGroup);
          }
          handleGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        });
        equipmentMeshesRef.current.clear();
        equipmentHandlesRef.current.clear();
        
        // Limpiar renderer
        if (rendererRef.current) {
          try {
            // Forzar pérdida del contexto
            const gl = rendererRef.current.getContext();
            if (gl) {
              const loseContext = (gl as any).getExtension('WEBGL_lose_context');
              if (loseContext) {
                loseContext.loseContext();
              }
            }
            
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
        
        // Limpiar cualquier elemento restante del container
        if (containerRef.current) {
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
        }
        
        // Limpiar referencias
        sceneRef.current = null;
        cameraRef.current = null;
      };
    }
  }, [room, installations]);

  // Crear equipos cuando se agreguen o eliminen
  const equipmentIdsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const currentIds = new Set(equipment.map(eq => eq.id));
    const previousIds = equipmentIdsRef.current;

    // Detectar equipos eliminados
    previousIds.forEach(id => {
      if (!currentIds.has(id)) {
        const mesh = equipmentMeshesRef.current.get(id);
        const handle = equipmentHandlesRef.current.get(id);
        if (mesh) {
          scene.remove(mesh);
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
          equipmentMeshesRef.current.delete(id);
        }
        if (handle) {
          scene.remove(handle);
          handle.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          equipmentHandlesRef.current.delete(id);
        }
      }
    });

    // Detectar equipos nuevos
    equipment.forEach(eq => {
      if (!previousIds.has(eq.id)) {
        createEquipment(scene, [eq], equipmentMeshesRef, equipmentHandlesRef);
      }
    });

    equipmentIdsRef.current = currentIds;
  }, [equipment.map(eq => eq.id).join(',')]); // Solo cuando cambien los IDs

  // Actualizar posiciones de los meshes cuando cambien los equipos
  useEffect(() => {
    if (!sceneRef.current || !equipmentMeshesRef.current || !equipmentHandlesRef.current) return;

    equipment.forEach(eq => {
      const mesh = equipmentMeshesRef.current.get(eq.id);
      const handleGroup = equipmentHandlesRef.current.get(eq.id);
      
      if (mesh) {
        const newMeshPos = new THREE.Vector3(
          eq.position.x,
          eq.position.y + eq.dimensions.height / 2,
          eq.position.z
        );
        mesh.position.copy(newMeshPos);
      }
      
      if (handleGroup) {
        const newHandlePos = new THREE.Vector3(
          eq.position.x,
          eq.position.y + eq.dimensions.height + 0.3,
          eq.position.z
        );
        handleGroup.position.copy(newHandlePos);
      }
    });
  }, [equipment.map(eq => `${eq.id}:${eq.position.x},${eq.position.y},${eq.position.z}`).join('|')]);

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
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

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

  const [hoveredHandleId, setHoveredHandleId] = useState<string | null>(null);
  const [_hoveredAxis, setHoveredAxis] = useState<'x' | 'y' | 'z' | null>(null);

  // Actualizar visibilidad de los ejes según la selección
  useEffect(() => {
    equipmentHandlesRef.current.forEach((handleGroup, id) => {
      if (handleGroup) {
        handleGroup.visible = id === selectedEquipmentId;
      }
    });
  }, [selectedEquipmentId]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current || !sceneRef.current) return;
    
    if (draggingEquipmentId && draggingAxis) {
      // Durante el arrastre, no cambiar el hover
      return;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    
    // Primero verificar si hay hover sobre los ejes
    const allAxisObjects: THREE.Object3D[] = [];
    equipmentHandlesRef.current.forEach((handleGroup) => {
      handleGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isAxis) {
          allAxisObjects.push(child);
        }
      });
    });
    
    const axisIntersects = raycasterRef.current.intersectObjects(allAxisObjects);
    
    if (axisIntersects.length > 0) {
      const axisMesh = axisIntersects[0].object as THREE.Mesh;
      if (axisMesh.userData.isAxis && axisMesh.userData.equipmentId) {
        setHoveredHandleId(axisMesh.userData.equipmentId);
        setHoveredAxis(axisMesh.userData.axis);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
        // Seleccionar el objeto al hacer hover sobre un eje
        if (onEquipmentSelect && axisMesh.userData.equipmentId !== selectedEquipmentId) {
          onEquipmentSelect(axisMesh.userData.equipmentId);
        }
        return;
      }
    }
    
    // Si no hay hover sobre ejes, verificar si hay hover sobre objetos
    const equipmentIntersects = raycasterRef.current.intersectObjects(Array.from(equipmentMeshesRef.current.values()));
    
    if (equipmentIntersects.length > 0) {
      const mesh = equipmentIntersects[0].object as THREE.Mesh;
      if (mesh.userData.equipmentId) {
        setHoveredHandleId(mesh.userData.equipmentId);
        setHoveredAxis(null);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'pointer';
        }
        return;
      }
    }
    
    // No hay hover sobre nada relevante
    setHoveredHandleId(null);
    setHoveredAxis(null);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'default';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current || !sceneRef.current) return;
    if (!controlsRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    
    // Primero verificar si se hizo clic en un eje
    const allAxisObjects: THREE.Object3D[] = [];
    equipmentHandlesRef.current.forEach((handleGroup) => {
      handleGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isAxis) {
          allAxisObjects.push(child);
        }
      });
    });
    
    const axisIntersects = raycasterRef.current.intersectObjects(allAxisObjects);
    
    if (axisIntersects.length > 0) {
      // Se hizo clic en un eje - iniciar arrastre
      const axisMesh = axisIntersects[0].object as THREE.Mesh;
      if (axisMesh.userData.isAxis && axisMesh.userData.equipmentId) {
        const eq = equipment.find(e => e.id === axisMesh.userData.equipmentId);
        if (eq) {
          console.log('Iniciando arrastre en eje:', axisMesh.userData.axis, 'para equipo:', eq.id);
          controlsRef.current.enabled = false;
          setDraggingEquipmentId(axisMesh.userData.equipmentId);
          setDraggingAxis(axisMesh.userData.axis);
          dragStartPositionRef.current = { ...eq.position };
          dragStartMouseRef.current = mouse.clone();
          if (onEquipmentSelect) {
            onEquipmentSelect(axisMesh.userData.equipmentId);
          }
          if (containerRef.current) {
            containerRef.current.style.cursor = 'grabbing';
          }
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
    }
    
    // Si no se hizo clic en un eje, verificar si se hizo clic en un objeto
    const equipmentIntersects = raycasterRef.current.intersectObjects(Array.from(equipmentMeshesRef.current.values()));
    
    if (equipmentIntersects.length > 0) {
      const mesh = equipmentIntersects[0].object as THREE.Mesh;
      if (mesh.userData.equipmentId) {
        // Seleccionar el objeto
        if (onEquipmentSelect) {
          onEquipmentSelect(mesh.userData.equipmentId);
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    
    // Si no se hizo clic en nada relevante, permitir controles de cámara
    controlsRef.current.enabled = true;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const handleMouseMoveEvent = (e: MouseEvent) => {
      if (!draggingEquipmentId || !draggingAxis || !containerRef.current || !cameraRef.current || !onEquipmentUpdate) {
        return;
      }
      if (!dragStartPositionRef.current || !dragStartMouseRef.current) {
        return;
      }
      
      const draggedEquipment = equipment.find(eq => eq.id === draggingEquipmentId);
      if (!draggedEquipment) {
        console.warn('Equipo no encontrado:', draggingEquipmentId);
        return;
      }
      
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouse, cameraRef.current);
      
      const startPos = dragStartPositionRef.current;
      const startMouse = dragStartMouseRef.current;
      
      // Obtener la dirección del eje en el espacio del mundo
      let axisDirection: THREE.Vector3;
      if (draggingAxis === 'x') {
        axisDirection = new THREE.Vector3(1, 0, 0);
      } else if (draggingAxis === 'y') {
        axisDirection = new THREE.Vector3(0, 1, 0);
      } else { // z
        axisDirection = new THREE.Vector3(0, 0, 1);
      }
      
      // Obtener la dirección de la cámara (hacia donde mira)
      const cameraDirection = new THREE.Vector3();
      cameraRef.current.getWorldDirection(cameraDirection);
      
      // Obtener los vectores de la cámara (right, up, forward)
      const cameraRight = new THREE.Vector3();
      const cameraUp = new THREE.Vector3();
      cameraRight.setFromMatrixColumn(cameraRef.current.matrixWorld, 0).normalize();
      cameraUp.setFromMatrixColumn(cameraRef.current.matrixWorld, 1).normalize();
      
      // Calcular el movimiento del mouse en el espacio de la pantalla
      const mouseDelta = new THREE.Vector2();
      mouseDelta.x = mouse.x - startMouse.x;
      mouseDelta.y = mouse.y - startMouse.y;
      
      // Calcular la distancia de la cámara al objeto para escalar el movimiento
      const objectWorldPos = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
      const cameraToObject = new THREE.Vector3();
      cameraToObject.subVectors(objectWorldPos, cameraRef.current.position);
      const distance = cameraToObject.length();
      
      // Factor de escala basado en la distancia y el FOV
      const fov = cameraRef.current.fov * (Math.PI / 180);
      const sensitivity = distance * Math.tan(fov / 2) * 2;
      
      // Calcular el movimiento en el espacio del mundo basado en el movimiento del mouse
      const movementInWorld = new THREE.Vector3();
      movementInWorld.addScaledVector(cameraRight, mouseDelta.x * sensitivity);
      movementInWorld.addScaledVector(cameraUp, -mouseDelta.y * sensitivity); // Negativo porque Y de pantalla es invertido
      
      // Proyectar el movimiento en el eje seleccionado
      // Esto nos da cuánto se movió a lo largo del eje
      const axisProjection = movementInWorld.dot(axisDirection);
      
      console.log('Eje seleccionado:', draggingAxis, 'Dirección del eje:', axisDirection, 'Movimiento en mundo:', movementInWorld, 'Proyección:', axisProjection);
      
      const gridSize = 0.5;
      let newPosition: Position3D;
      
      if (draggingAxis === 'x') {
        const newX = startPos.x + axisProjection;
        const snappedX = Math.round(newX / gridSize) * gridSize;
        newPosition = {
          x: snappedX,
          y: startPos.y,
          z: startPos.z
        };
      } else if (draggingAxis === 'y') {
        const newY = startPos.y + axisProjection;
        const snappedY = Math.round(newY / gridSize) * gridSize;
        newPosition = {
          x: startPos.x,
          y: Math.max(0, snappedY),
          z: startPos.z
        };
      } else { // z
        const newZ = startPos.z + axisProjection;
        const snappedZ = Math.round(newZ / gridSize) * gridSize;
        newPosition = {
          x: startPos.x,
          y: startPos.y,
          z: snappedZ
        };
      }
      
      // Guardar la posición actual para actualización visual inmediata
      currentDragPositionRef.current = newPosition;
      
      // Solo actualizar visualmente durante el arrastre, no llamar a onEquipmentUpdate todavía
      // La actualización real se hará cuando se suelte el mouse
    };
    
    const handleMouseUpEvent = () => {
      // Cuando se suelta el mouse, crear nuevo equipo en la posición final y eliminar el original
      if (draggingEquipmentId && currentDragPositionRef.current && onEquipmentDrop && onEquipmentDelete) {
        const draggedEquipment = equipment.find(eq => eq.id === draggingEquipmentId);
        if (draggedEquipment) {
          const finalPosition = currentDragPositionRef.current;
          
          // Validar posición final
          let isValid = true;
          if (draggingAxis === 'x' || draggingAxis === 'z') {
            isValid = isEquipmentInValidPosition(
              finalPosition,
              { width: draggedEquipment.dimensions.width, depth: draggedEquipment.dimensions.depth },
              room.vertices
            );
          } else {
            // Para Y, solo validar que no sea negativo
            isValid = finalPosition.y >= 0;
          }
          
          if (isValid) {
            // Crear nuevo equipo con la posición final y todos los datos idénticos
            const newEquipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'> = {
              room_id: draggedEquipment.room_id,
              name: draggedEquipment.name,
              type: draggedEquipment.type,
              position: finalPosition,
              rotation: draggedEquipment.rotation,
              dimensions: draggedEquipment.dimensions
            };
            
            console.log('🔄 Creando nuevo equipo en posición final:', finalPosition);
            console.log('🗑️ Eliminando equipo original:', draggingEquipmentId);
            
            // Crear el nuevo equipo
            onEquipmentDrop(newEquipment);
            
            // Eliminar el equipo original
            onEquipmentDelete(draggingEquipmentId);
          } else {
            console.warn('❌ Posición final inválida, no se crea nuevo equipo');
          }
        }
      }
      
      setDraggingEquipmentId(null);
      setDraggingAxis(null);
      dragStartPositionRef.current = null;
      dragStartMouseRef.current = null;
      currentDragPositionRef.current = null;
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      if (containerRef.current) {
        containerRef.current.style.cursor = hoveredHandleId ? 'grab' : 'default';
      }
    };
    
    if (draggingEquipmentId && draggingAxis) {
      window.addEventListener('mousemove', handleMouseMoveEvent);
      window.addEventListener('mouseup', handleMouseUpEvent);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveEvent);
      window.removeEventListener('mouseup', handleMouseUpEvent);
    };
  }, [draggingEquipmentId, draggingAxis, equipment, room, onEquipmentUpdate, hoveredHandleId]);

  // Manejar la cámara web
  useEffect(() => {
    if (!cameraEnabled) {
      // Detener la cámara si está desactivada
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    // Solicitar acceso a la cámara
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia no está disponible en este navegador');
      alert('Tu navegador no soporta acceso a la cámara.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } 
    })
      .then((stream) => {
        console.log('Cámara activada correctamente');
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error('Error al reproducir video:', err);
          });
        }
      })
      .catch((err) => {
        console.error('Error accediendo a la cámara:', err);
        let errorMessage = 'No se pudo acceder a la cámara.';
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración del navegador.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No se encontró ninguna cámara conectada.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'La cámara está siendo usada por otra aplicación.';
        }
        alert(errorMessage);
      });

    return () => {
      // Limpiar al desmontar o cuando cameraEnabled cambie
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraEnabled]);

  return (
    <div
      className="relative w-full h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => {
        if (containerRef.current) {
          containerRef.current.style.cursor = draggingEquipmentId ? 'grabbing' : 'default';
        }
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
          <div className="text-slate-600">טוען תצוגה תלת-ממדית...</div>
        </div>
      )}
      {isDraggingOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 bg-opacity-20 border-4 border-dashed border-emerald-500 rounded-lg pointer-events-none z-10">
          <div className="text-emerald-700 text-xl font-semibold bg-white px-6 py-3 rounded-lg shadow-lg">
            שחרר כאן כדי למקם את הציוד
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />
      
      {/* Video de la cámara con transparencia */}
      {cameraEnabled && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-lg"
          style={{
            opacity: 0.5,
            mixBlendMode: 'screen',
            zIndex: 20,
            backgroundColor: 'transparent'
          }}
          onLoadedMetadata={() => {
            console.log('Video metadata cargado');
          }}
          onError={(e) => {
            console.error('Error en el video:', e);
          }}
        />
      )}

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

// Función para crear textura de piso
function createFloorTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Fondo base con gradiente
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#d1d5db');
  gradient.addColorStop(0.5, '#e2e8f0');
  gradient.addColorStop(1, '#d1d5db');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Patrón de líneas más visibles para simular baldosas
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  const tileSize = 64; // Simula baldosas de ~0.5m
  
  for (let x = 0; x < 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  
  for (let y = 0; y < 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  
  // Agregar variación de color más visible
  const imageData = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % 512;
    const y = Math.floor((i / 4) / 512);
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    const variation = ((tileX + tileY) % 2 === 0) ? 8 : -8;
    imageData.data[i] = Math.max(200, Math.min(255, imageData.data[i] + variation)); // R
    imageData.data[i + 1] = Math.max(220, Math.min(255, imageData.data[i + 1] + variation)); // G
    imageData.data[i + 2] = Math.max(230, Math.min(255, imageData.data[i + 2] + variation)); // B
  }
  ctx.putImageData(imageData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

// Función para crear textura de techo
function createCeilingTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Fondo base con gradiente sutil
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#f8f9fa');
  gradient.addColorStop(0.5, '#ffffff');
  gradient.addColorStop(1, '#f8f9fa');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Patrón de textura más visible
  ctx.fillStyle = '#e9ecef';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 4 + 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Líneas más visibles para simular paneles
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = 1.5;
  for (let x = 0; x < 512; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  
  for (let y = 0; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

// Función para crear textura de pared
function createWallTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Fondo base con gradiente vertical
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#e2e8f0');
  gradient.addColorStop(0.5, '#f1f5f9');
  gradient.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Variación de color más visible para simular textura de yeso
  const imageData = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const x = (i / 4) % 512;
    const y = Math.floor((i / 4) / 512);
    // Crear un patrón de textura más visible
    const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 12;
    const variation = noise + (Math.random() - 0.5) * 6;
    imageData.data[i] = Math.max(220, Math.min(255, imageData.data[i] + variation)); // R
    imageData.data[i + 1] = Math.max(235, Math.min(255, imageData.data[i + 1] + variation)); // G
    imageData.data[i + 2] = Math.max(240, Math.min(255, imageData.data[i + 2] + variation)); // B
  }
  ctx.putImageData(imageData, 0, 0);
  
  // Líneas verticales más visibles
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  
  // Agregar algunas líneas horizontales sutiles
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 0.5;
  for (let y = 0; y < 512; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 2);
  texture.needsUpdate = true;
  return texture;
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

  // Calcular tamaño del piso para ajustar la textura
  const bounds = {
    minX: Math.min(...room.vertices.map(v => v.x)),
    maxX: Math.max(...room.vertices.map(v => v.x)),
    minZ: Math.min(...room.vertices.map(v => v.y)),
    maxZ: Math.max(...room.vertices.map(v => v.y))
  };
  const floorWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const floorDepth = Math.max(bounds.maxZ - bounds.minZ, 1);
  
  const floorTexture = createFloorTexture();
  // Ajustar repetición para que cada baldosa sea aproximadamente 0.5m
  floorTexture.repeat.set(floorWidth * 2, floorDepth * 2);

  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    color: 0xe2e8f0,
    roughness: 0.8,
    metalness: 0.1
  });

  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  scene.add(floor);

  const ceilingGeometry = floorGeometry.clone();
  ceilingGeometry.translate(0, room.wall_height, 0);
  
  const ceilingTexture = createCeilingTexture();
  ceilingTexture.repeat.set(floorWidth * 2, floorDepth * 2);
  
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    map: ceilingTexture,
    color: 0xffffff,
    roughness: 0.8,
    side: THREE.DoubleSide
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  scene.add(ceiling);

  for (let i = 0; i < room.vertices.length; i++) {
    const v1 = room.vertices[i];
    const v2 = room.vertices[(i + 1) % room.vertices.length];

    const width = Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
    const wallGeometry = new THREE.PlaneGeometry(width, room.wall_height);
    
    const wallTexture = createWallTexture();
    // Ajustar repetición para que la textura se vea bien en las paredes
    wallTexture.repeat.set(width * 2, room.wall_height * 2);
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTexture,
      color: 0xffffff, // Color blanco para que la textura se vea mejor
      roughness: 0.6,
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

function createFloorGrid(scene: THREE.Scene, _room: Room, bounds: { minX: number; maxX: number; minZ: number; maxZ: number }) {
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

// Función para crear una flecha de eje
function createAxisArrow(color: number, axis: 'x' | 'y' | 'z', length: number = 0.5): THREE.Group {
  const group = new THREE.Group();
  
  // Crear un cilindro para el eje (más fácil de detectar que una línea)
  const cylinderGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 8);
  const cylinderMaterial = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 });
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  
  // Posicionar y rotar el cilindro según el eje
  if (axis === 'x') {
    cylinder.rotation.z = Math.PI / 2;
    cylinder.position.set(length / 2, 0, 0);
  } else if (axis === 'y') {
    cylinder.position.set(0, length / 2, 0);
    // Ya está en la orientación correcta
  } else { // z
    cylinder.rotation.x = Math.PI / 2;
    cylinder.position.set(0, 0, length / 2);
  }
  
  // Hacer el cilindro interactivo (el equipmentId se asignará después)
  cylinder.userData.isAxis = true;
  cylinder.userData.axis = axis;
  group.add(cylinder);
  
  // Crear la punta de la flecha (cono) - más grande para facilitar la detección
  const coneGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
  const coneMaterial = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  
  // Posicionar y rotar el cono según el eje
  if (axis === 'x') {
    cone.position.set(length, 0, 0);
    cone.rotation.z = -Math.PI / 2;
  } else if (axis === 'y') {
    cone.position.set(0, length, 0);
    // No necesita rotación, ya apunta hacia arriba
  } else { // z
    cone.position.set(0, 0, length);
    cone.rotation.x = Math.PI / 2;
  }
  
  // Hacer el cono interactivo también (el equipmentId se asignará después)
  cone.userData.isAxis = true;
  cone.userData.axis = axis;
  group.add(cone);
  
  return group;
}

function createEquipment(
  scene: THREE.Scene, 
  equipment: MedicalEquipment[],
  equipmentMeshesRef: React.MutableRefObject<Map<string, THREE.Mesh>>,
  equipmentHandlesRef: React.MutableRefObject<Map<string, THREE.Group>>
) {
  equipment.forEach(eq => {
    const geometry = new THREE.BoxGeometry(eq.dimensions.width, eq.dimensions.height, eq.dimensions.depth);
    const material = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(eq.position.x, eq.position.y + eq.dimensions.height / 2, eq.position.z);
    mesh.rotation.set(eq.rotation.x, eq.rotation.y, eq.rotation.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.equipmentId = eq.id;
    scene.add(mesh);
    equipmentMeshesRef.current.set(eq.id, mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x059669 });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    edgeLines.position.copy(mesh.position);
    edgeLines.rotation.copy(mesh.rotation);
    scene.add(edgeLines);

    // Crear grupo de ejes de transformación (estilo Blender)
    const axesGroup = new THREE.Group();
    axesGroup.position.set(
      eq.position.x,
      eq.position.y + eq.dimensions.height + 0.3,
      eq.position.z
    );
    
    // Eje X (rojo)
    const xAxis = createAxisArrow(0xff0000, 'x', 0.4);
    xAxis.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData.isAxis = true;
        child.userData.axis = 'x';
        child.userData.equipmentId = eq.id;
      }
    });
    axesGroup.add(xAxis);
    
    // Eje Y (verde)
    const yAxis = createAxisArrow(0x00ff00, 'y', 0.4);
    yAxis.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData.isAxis = true;
        child.userData.axis = 'y';
        child.userData.equipmentId = eq.id;
      }
    });
    axesGroup.add(yAxis);
    
    // Eje Z (azul)
    const zAxis = createAxisArrow(0x0000ff, 'z', 0.4);
    zAxis.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData.isAxis = true;
        child.userData.axis = 'z';
        child.userData.equipmentId = eq.id;
      }
    });
    axesGroup.add(zAxis);
    
    // Ocultar por defecto, solo se mostrará cuando el objeto esté seleccionado
    axesGroup.visible = false;
    scene.add(axesGroup);
    equipmentHandlesRef.current.set(eq.id, axesGroup);
  });
}
