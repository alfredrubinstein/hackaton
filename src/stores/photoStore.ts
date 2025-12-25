import { create } from 'zustand';
import type { PhotoFile } from '../components/PhotoUploader';
import type { GeneratedRoomData } from '../services/roomGeneratorService';

interface PhotoState {
  uploadedPhotos: PhotoFile[];
  isAnalyzing: boolean;
  generatedRoomData: GeneratedRoomData | null;
  analysisError: string | null;
  setPhotos: (photos: PhotoFile[]) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setGeneratedData: (data: GeneratedRoomData | null) => void;
  setAnalysisError: (error: string | null) => void;
  clear: () => void;
}

export const usePhotoStore = create<PhotoState>((set) => ({
  uploadedPhotos: [],
  isAnalyzing: false,
  generatedRoomData: null,
  analysisError: null,
  setPhotos: (photos) => set({ uploadedPhotos: photos }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setGeneratedData: (data) => set({ generatedRoomData: data }),
  setAnalysisError: (error) => set({ analysisError: error }),
  clear: () => set({
    uploadedPhotos: [],
    isAnalyzing: false,
    generatedRoomData: null,
    analysisError: null,
  }),
}));

