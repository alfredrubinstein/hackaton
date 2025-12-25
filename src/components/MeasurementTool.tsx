import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, Upload, Ruler, CheckCircle2, AlertCircle, Image as ImageIcon, RotateCcw, Info, Move, RotateCw, ZoomIn, CreditCard } from 'lucide-react';

// Declarar tipos para OpenCV
declare global {
  interface Window {
    cv: any;
    onOpenCvReady: () => void;
  }
}

interface MeasurementToolProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Measurement {
  id: string;
  distance: number;
  timestamp: Date;
}

type ControlMode = 'none' | 'move' | 'rotate' | 'scale';

interface CreditCardTransform {
  x: number;
  y: number;
  rotationX: number; // Rotación en eje X (perspectiva)
  rotationY: number; // Rotación en eje Y (perspectiva)
  rotationZ: number; // Rotación en eje Z (plano)
  scale: number;
  width: number;
  height: number;
}

export function MeasurementTool({ isOpen, onClose }: MeasurementToolProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgOriginalRef = useRef<any>(null);
  const imgMainRef = useRef<any>(null);
  const transformMatrixRef = useRef<any>(null);
  const openCvLoadedRef = useRef<boolean>(false);
  const isCalibratedRef = useRef<boolean>(false); // Ref para acceso al estado actual en handlers
  const [status, setStatus] = useState('טוען OpenCV...');
  const [isLoading, setIsLoading] = useState(true);
  const [refPoints, setRefPoints] = useState<Point[]>([]);
  const [measurementPoints, setMeasurementPoints] = useState<Point[]>([]);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationWidth, setCalibrationWidth] = useState('');
  const [calibrationHeight, setCalibrationHeight] = useState('');
  const [hasImage, setHasImage] = useState(false);
  
  // Medidas estándar de tarjeta de crédito (en cm)
  const CREDIT_CARD_WIDTH = 8.56;  // Ancho estándar
  const CREDIT_CARD_HEIGHT = 5.398; // Alto estándar

  // Estados para la tarjeta de crédito interactiva
  const [controlMode, setControlMode] = useState<ControlMode>('none');
  const [showCreditCard, setShowCreditCard] = useState(false);
  const [creditCardTransform, setCreditCardTransform] = useState<CreditCardTransform>({
    x: 0,
    y: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
    width: 200, // Tamaño inicial en píxeles
    height: 126, // Proporción de tarjeta de crédito
  });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; transform: CreditCardTransform } | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Cargar OpenCV.js
  useEffect(() => {
    console.log('[MeasurementTool] useEffect ejecutado', { isOpen });
    if (!isOpen) {
      console.log('[MeasurementTool] isOpen es false, saliendo');
      return;
    }

    // Si OpenCV ya está cargado, solo inicializar
    if (window.cv && openCvLoadedRef.current) {
      console.log('[MeasurementTool] OpenCV ya está cargado');
      setStatus('OpenCV מוכן! טוען תמונה...');
      setIsLoading(false);
      return;
    }

    // Verificar si el script ya existe
    const existingScript = document.querySelector('script[src*="opencv.js"]');
    if (existingScript) {
      console.log('[MeasurementTool] Script de OpenCV ya existe en el DOM');
      if (window.cv) {
        console.log('[MeasurementTool] window.cv existe, configurando callback');
        window.cv['onRuntimeInitialized'] = () => {
          console.log('[MeasurementTool] OpenCV runtime inicializado (callback)');
          setStatus('OpenCV מוכן! טוען תמונה...');
          setIsLoading(false);
          openCvLoadedRef.current = true;
        };
        // Si ya está inicializado
        if (window.cv.imread) {
          console.log('[MeasurementTool] OpenCV ya está inicializado (imread disponible)');
          setStatus('OpenCV מוכן! טוען תמונה...');
          setIsLoading(false);
          openCvLoadedRef.current = true;
        } else {
          console.log('[MeasurementTool] OpenCV existe pero imread no está disponible aún');
        }
      } else {
        console.log('[MeasurementTool] Script existe pero window.cv no está disponible');
      }
      return;
    }

    console.log('[MeasurementTool] Creando script de OpenCV');
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.async = true;
    script.type = 'text/javascript';
    
    window.onOpenCvReady = () => {
      console.log('[MeasurementTool] onOpenCvReady llamado');
      if (window.cv) {
        console.log('[MeasurementTool] Configurando onRuntimeInitialized');
        window.cv['onRuntimeInitialized'] = () => {
          console.log('[MeasurementTool] OpenCV runtime inicializado');
          setStatus('OpenCV מוכן! טוען תמונה...');
          setIsLoading(false);
          openCvLoadedRef.current = true;
        };
      } else {
        console.error('[MeasurementTool] ERROR: window.cv no está disponible en onOpenCvReady');
      }
    };

    script.onload = () => {
      console.log('[MeasurementTool] Script de OpenCV cargado');
      window.onOpenCvReady();
    };

    script.onerror = (error) => {
      console.error('[MeasurementTool] ERROR al cargar script de OpenCV:', error);
    };

    console.log('[MeasurementTool] Agregando script al DOM');
    document.body.appendChild(script);

    return () => {
      // Limpiar recursos al cerrar
      if (imgOriginalRef.current) {
        imgOriginalRef.current.delete();
        imgOriginalRef.current = null;
      }
      if (imgMainRef.current) {
        imgMainRef.current.delete();
        imgMainRef.current = null;
      }
      if (transformMatrixRef.current) {
        transformMatrixRef.current.delete();
        transformMatrixRef.current = null;
      }
      setRefPoints([]);
      setMeasurementPoints([]);
      isCalibratedRef.current = false; // Actualizar ref también
      setIsCalibrated(false);
      setMeasurements([]);
      setHasImage(false);
    };
  }, [isOpen]);

  const loadImage = (file: File) => {
    console.log('[MeasurementTool] loadImage iniciado', {
      hasCanvas: !!mainCanvasRef.current,
      hasOpenCV: !!window.cv,
      fileName: file.name
    });

    if (!mainCanvasRef.current) {
      console.error('[MeasurementTool] ERROR: mainCanvasRef.current es null');
      return;
    }

    if (!window.cv) {
      console.error('[MeasurementTool] ERROR: window.cv no está disponible');
      return;
    }

    // Limpiar recursos anteriores
    if (imgOriginalRef.current) {
      console.log('[MeasurementTool] Limpiando imgOriginalRef anterior');
      imgOriginalRef.current.delete();
    }
    if (imgMainRef.current) {
      console.log('[MeasurementTool] Limpiando imgMainRef anterior');
      imgMainRef.current.delete();
    }
    if (transformMatrixRef.current) {
      console.log('[MeasurementTool] Limpiando transformMatrixRef anterior');
      transformMatrixRef.current.delete();
      transformMatrixRef.current = null;
    }

    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[MeasurementTool] ERROR: No se pudo obtener contexto 2d del canvas');
      return;
    }

    console.log('[MeasurementTool] Creando objeto Image y URL');
    const img = new Image();
    const url = URL.createObjectURL(file);
    console.log('[MeasurementTool] URL creada:', url);
    
    img.onload = () => {
      console.log('[MeasurementTool] Imagen cargada exitosamente', {
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });

      canvas.width = img.width;
      canvas.height = img.height;
      console.log('[MeasurementTool] Canvas dimensiones actualizadas:', {
        width: canvas.width,
        height: canvas.height
      });

      ctx.drawImage(img, 0, 0);
      console.log('[MeasurementTool] Imagen dibujada en canvas');
      
      try {
        const imgOrig = window.cv.imread(canvas);
        console.log('[MeasurementTool] OpenCV imread exitoso', {
          cols: imgOrig.cols,
          rows: imgOrig.rows
        });

        const imgM = imgOrig.clone();
        console.log('[MeasurementTool] Imagen clonada exitosamente');
        
        imgOriginalRef.current = imgOrig;
        imgMainRef.current = imgM;
        setStatus('מוכן. בחר 4 נקודות לכיול או presiona C para usar tarjeta de crédito.');
        setIsCalibrated(false);
        setRefPoints([]);
        setMeasurementPoints([]);
        setMeasurements([]);
        setHasImage(true);
        setShowCreditCard(false);
        setControlMode('none');
        // Inicializar posición de tarjeta en el centro
        setCreditCardTransform(prev => ({
          ...prev,
          x: canvas.width / 2,
          y: canvas.height / 2,
        }));
        
        console.log('[MeasurementTool] Estado actualizado, hasImage = true');
        
        URL.revokeObjectURL(url);
        console.log('[MeasurementTool] URL revocada');
        // setupEvents se llamará cuando cambie el estado
        setTimeout(() => {
          if (mainCanvasRef.current) {
            setupEvents(mainCanvasRef.current);
            console.log('[MeasurementTool] Eventos configurados');
          }
        }, 100);
      } catch (error) {
        console.error('[MeasurementTool] ERROR al procesar con OpenCV:', error);
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = (error) => {
      console.error('[MeasurementTool] ERROR al cargar imagen:', error);
      console.error('[MeasurementTool] URL que falló:', url);
      URL.revokeObjectURL(url);
    };
    
    console.log('[MeasurementTool] Estableciendo img.src');
    img.src = url;
  };

  const setupEvents = (canvas: HTMLCanvasElement) => {
    // Limpiar eventos anteriores
    canvas.onclick = null;
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
    canvas.onwheel = null;

    if (showCreditCard && controlMode !== 'none') {
      // Modo de control de tarjeta activo
      canvas.onmousedown = (e) => handleCardMouseDown(e, canvas);
      canvas.onmousemove = (e) => handleCardMouseMove(e, canvas);
      canvas.onmouseup = () => handleCardMouseUp();
      canvas.onwheel = (e) => handleCardWheel(e);
    } else if (!showCreditCard || controlMode === 'none') {
      // Modo de selección de puntos normal
      canvas.onclick = (e) => handleClick(e, canvas);
    }
  };

  const getCreditCardCorners = useCallback((): Point[] => {
    const { x, y, rotationZ, scale, width, height } = creditCardTransform;
    const w = (width * scale) / 2;
    const h = (height * scale) / 2;
    const cos = Math.cos(rotationZ);
    const sin = Math.sin(rotationZ);

    // Esquinas de la tarjeta (relativas al centro)
    const corners = [
      { x: -w, y: -h },
      { x: w, y: -h },
      { x: w, y: h },
      { x: -w, y: h },
    ];

    // Aplicar rotación y traslación
    return corners.map(corner => ({
      x: x + corner.x * cos - corner.y * sin,
      y: y + corner.x * sin + corner.y * cos,
    }));
  }, [creditCardTransform]);

  const useCardCornersAsCalibration = useCallback(() => {
    if (!window.cv || !mainCanvasRef.current) return;

    const corners = getCreditCardCorners();
    if (corners.length === 4) {
      setRefPoints(corners);
      setTimeout(() => {
        autoCalibrateWithCreditCard(corners);
      }, 100);
      setShowCreditCard(false);
      setControlMode('none');
    }
  }, [getCreditCardCorners]);

  // Manejar teclas para controles tipo Blender
  useEffect(() => {
    if (!isOpen || !hasImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      switch (e.key.toLowerCase()) {
        case 'g':
          e.preventDefault();
          setControlMode('move');
          setShowCreditCard(true);
          break;
        case 'r':
          e.preventDefault();
          setControlMode('rotate');
          setShowCreditCard(true);
          break;
        case 's':
          e.preventDefault();
          setControlMode('scale');
          setShowCreditCard(true);
          break;
        case 'escape':
        case 'q':
          e.preventDefault();
          setControlMode('none');
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) return; // No interferir con Ctrl+C
          e.preventDefault();
          if (showCreditCard) {
            // Usar esquinas de la tarjeta como puntos de calibración
            useCardCornersAsCalibration();
          } else {
            setShowCreditCard(true);
            setControlMode('move');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasImage, showCreditCard, controlMode, useCardCornersAsCalibration]);

  // Inicializar posición de la tarjeta en el centro cuando se muestra por primera vez
  useEffect(() => {
    if (showCreditCard && mainCanvasRef.current) {
      const canvas = mainCanvasRef.current;
      setCreditCardTransform(prev => ({
        ...prev,
        x: canvas.width / 2,
        y: canvas.height / 2,
      }));
      redrawCanvas();
    }
  }, [showCreditCard]);

  const handleCardMouseDown = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (controlMode === 'none') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    isDraggingRef.current = true;
    dragStartRef.current = {
      x,
      y,
      transform: { ...creditCardTransform },
    };
  };

  const handleCardMouseMove = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!isDraggingRef.current || !dragStartRef.current || controlMode === 'none') return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const deltaX = x - dragStartRef.current.x;
    const deltaY = y - dragStartRef.current.y;

    if (controlMode === 'move') {
      setCreditCardTransform(prev => ({
        ...prev,
        x: dragStartRef.current!.transform.x + deltaX,
        y: dragStartRef.current!.transform.y + deltaY,
      }));
    } else if (controlMode === 'rotate') {
      // Rotación basada en el movimiento del mouse
      const centerX = dragStartRef.current.transform.x;
      const centerY = dragStartRef.current.transform.y;
      const angle = Math.atan2(y - centerY, x - centerX);
      
      setCreditCardTransform(prev => ({
        ...prev,
        rotationZ: angle,
      }));
    } else if (controlMode === 'scale') {
      // Escala basada en la distancia desde el centro
      const centerX = dragStartRef.current.transform.x;
      const centerY = dragStartRef.current.transform.y;
      const startDist = Math.sqrt(
        Math.pow(dragStartRef.current.x - centerX, 2) +
        Math.pow(dragStartRef.current.y - centerY, 2)
      );
      const currentDist = Math.sqrt(
        Math.pow(x - centerX, 2) +
        Math.pow(y - centerY, 2)
      );
      const scaleFactor = currentDist / (startDist || 1);
      
      setCreditCardTransform(prev => ({
        ...prev,
        scale: Math.max(0.1, Math.min(5, dragStartRef.current!.transform.scale * scaleFactor)),
      }));
    }

    redrawCanvas();
  };

  const handleCardMouseUp = () => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
  };

  const handleCardWheel = (e: WheelEvent) => {
    if (controlMode === 'none' || !showCreditCard) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setCreditCardTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(5, prev.scale * delta)),
    }));
    redrawCanvas();
  };

  const drawCreditCard = useCallback(() => {
    if (!imgMainRef.current || !mainCanvasRef.current || !window.cv || !showCreditCard) return;

    const corners = getCreditCardCorners();
    const cornerPoints = corners.map(p => new window.cv.Point(p.x, p.y));

    // Dibujar la tarjeta como un rectángulo
    const color = controlMode === 'none' 
      ? new window.cv.Scalar(0, 255, 0, 200) // Verde semi-transparente
      : new window.cv.Scalar(255, 165, 0, 200); // Naranja cuando está en modo de control

    // Dibujar líneas del rectángulo
    for (let i = 0; i < 4; i++) {
      const p1 = cornerPoints[i];
      const p2 = cornerPoints[(i + 1) % 4];
      window.cv.line(imgMainRef.current, p1, p2, color, 3);
    }

    // Dibujar círculos en las esquinas
    cornerPoints.forEach((point, index) => {
      window.cv.circle(imgMainRef.current, point, 8, color, -1);
      window.cv.putText(
        imgMainRef.current,
        (index + 1).toString(),
        new window.cv.Point(point.x - 5, point.y - 10),
        window.cv.FONT_HERSHEY_SIMPLEX,
        0.6,
        new window.cv.Scalar(255, 255, 255, 255),
        2
      );
    });

    // Dibujar centro de la tarjeta
    window.cv.circle(
      imgMainRef.current,
      new window.cv.Point(creditCardTransform.x, creditCardTransform.y),
      5,
      color,
      -1
    );
  }, [showCreditCard, creditCardTransform, controlMode, getCreditCardCorners]);

  const redrawCanvas = useCallback(() => {
    if (!imgOriginalRef.current || !imgMainRef.current || !mainCanvasRef.current || !window.cv) return;

    // Restaurar imagen original
    imgMainRef.current.delete();
    imgMainRef.current = imgOriginalRef.current.clone();

    // Dibujar tarjeta si está visible
    if (showCreditCard) {
      drawCreditCard();
    }

    // Mostrar en canvas
    window.cv.imshow(mainCanvasRef.current, imgMainRef.current);
  }, [showCreditCard, drawCreditCard]);

  // Redibujar cuando cambia la transformación de la tarjeta
  useEffect(() => {
    if (hasImage && showCreditCard) {
      redrawCanvas();
    }
  }, [creditCardTransform, hasImage, showCreditCard, redrawCanvas]);

  // Actualizar eventos cuando cambia el modo de control
  useEffect(() => {
    if (hasImage && mainCanvasRef.current) {
      setupEvents(mainCanvasRef.current);
    }
  }, [controlMode, showCreditCard, hasImage]);

  const handleClick = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!imgMainRef.current || !window.cv) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Usar el ref para obtener el valor actual de isCalibrated
    const calibrated = isCalibratedRef.current;
    
    // Si ya está calibrado, solo agregar puntos de medición
    if (calibrated) {
      console.log('[MeasurementTool] Agregando punto de medición', { x, y });
      setMeasurementPoints((prev) => {
        const newPoints = [...prev, { x, y }];
        drawMarker(x, y, new window.cv.Scalar(255, 0, 0, 255), '');
        
        if (newPoints.length % 2 === 0) {
          setTimeout(() => calculateDistance(newPoints), 0);
        }
        return newPoints;
      });
      return; // Salir temprano para evitar agregar puntos de calibración
    }
    
    // Si aún no está calibrado, agregar puntos de calibración
    console.log('[MeasurementTool] Agregando punto de calibración', { x, y });
    setRefPoints((prev) => {
      if (prev.length < 4) {
        const newPoints = [...prev, { x, y }];
        drawMarker(x, y, new window.cv.Scalar(0, 255, 0, 255), newPoints.length.toString());
        
        if (newPoints.length === 4) {
          // Automáticamente calibrar con medidas de tarjeta de crédito
          setTimeout(() => {
            autoCalibrateWithCreditCard(newPoints);
          }, 100);
        }
        return newPoints;
      }
      return prev;
    });
  };

  const drawMarker = (x: number, y: number, color: any, text: string) => {
    if (!imgMainRef.current || !mainCanvasRef.current || !window.cv) return;
    
    window.cv.circle(imgMainRef.current, new window.cv.Point(x, y), 5, color, -1);
    if (text) {
      window.cv.putText(imgMainRef.current, text, new window.cv.Point(x, y - 10), 0, 0.8, color, 2);
    }
    window.cv.imshow(mainCanvasRef.current, imgMainRef.current);
  };

  const autoCalibrateWithCreditCard = (points: Point[]) => {
    if (!window.cv) return;
    
    // Limpiar matriz anterior si existe
    if (transformMatrixRef.current) {
      transformMatrixRef.current.delete();
    }
    
    const srcMat = window.cv.matFromArray(
      4,
      1,
      window.cv.CV_32FC2,
      points.flatMap((p) => [p.x, p.y])
    );
    
    // Usar medidas estándar de tarjeta de crédito
    const dstMat = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      0, 0,
      CREDIT_CARD_WIDTH, 0,
      CREDIT_CARD_WIDTH, CREDIT_CARD_HEIGHT,
      0, CREDIT_CARD_HEIGHT,
    ]);
    
    const M = window.cv.getPerspectiveTransform(srcMat, dstMat);
    transformMatrixRef.current = M;
    isCalibratedRef.current = true; // Actualizar ref primero
    setIsCalibrated(true);
    setStatus('הכיול הושלם! כעת תוכל למדוד מרחקים.');
    setShowCalibrationModal(false);
    
    console.log('[MeasurementTool] Calibración completada, isCalibrated = true');
    
    srcMat.delete();
    dstMat.delete();
  };

  const handleCalibrate = () => {
    const realW = parseFloat(calibrationWidth);
    const realH = parseFloat(calibrationHeight);
    
    if (realW <= 0 || realH <= 0 || isNaN(realW) || isNaN(realH)) {
      return;
    }
    
    if (!window.cv) return;
    
    // Limpiar matriz anterior si existe
    if (transformMatrixRef.current) {
      transformMatrixRef.current.delete();
    }
    
    const srcMat = window.cv.matFromArray(
      4,
      1,
      window.cv.CV_32FC2,
      refPoints.flatMap((p) => [p.x, p.y])
    );
    
    const dstMat = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      0, 0,
      realW, 0,
      realW, realH,
      0, realH,
    ]);
    
    const M = window.cv.getPerspectiveTransform(srcMat, dstMat);
    transformMatrixRef.current = M;
    isCalibratedRef.current = true; // Actualizar ref primero
    setIsCalibrated(true);
    setStatus('הכיול הושלם! כעת תוכל למדוד מרחקים.');
    setShowCalibrationModal(false);
    setCalibrationWidth('');
    setCalibrationHeight('');
    
    console.log('[MeasurementTool] Calibración completada (manual), isCalibrated = true');
    
    srcMat.delete();
    dstMat.delete();
  };

  const calculateDistance = (points: Point[]) => {
    if (!transformMatrixRef.current || !window.cv || points.length < 2) return;
    
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    
    const srcPts = window.cv.matFromArray(2, 1, window.cv.CV_32FC2, [
      p1.x, p1.y,
      p2.x, p2.y,
    ]);
    
    const dstPts = new window.cv.Mat();
    window.cv.perspectiveTransform(srcPts, dstPts, transformMatrixRef.current);
    
    const dist = Math.sqrt(
      Math.pow(dstPts.data32F[2] - dstPts.data32F[0], 2) +
      Math.pow(dstPts.data32F[3] - dstPts.data32F[1], 2)
    );
    
    // Agregar a la lista de mediciones
    const newMeasurement: Measurement = {
      id: Date.now().toString(),
      distance: dist,
      timestamp: new Date(),
    };
    setMeasurements((prev) => [newMeasurement, ...prev]);
    
    srcPts.delete();
    dstPts.delete();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[MeasurementTool] handleFileSelect llamado', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log('[MeasurementTool] Archivo seleccionado:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      loadImage(file);
    } else {
      console.warn('[MeasurementTool] No se seleccionó ningún archivo');
    }
  };

  const reset = () => {
    if (imgOriginalRef.current && imgMainRef.current && window.cv) {
      // Limpiar imagen actual
      imgMainRef.current.delete();
      // Clonar imagen original
      const imgM = imgOriginalRef.current.clone();
      imgMainRef.current = imgM;
      if (mainCanvasRef.current) {
        window.cv.imshow(mainCanvasRef.current, imgM);
      }
    }
    if (transformMatrixRef.current) {
      transformMatrixRef.current.delete();
      transformMatrixRef.current = null;
    }
    setRefPoints([]);
    setMeasurementPoints([]);
    isCalibratedRef.current = false; // Actualizar ref también
    setIsCalibrated(false);
    setMeasurements([]);
    setShowCreditCard(false);
    setControlMode('none');
    setStatus('מוכן. בחר 4 נקודות לכיול או presiona C para usar tarjeta de crédito.');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header mejorado */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Ruler className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">כלי מדידה עם OpenCV</h2>
                <p className="text-sm text-emerald-100">מדידת מרחקים מדויקת מתמונות</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              aria-label="סגור חלון"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 overflow-hidden flex">
            {/* Panel izquierdo - Canvas */}
            <div className="flex-1 flex flex-col p-6 min-w-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">{status}</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Barra de estado y controles */}
                  <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        isCalibrated 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : hasImage
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {isCalibrated ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {isCalibrated 
                            ? 'מוכן למדידה' 
                            : hasImage 
                            ? 'נדרש כיול' 
                            : 'טען תמונה תחילה'}
                        </span>
                      </div>
                      {showCreditCard && (
                        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                          controlMode === 'move' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                          controlMode === 'rotate' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                          controlMode === 'scale' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                          'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {controlMode === 'move' ? 'Mover (G)' :
                             controlMode === 'rotate' ? 'Rotar (R)' :
                             controlMode === 'scale' ? 'Escalar (S)' :
                             'Tarjeta activa'}
                          </span>
                        </div>
                      )}
                      {!isCalibrated && refPoints.length > 0 && (
                        <div className="px-3 py-1.5 bg-slate-100 rounded-lg">
                          <span className="text-sm text-slate-700">
                            נקודות: <span className="font-semibold">{refPoints.length}/4</span>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => {
                          console.log('[MeasurementTool] Botón de subir foto clickeado', {
                            hasFileInput: !!fileInputRef.current,
                            isLoading,
                            hasOpenCV: !!window.cv
                          });
                          fileInputRef.current?.click();
                        }}
                        disabled={isLoading}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        טען תמונה
                      </button>
                      {hasImage && (
                        <button
                          onClick={reset}
                          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          איפוס
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Canvas principal - Ocupa todo el espacio disponible */}
                  <div className="flex-1 min-h-0">
                    <div 
                      ref={canvasContainerRef}
                      className="w-full h-full bg-slate-50 rounded-lg p-4 flex items-center justify-center border-2 border-dashed border-slate-300 relative"
                    >
                      {/* Canvas siempre renderizado pero oculto cuando no hay imagen */}
                      <canvas
                        ref={mainCanvasRef}
                        className={`max-w-full max-h-full rounded-lg shadow-lg ${
                          hasImage 
                            ? (controlMode !== 'none' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair')
                            : 'hidden'
                        }`}
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                      />
                      {!hasImage && (
                        <div className="text-center py-12 absolute inset-0 flex flex-col items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600 font-medium mb-2">אין תמונה נטענת</p>
                          <p className="text-sm text-slate-500">טען תמונה כדי להתחיל</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Panel derecho - Información y mediciones */}
            <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Instrucciones */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-slate-800">הוראות שימוש</h3>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex gap-2">
                      <span className="font-semibold text-emerald-600">1.</span>
                      <span>טען תמונה של החדר או הסביבה</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-emerald-600">2.</span>
                      <span>Presiona <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">C</kbd> para mostrar tarjeta de crédito</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-emerald-600">3.</span>
                      <span>Controles: <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">G</kbd> Mover, <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">R</kbd> Rotar, <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">S</kbd> Escalar, Rueda para zoom</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-emerald-600">4.</span>
                      <span>Presiona <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">C</kbd> de nuevo para usar las esquinas de la tarjeta como calibración</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold text-emerald-600">5.</span>
                      <span>לחץ על שתי נקודות למדידת המרחק ביניהן</span>
                    </div>
                  </div>
                </div>

                {/* Estado actual */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-3">מצב נוכחי</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">נקודות כיול:</span>
                      <span className="font-semibold text-slate-800">
                        {refPoints.length}/4
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">נקודות מדידה:</span>
                      <span className="font-semibold text-slate-800">
                        {measurementPoints.length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">מדידות שבוצעו:</span>
                      <span className="font-semibold text-emerald-600">
                        {measurements.length}
                      </span>
                    </div>
                    {showCreditCard && (
                      <>
                        <div className="border-t border-slate-200 pt-2 mt-2">
                          <div className="text-xs font-semibold text-slate-500 mb-1">Tarjeta de Crédito</div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Escala:</span>
                            <span className="font-semibold text-slate-800">
                              {(creditCardTransform.scale * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Rotación:</span>
                            <span className="font-semibold text-slate-800">
                              {(creditCardTransform.rotationZ * 180 / Math.PI).toFixed(0)}°
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Controles de tarjeta */}
                {hasImage && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      Controles de Tarjeta
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setShowCreditCard(!showCreditCard);
                          if (!showCreditCard) setControlMode('move');
                          else setControlMode('none');
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          showCreditCard
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {showCreditCard ? 'Ocultar Tarjeta' : 'Mostrar Tarjeta (C)'}
                      </button>
                      {showCreditCard && (
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setControlMode('move')}
                            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                              controlMode === 'move'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Move className="w-3 h-3" />
                            Mover (G)
                          </button>
                          <button
                            onClick={() => setControlMode('rotate')}
                            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                              controlMode === 'rotate'
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <RotateCw className="w-3 h-3" />
                            Rotar (R)
                          </button>
                          <button
                            onClick={() => setControlMode('scale')}
                            className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                              controlMode === 'scale'
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <ZoomIn className="w-3 h-3" />
                            Escalar (S)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Historial de mediciones */}
                {measurements.length > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-emerald-600" />
                      מדידות אחרונות
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {measurements.map((measurement) => (
                        <div
                          key={measurement.id}
                          className="bg-emerald-50 border border-emerald-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg font-bold text-emerald-700">
                              {measurement.distance.toFixed(2)} ס"מ
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {measurement.timestamp.toLocaleTimeString('he-IL')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Indicador de progreso de calibración */}
                {!isCalibrated && refPoints.length > 0 && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-3">התקדמות כיול</h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].map((num) => (
                          <div
                            key={num}
                            className={`flex-1 h-2 rounded-full transition-colors ${
                              refPoints.length >= num
                                ? 'bg-emerald-500'
                                : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 text-center">
                        {refPoints.length === 4
                          ? 'הזן את המידות האמיתיות'
                          : `נקודה ${refPoints.length + 1} מתוך 4`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de calibración mejorado */}
      {showCalibrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 rounded-t-xl">
              <h3 className="text-lg font-bold">הזן מידות כיול</h3>
              <p className="text-sm text-emerald-100 mt-1">הזן את המידות האמיתיות של המלבן</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  רוחב המלבן (ס״מ)
                </label>
                <input
                  type="number"
                  value={calibrationWidth}
                  onChange={(e) => setCalibrationWidth(e.target.value)}
                  placeholder="לדוגמה: 50"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  אורך המלבן (ס״מ)
                </label>
                <input
                  type="number"
                  value={calibrationHeight}
                  onChange={(e) => setCalibrationHeight(e.target.value)}
                  placeholder="לדוגמה: 30"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCalibrate();
                    }
                  }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCalibrate}
                  disabled={!calibrationWidth || !calibrationHeight || parseFloat(calibrationWidth) <= 0 || parseFloat(calibrationHeight) <= 0}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  אישור כיול
                </button>
                <button
                  onClick={() => {
                    setShowCalibrationModal(false);
                    setRefPoints([]);
                    reset();
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
