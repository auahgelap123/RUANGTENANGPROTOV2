import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
      
      // Jeda bentar biar toast suksesnya kebaca sebelum hard refresh
      setTimeout(() => {
          window.location.reload();
      }, 500);

    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout"); 
      set({ authUser: null });
      get().disconnectSocket();
      
      // Hard refresh biar cache bener-bener bersih
      window.location.reload(); 
      
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: { userId: authUser._id },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },

  // --- FUNGSI OPTIMISTIC UI UNTUK CONTACT ---
  addContactLocal: (newContactId) => {
      set((state) => ({
          authUser: {
              ...state.authUser,
              contacts: [...(state.authUser.contacts || []), newContactId],
              friendRequests: state.authUser.friendRequests?.filter(id => id !== newContactId) || []
          }
      }));
  },

  removeContactLocal: (contactId) => {
      set((state) => ({
          authUser: {
              ...state.authUser,
              contacts: state.authUser.contacts?.filter(id => id !== contactId) || [],
              friendRequests: state.authUser.friendRequests?.filter(id => id !== contactId) || []
          }
      }));
  },

  // --- FUNGSI TUKAR POIN / ENERGI DENGAN WAKTU CHAT ---
  buyTime: async (packageKey) => {
    try {
      // Pastikan '/users/buy-time' sesuai dengan penamaan route user lo di app.js/server.js
      // Kalau error 404, coba ganti jadi '/auth/buy-time' (tergantung lo naruh router-nya di mana)
      const res = await axiosInstance.post("/users/buy-time", { packageKey }); 
      
      // Update UI seketika tanpa perlu refresh
      set((state) => ({
        authUser: {
          ...state.authUser,
          points: res.data.points,
          chatAccessUntil: res.data.chatAccessUntil
        }
      }));
      
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menukar energi");
    }
  },

}));