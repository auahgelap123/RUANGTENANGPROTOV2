import { useEffect } from "react";
import { useAdminStore } from "../store/useAdminStore";
import { ShieldCheck, X } from "lucide-react";

const AdminDashboard = ({ onClose }) => {
  const { adminUsers, fetchAllUsers, updateRole, isLoading } = useAdminStore();

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center bg-black/50 text-white z-50">Loading data...</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-base-100 w-full max-w-4xl h-[80vh] rounded-xl flex flex-col relative shadow-2xl border border-base-300">
        
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200 rounded-t-xl">
          <h2 className="font-bold text-xl flex items-center gap-2 text-primary">
            <ShieldCheck className="size-6" /> Admin Control Panel
          </h2>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost hover:bg-red-500 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="table w-full table-pin-rows">
            <thead className="text-base-content">
              <tr>
                <th>User Info</th>
                <th>Role Saat Ini</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user._id} className="hover:bg-base-200">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-10 h-10">
                          <img src={user.profilePic || "/avatar.png"} alt="Avatar" />
                        </div>
                      </div>
                      <div>
                        <div className="font-bold">{user.fullName}</div>
                        <div className="text-xs opacity-50">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      user.role === 'admin' ? 'badge-error text-white' : 
                      user.role === 'volunteer' ? 'badge-primary text-white' : 'badge-ghost'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="flex justify-center gap-2">
                    {user.role !== "admin" && (
                        <>
                            {user.role !== "volunteer" ? (
                                <button 
                                    onClick={() => updateRole(user._id, "volunteer")}
                                    className="btn btn-xs btn-outline btn-primary"
                                >
                                    Jadikan Relawan
                                </button>
                            ) : (
                                <button 
                                    onClick={() => updateRole(user._id, "user")}
                                    className="btn btn-xs btn-outline btn-warning"
                                >
                                    Copot Relawan
                                </button>
                            )}
                        </>
                    )}
                    {user.role === "admin" && <span className="text-xs text-zinc-400 italic font-bold">MASTER</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;