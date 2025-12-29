
import { create } from 'zustand';

type QuickCreateStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const useQuickCreate = create<QuickCreateStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
