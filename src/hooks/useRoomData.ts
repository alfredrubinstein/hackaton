import { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { Room, Installation, MedicalEquipment } from '../types';

export function useRoomData(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [equipment, setEquipment] = useState<MedicalEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [roomData, installationsData, equipmentData] = await Promise.all([
          dataService.getRoom(roomId),
          dataService.getInstallationsByRoom(roomId),
          dataService.getMedicalEquipmentByRoom(roomId)
        ]);

        setRoom(roomData);
        setInstallations(installationsData);
        setEquipment(equipmentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading room data');
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [roomId]);

  return { room, installations, equipment, loading, error, setEquipment };
}
