import { create } from 'zustand';

interface NotificationState {
  announcement: string;
  setAnnouncement: (message: string) => void;
  clearAnnouncement: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  announcement: '',
  setAnnouncement: (message: string) => set({ announcement: message }),
  clearAnnouncement: () => set({ announcement: '' }),
}));

