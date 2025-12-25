export interface Position {
  x: number;
  y: number;
  theta: number;
}

export interface EncoderCounts {
  left: number;
  right: number;
}

export interface RoomVertex {
  x: number;
  y: number;
}

export class RCCarController {
  constructor();
  position: Position;
  encoderCounts: EncoderCounts;
  velocity: { left: number; right: number };
  pathHistory: Position[];
  isConnected: boolean;
  isRunning: boolean;
  onPositionUpdate: ((pos: Position, encoders: EncoderCounts) => void) | null;
  onPathUpdate: ((path: Position[]) => void) | null;
  onConnectionChange: ((connected: boolean) => void) | null;
  roomBounds: RoomVertex[] | null;
  collisionDetected: boolean;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  forward(speed: number): Promise<void>;
  backward(speed: number): Promise<void>;
  turnLeft(speed: number): Promise<void>;
  turnRight(speed: number): Promise<void>;
  stop(): Promise<void>;
  resetOdometry(): void;
  setRoomBounds(vertices: RoomVertex[]): void;
}

