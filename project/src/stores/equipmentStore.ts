import { create } from 'zustand';

interface EquipmentState {
  selectedEquipmentId: string | null;
  draggingEquipment: any | null;
  selectEquipment: (id: string | null) => void;
  setDraggingEquipment: (equipment: any | null) => void;
  clearSelection: () => void;
}

export const useEquipmentStore = create<EquipmentState>((set) => ({
  selectedEquipmentId: null,
  draggingEquipment: null,
  selectEquipment: (id: string | null) => set({ selectedEquipmentId: id }),
  setDraggingEquipment: (equipment: any | null) => set({ draggingEquipment: equipment }),
  clearSelection: () => set({ selectedEquipmentId: null }),
}));

