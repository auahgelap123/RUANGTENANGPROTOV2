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
    // Loading state dimatiin biar gak blinking pas auto-refresh
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      console.error(error);
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      set((state) => ({ unreadMessages: { ...state.unreadMessages, [userId]: 0 } }));
    } catch (error) {
      toast.error("Gagal load chat");
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
      toast.error("Gagal kirim pesan");
    }
  },

  // --- ACTIONS TEMAN ---
  sendRequest: async (userId) => {
    try {
        await axiosInstance.post(`/users/request/${userId}`);
        toast.success("Request terkirim!");
        get().getUsers(); // Refresh manual
    } catch (error) {
        toast.error(error.response?.data?.message || "Gagal");
    }
  },

  acceptRequest: async (userId) => {
      try {
          await axiosInstance.post(`/users/accept/${userId}`);
          toast.success("Pertemanan diterima!");
          get().getUsers();
          useAuthStore.getState().checkAuth(); // Update list kontak sendiri
      } catch (error) {
          toast.error("Gagal accept");
      }
  },

  removeContact: async (userId) => {
      if(!window.confirm("Yakin mau hapus/batalin?")) return;
      try {
          await axiosInstance.post(`/users/remove/${userId}`);
          toast.success("Dihapus.");
          set({ selectedUser: null });
          get().getUsers();
          useAuthStore.getState().checkAuth();
      } catch (error) {
          toast.error("Gagal hapus");
      }
  },

  // --- SOCKET ---
  subscribeToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;
      if (isMessageSentFromSelectedUser) {
        set({ messages: [...get().messages, newMessage] });
      } else {
        set((state) => ({ unreadMessages: { ...state.unreadMessages, [newMessage.senderId]: (state.unreadMessages[newMessage.senderId] || 0) + 1 } }));
      }
    });

    // AUTO REFRESH LIST TEMAN
    socket.on("friendUpdate", () => {
        console.log("Friend update detected!");
        get().getUsers();
        useAuthStore.getState().checkAuth();
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("friendUpdate");
  },

  setSelectedUser: (selectedUser) => {
      set((state) => ({ selectedUser, unreadMessages: { ...state.unreadMessages, [selectedUser?._id]: 0 } }));
  },
}));