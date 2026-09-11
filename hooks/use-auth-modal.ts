import { create } from "zustand";

interface AuthModalStore {
  isOpen: boolean;
  redirectUrl?: string;
  onOpen: (redirectUrl?: string) => void;
  onClose: () => void;
}

/**
 * Manages the state of the user authentication modal:
 * - `isOpen`: whether the modal is open or not
 * - `redirectUrl`: optional url to redirect to after successful login
 * - `onOpen`: function to open the modal
 * - `onClose`: function to close the modal
 */
const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  redirectUrl: undefined,
  onOpen: (redirectUrl?: string) => set({ isOpen: true, redirectUrl }),
  onClose: () => set({ isOpen: false, redirectUrl: undefined }),
}));

export default useAuthModal;
