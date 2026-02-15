import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore"; // Import store sebelah buat ambil Socket

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  
  // STATE BARU: Buat nyimpen jumlah notifikasi per user { userId: jumlah }
  unreadMessages: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });

      // LOGIC BARU: Pas buka chat user ini, reset notifikasinya jadi 0
      set((state) => ({
        unreadMessages: {
            ...state.unreadMessages,
            [userId]: 0, 
        }
      }));

    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // --- LOGIC SOCKET PINTAR (CHAT + NOTIF) ---
  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket; // Pinjem socket dari AuthStore

    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;

      // Skenario 1: Kita lagi chat sama dia -> Masukin pesannya ke layar
      if (isMessageSentFromSelectedUser) {
        set({ messages: [...get().messages, newMessage] });
      } 
      // Skenario 2: Kita lagi GAK chat sama dia -> Tambah angka Notifikasi (+1)
      else {
        set((state) => ({
            unreadMessages: {
                ...state.unreadMessages,
                [newMessage.senderId]: (state.unreadMessages[newMessage.senderId] || 0) + 1
            }
        }));
        
        // Optional: Bunyi notif atau toast kecil
        // toast.success("Pesan baru masuk!"); 
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },

  // Update setSelectedUser buat reset notif juga pas diklik
  setSelectedUser: (selectedUser) => {
      set((state) => ({ 
          selectedUser,
          // Reset notif user yang baru diklik
          unreadMessages: {
            ...state.unreadMessages,
            [selectedUser?._id]: 0 
          }
      }));
  },
}));