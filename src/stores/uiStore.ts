import { create } from 'zustand';

interface UIState {
  viewMode: '2d' | '3d';
  showLeftPanel: boolean;
  showRightPanel: boolean;
  showHelp: boolean;
  showPhotoModal: boolean;
  showHomeSelector: boolean;
  showRCCarPanel: boolean;
  showMeasurementTool: boolean;
  showRobotMeasurement: boolean;
  showWelcomeScreen: boolean;
  cameraEnabled: boolean;
  setViewMode: (mode: '2d' | '3d') => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleHelp: () => void;
  setShowPhotoModal: (show: boolean) => void;
  setShowHomeSelector: (show: boolean) => void;
  setShowRCCarPanel: (show: boolean) => void;
  setShowMeasurementTool: (show: boolean) => void;
  setShowRobotMeasurement: (show: boolean) => void;
  setShowWelcomeScreen: (show: boolean) => void;
  setCameraEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: '3d',
  showLeftPanel: true,
  showRightPanel: true,
  showHelp: false,
  showPhotoModal: false,
  showHomeSelector: false,
  showRCCarPanel: false,
  showMeasurementTool: false,
  showRobotMeasurement: false,
  showWelcomeScreen: true,
  cameraEnabled: false,
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleLeftPanel: () => set((state) => ({ showLeftPanel: !state.showLeftPanel })),
  toggleRightPanel: () => set((state) => ({ showRightPanel: !state.showRightPanel })),
  toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
  setShowPhotoModal: (show) => set({ showPhotoModal: show }),
  setShowHomeSelector: (show) => set({ showHomeSelector: show }),
  setShowRCCarPanel: (show) => set({ showRCCarPanel: show }),
  setShowMeasurementTool: (show) => set({ showMeasurementTool: show }),
  setShowRobotMeasurement: (show) => set({ showRobotMeasurement: show }),
  setShowWelcomeScreen: (show) => set({ showWelcomeScreen: show }),
  setCameraEnabled: (enabled) => set({ cameraEnabled: enabled }),
}));

