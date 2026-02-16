import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
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
      set((state) => ({
        unreadMessages: { ...state.unreadMessages, [userId]: 0 }
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

  // --- FITUR TEMAN (BARU) ---
  
  // 1. Kirim Request / Add Volunteer
  sendRequest: async (userId) => {
    try {
        const res = await axiosInstance.post(`/users/request/${userId}`);
        if(res.data.status === "connected") {
            toast.success("Berhasil terhubung!");
        } else {
            toast.success("Permintaan pertemanan dikirim!");
        }
        await useAuthStore.getState().checkAuth(); // Refresh data diri
        get().getUsers(); // Refresh list user biar status update
    } catch (error) {
        toast.error(error.response?.data?.message || "Gagal");
    }
  },

  // 2. Terima Request
  acceptRequest: async (userId) => {
      try {
          await axiosInstance.post(`/users/accept/${userId}`);
          toast.success("Pertemanan diterima!");
          await useAuthStore.getState().checkAuth();
          get().getUsers();
      } catch (error) {
          toast.error("Gagal menerima");
      }
  },

  // 3. Unfriend
  removeContact: async (userId) => {
      if(!window.confirm("Yakin mau hapus teman ini?")) return;
      
      try {
          await axiosInstance.post(`/users/remove/${userId}`);
          toast.success("Kontak dihapus.");
          set({ selectedUser: null }); // Tutup chat kalo lagi dibuka
          await useAuthStore.getState().checkAuth();
      } catch (error) {
          toast.error("Gagal menghapus");
      }
  },

  // ... (Socket logic sama kayak sebelumnya) ...
  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;
      if (isMessageSentFromSelectedUser) {
        set({ messages: [...get().messages, newMessage] });
      } else {
        set((state) => ({
            unreadMessages: {
                ...state.unreadMessages,
                [newMessage.senderId]: (state.unreadMessages[newMessage.senderId] || 0) + 1
            }
        }));
      }
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },
  setSelectedUser: (selectedUser) => {
      set((state) => ({ selectedUser, unreadMessages: { ...state.unreadMessages, [selectedUser?._id]: 0 } }));
  },
}));