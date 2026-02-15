import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Shield } from "lucide-react"; // Shield digabung kesini
import { useState } from "react"; // <--- INI PENTING (Wajib Import)
import AdminDashboard from "./AdminDashboard";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  
  // Logic State harus DI DALAM fungsi komponen, bukan di luar
  const [showAdminPanel, setShowAdminPanel] = useState(false); 

  return (
    <>
      <header
        className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80"
      >
        <div className="container mx-auto px-4 h-16">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-lg font-bold">Ruang-Tenang</h1>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              
              {/* --- TOMBOL ADMIN (CUMA MUNCUL KALAU ADMIN) --- */}
              {/* Posisinya di sini, sejajar sama Settings */}
              {authUser?.role === "admin" && (
                <button 
                  onClick={() => setShowAdminPanel(true)}
                  className="btn btn-sm gap-2 btn-error btn-outline animate-pulse"
                  title="Admin Panel"
                >
                  <Shield className="size-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              )}

              <Link
                to={"/settings"}
                className={`btn btn-sm gap-2 transition-colors`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>

              {authUser && (
                <>
                  <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                    <User className="size-5" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>

                  <button className="flex gap-2 items-center" onClick={logout}>
                    <LogOut className="size-5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- RENDER DASHBOARD --- */}
      {/* Posisinya di luar <header>, tapi masih di dalam return fragment (<>...</>) */}
      {showAdminPanel && <AdminDashboard onClose={() => setShowAdminPanel(false)} />}
    </>
  );
};

export default Navbar;