import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAdminStore = create((set) => ({
  adminUsers: [],
  isLoading: false,

  fetchAllUsers: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/admin/users");
      set({ adminUsers: res.data });
    } catch (error) {
      toast.error("Gagal load data user");
    } finally {
      set({ isLoading: false });
    }
  },

  updateRole: async (userId, newRole) => {
    try {
      await axiosInstance.put(`/admin/update-role/${userId}`, { role: newRole });
      toast.success(`Role berhasil diubah jadi ${newRole}`);
      
      // Update state lokal biar gak perlu refresh halaman
      set((state) => ({
        adminUsers: state.adminUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        ),
      }));
    } catch (error) {
      toast.error("Gagal update role");
    }
  },

  // --- FITUR GOD MODE 1: TAMBAH/KURANG POIN ---
  updateUserPoints: async (userId, pointsToAdd) => {
    try {
      // Panggil endpoint admin untuk poin
      const res = await axiosInstance.post(`/users/admin/points/${userId}`, { pointsToAdd });
      toast.success(res.data.message);
      
      // Update state poin di table admin secara instan
      set((state) => ({
        adminUsers: state.adminUsers.map((user) =>
          user._id === userId ? { ...user, points: res.data.points } : user
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal update poin");
    }
  },

  // --- FITUR GOD MODE 2: RESET / TAMBAH WAKTU CHAT ---
  updateUserTime: async (userId, action, hoursToAdd = 0) => {
    try {
      // action = "expire" (reset ke nol/habis) atau "add" (tambah jam)
      const res = await axiosInstance.post(`/users/admin/time/${userId}`, { action, hoursToAdd });
      toast.success(res.data.message);
      
      // Update state waktu di table admin secara instan
      set((state) => ({
        adminUsers: state.adminUsers.map((user) =>
          user._id === userId ? { ...user, chatAccessUntil: res.data.chatAccessUntil } : user
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal update waktu chat");
    }
  }, // <--- INI DIA KOMANYA BRO!

  // --- FITUR GOD MODE 3: RESET QUEST ---
  resetUserQuests: async (userId) => {
    try {
      // Panggil endpoint admin untuk reset quest
      const res = await axiosInstance.post(`/quests/admin-reset/${userId}`);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal reset quest");
    }
  }
}));