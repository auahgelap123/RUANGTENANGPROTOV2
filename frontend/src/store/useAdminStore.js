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
}));