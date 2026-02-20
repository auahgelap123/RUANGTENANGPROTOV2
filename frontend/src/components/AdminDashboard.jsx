import { useEffect } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { ShieldCheck, X, Zap, Clock, Lock, Map } from "lucide-react"; // <-- Tambah Map;

const AdminDashboard = ({ onClose }) => {
  // <-- Tambah resetUserQuests di sini
  const { adminUsers, fetchAllUsers, updateRole, updateUserPoints, updateUserTime, resetUserQuests, isLoading } = useAdminStore()

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center bg-black/50 text-white z-[999]">Loading data...</div>;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-base-100 w-full max-w-4xl h-[80vh] rounded-xl flex flex-col relative shadow-2xl border border-base-300 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200 shrink-0">
          <h2 className="font-bold text-xl flex items-center gap-2 text-primary">
            <ShieldCheck className="size-6 shrink-0" /> <span className="truncate">Admin Control Panel</span>
          </h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost hover:bg-red-500 hover:text-white shrink-0">
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {adminUsers.length === 0 && !isLoading && (
            <div className="text-center text-zinc-500 py-10">Belum ada user.</div>
          )}

          {adminUsers.map((user) => (
            <div key={user._id} className="flex flex-col bg-base-200 hover:bg-base-300 transition-colors p-4 rounded-xl gap-4 border border-base-300">
              
              {/* --- BARIS ATAS: Info User & Role --- */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                {/* User Info */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="avatar shrink-0">
                    <div className="mask mask-squircle w-12 h-12 bg-base-100">
                      <img src={user.profilePic || "/avatar.png"} alt="Avatar" className="object-cover" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-base truncate">{user.fullName}</div>
                    <div className="text-xs opacity-60 truncate">{user.email}</div>
                  </div>
                </div>
                
                {/* Role & Actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-none border-base-300">
                  <span className={`badge shrink-0 ${
                    user.role === 'admin' ? 'badge-error text-white' : 
                    user.role === 'volunteer' ? 'badge-primary text-white' : 'badge-ghost'
                  }`}>
                    {user.role}
                  </span>
                  
                  <div className="shrink-0">
                    {user.role !== "admin" && (
                        <>
                            {user.role !== "volunteer" ? (
                                <button 
                                    onClick={() => updateRole(user._id, "volunteer")}
                                    className="btn btn-sm btn-outline btn-primary"
                                >
                                    Jadikan Relawan
                                </button>
                            ) : (
                                <button 
                                    onClick={() => updateRole(user._id, "user")}
                                    className="btn btn-sm btn-outline btn-warning"
                                >
                                    Copot Relawan
                                </button>
                            )}
                        </>
                    )}
                    {user.role === "admin" && <span className="text-xs text-zinc-400 italic font-bold px-2">MASTER</span>}
                  </div>
                </div>
              </div>

              {/* --- BARIS BAWAH: God Mode Controls --- */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-base-100 rounded-lg border border-base-300 gap-3 w-full">
                
                {/* Status Poin & Waktu saat ini */}
                <div className="flex gap-4 text-xs font-bold shrink-0">
                    <span className="flex items-center gap-1 text-yellow-500">
                        <Zap className="size-4" /> {user.points || 0} Poin
                    </span>
                    <span className={`flex items-center gap-1 ${new Date(user.chatAccessUntil || Date.now()) > new Date() ? "text-success" : "text-error"}`}>
                        <Clock className="size-4" /> 
                        {new Date(user.chatAccessUntil || Date.now()) > new Date() ? "Chat Aktif" : "Waktu Habis 🔒"}
                    </span>
                </div>

                {/* Tombol-tombol Sakti */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button onClick={() => updateUserPoints(user._id, 50)} className="btn btn-xs btn-outline btn-warning flex-1 sm:flex-none">
                        +50 ⚡
                    </button>
                    <button onClick={() => updateUserPoints(user._id, -50)} className="btn btn-xs btn-outline btn-error flex-1 sm:flex-none">
                        -50 ⚡
                    </button>
                    <button onClick={() => updateUserTime(user._id, 'expire')} className="btn btn-xs btn-outline btn-error gap-1 flex-1 sm:flex-none">
                        <Lock className="size-3"/> Reset Waktu
                    </button>
                    <button onClick={() => updateUserTime(user._id, 'add', 4)} className="btn btn-xs btn-outline btn-info gap-1 flex-1 sm:flex-none">
                        <Clock className="size-3"/> +4 Jam
                    </button>
                    <button onClick={() => resetUserQuests(user._id)} className="btn btn-xs btn-outline btn-accent gap-1 flex-1 sm:flex-none">
                        <Map className="size-3"/> Reset Quest
                    </button>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;