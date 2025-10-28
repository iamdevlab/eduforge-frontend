// src/stores/useUpgradeModalStore.ts
import { create } from 'zustand';

interface ModalState {
    isOpen: boolean;
    showModal: () => void;
    closeModal: () => void;
}

export const useUpgradeModalStore = create<ModalState>((set) => ({
    isOpen: false,
    showModal: () => set({ isOpen: true }),
    closeModal: () => set({ isOpen: false }),
}));