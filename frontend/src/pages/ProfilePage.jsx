import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Zap, Clock, Trophy, Star } from "lucide-react";

const ProfilePage = () => {
  // Pastikan buyTime udah ada di useAuthStore lo ya bro!
  const { authUser, isUpdatingProfile, updateProfile, buyTime } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isBuying, setIsBuying] = useState(false);

  // --- LOGIC COUNTDOWN SISA WAKTU CHAT ---
  useEffect(() => {
    const calculateTime = () => {
      if (!authUser?.chatAccessUntil) return "Waktu Habis 🔒";
      const now = new Date();
      const accessTime = new Date(authUser.chatAccessUntil);
      
      if (now > accessTime) return "Waktu Habis 🔒";
      
      const diff = accessTime - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} Jam ${minutes} Menit`;
    };

    setTimeLeft(calculateTime());
    // Update tulisan tiap 1 menit
    const interval = setInterval(() => setTimeLeft(calculateTime()), 60000); 
    return () => clearInterval(interval);
  }, [authUser?.chatAccessUntil]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleBuyTime = async () => {
    setIsBuying(true);
    await buyTime();
    setIsBuying(false);
  };

  return (
    <div className="h-screen pt-20 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold ">Profile</h1>
            <p className="mt-2 text-zinc-400">Your profile information</p>
          </div>

          {/* --- AVATAR UPLOAD SECTION --- */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-base-200"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
            </p>
          </div>

          {/* --- BASIC INFO SECTION --- */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300 font-medium">
                {authUser?.fullName} 
                {authUser?.role === "admin" && <span className="badge badge-error badge-sm text-white ml-2">Admin</span>}
                {authUser?.role === "volunteer" && <span className="badge badge-primary badge-sm text-white ml-2">Relawan</span>}
                {authUser?.role === "psychologist" && <span className="badge badge-warning badge-sm ml-2">Psikolog</span>}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-base-200 rounded-lg border border-base-300">{authUser?.email}</p>
            </div>
          </div>

          {/* --- STATS & DIGITAL WELLBEING SECTION (NEW) --- */}
          <div className="mt-6 bg-base-200 rounded-xl p-6 border border-base-300 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" /> Stats & Wellbeing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-base-100 p-4 rounded-lg flex items-center gap-4 border border-base-300">
                    <div className="p-3 bg-primary/10 rounded-full text-primary"><Zap className="w-6 h-6" /></div>
                    <div>
                        <div className="text-xs text-zinc-500 font-bold">Energi Sosial</div>
                        <div className="text-xl font-black">{authUser?.points || 0} <span className="text-sm font-medium">Poin</span></div>
                    </div>
                </div>
                
                <div className="bg-base-100 p-4 rounded-lg flex items-center gap-4 border border-base-300">
                    <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500"><Trophy className="w-6 h-6" /></div>
                    <div>
                        <div className="text-xs text-zinc-500 font-bold">Game Arcade</div>
                        <div className="text-xl font-black">{authUser?.gameWins || 0} <span className="text-sm font-medium">Menang</span></div>
                    </div>
                </div>
            </div>

            <div className="bg-base-100 rounded-xl p-4 border border-base-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${timeLeft.includes("Habis") ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-bold">Akses Chat Room</div>
                            <div className={`text-sm ${timeLeft.includes("Habis") ? "text-error font-bold" : "text-zinc-500"}`}>
                                {timeLeft}
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleBuyTime} 
                        disabled={isBuying || authUser?.points < 50}
                        className="btn btn-primary btn-sm gap-2"
                    >
                        {isBuying ? <span className="loading loading-spinner size-4"></span> : <Zap className="w-4 h-4" />}
                        Tukar 50 Poin
                    </button>
                </div>
                {authUser?.points < 50 && timeLeft.includes("Habis") && (
                    <div className="mt-3 text-xs text-error text-center bg-error/10 p-2 rounded-lg">
                        Energi kamu tidak cukup. Kerjakan Quest hari ini untuk mendapatkan energi tambahan!
                    </div>
                )}
            </div>
          </div>

          {/* --- ACCOUNT INFO SECTION --- */}
          <div className="mt-6 bg-base-200 rounded-xl p-6 border border-base-300 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span className="text-zinc-400">Member Since</span>
                <span className="font-medium">{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-base-300">
                <span className="text-zinc-400">Total EXP</span>
                <span className="font-medium">{authUser?.exp || 0} XP</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-zinc-400">Account Status</span>
                <span className="text-success font-bold">Active</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;