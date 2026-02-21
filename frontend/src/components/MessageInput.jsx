import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGameStore } from "../store/useGameStore.jsx"; 
import { Image, Send, X, Music, Link as LinkIcon, Lock, Zap, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

const TIME_PACKAGES = [
    { id: '30m', label: '30 Menit', cost: 10 },
    { id: '1h', label: '1 Jam', cost: 20 },
    { id: '2h', label: '2 Jam', cost: 35 },
    { id: '4h', label: '4 Jam', cost: 60 },
    { id: '12h', label: '12 Jam', cost: 150 },
    { id: '24h', label: '24 Jam', cost: 250 },
];

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  
  // State Music
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [musicLink, setMusicLink] = useState("");

  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore(); 
  const { authUser, buyTime } = useAuthStore();
  const { sendMusicInvite } = useGameStore(); 

  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState('1h');

  // --- STATE KHUSUS ADMIN BUAT NGETEST GEMBOK ---
  const [adminBypass, setAdminBypass] = useState(true); // Default: Admin kebal

  // --- LOGIC PENGECEKAN WAKTU & ROLE ---
  useEffect(() => {
    const checkTime = () => {
      // 1. KHUSUS ADMIN: Kalau Bypass aktif = Bebas. Kalau Bypass mati = LANGSUNG KEKUNCI (Paksa Kunci)
      if (authUser?.role === "admin") {
        setIsTimeUp(!adminBypass); 
        return;
      }
      
      // 2. Relawan & Psikolog BEBAS, KECUALI mereka ngechat ke Psikolog lain
      if ((authUser?.role === "volunteer" || authUser?.role === "psychologist") && selectedUser?.role !== "psychologist") {
        setIsTimeUp(false);
        return;
      }

      // 3. User biasa cek waktu
      if (!authUser?.chatAccessUntil) {
          setIsTimeUp(true);
          return;
      }
      const now = new Date();
      const accessTime = new Date(authUser.chatAccessUntil);
      setIsTimeUp(now > accessTime);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); 
    return () => clearInterval(interval);
  }, [authUser?.chatAccessUntil, authUser?.role, selectedUser?.role, adminBypass]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    try {
      await sendMessage({ text: text.trim(), image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleMusicSubmit = (e) => {
      e.preventDefault();
      if(!musicLink.trim()) return;
      sendMusicInvite(selectedUser._id, musicLink);
      setMusicLink("");
      setShowMusicInput(false);
  };

  const handleBuyTime = async () => {
      setIsBuying(true);
      await buyTime(selectedPkg);
      setIsBuying(false);
  };

  const currentPkgDetails = TIME_PACKAGES.find(p => p.id === selectedPkg);

  // --- JIKA WAKTU HABIS, TAMPILKAN LAYAR GEMBOK ---
  if (isTimeUp) {
      return (
          <div className="p-4 w-full relative bg-base-200/50 border-t border-base-300">
              <div className="flex flex-col items-center justify-center p-4 gap-3 bg-base-100 rounded-xl border border-error/20 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-error/50"></div>
                  
                  <div className="flex items-center gap-2 text-error font-bold">
                      <Lock className="size-5" />
                      <span>Akses Chat Terkunci</span>
                  </div>
                  
                  <p className="text-xs text-zinc-500 text-center max-w-sm">
                      {selectedUser?.role === "psychologist" 
                        ? "Sesi dengan Psikolog membutuhkan tiket akses." 
                        : "Waktu chat habis. Kerjakan quest untuk mengumpulkan Energi Sosial."}
                  </p>
                  
                  <select 
                      className="select select-bordered select-sm w-full max-w-xs"
                      value={selectedPkg}
                      onChange={(e) => setSelectedPkg(e.target.value)}
                  >
                      {TIME_PACKAGES.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>
                              Akses {pkg.label} - {pkg.cost} ⚡
                          </option>
                      ))}
                  </select>

                  <button 
                      onClick={handleBuyTime} 
                      disabled={isBuying || authUser?.points < currentPkgDetails.cost}
                      className="btn btn-sm btn-primary w-full max-w-xs gap-2"
                  >
                      {isBuying ? <span className="loading loading-spinner size-4"></span> : <Zap className="size-4" />}
                      Tukar {currentPkgDetails.cost} ⚡
                  </button>

                  {authUser?.points < currentPkgDetails.cost && (
                      <span className="text-[10px] text-error font-medium">
                          Energi kamu tidak cukup. ({authUser?.points || 0} / {currentPkgDetails.cost} ⚡)
                      </span>
                  )}

                  {/* TOMBOL BYPASS KHUSUS ADMIN SAAT TERKUNCI */}
                  {authUser?.role === "admin" && (
                      <button 
                          onClick={() => setAdminBypass(true)} 
                          className="btn btn-xs btn-ghost text-zinc-400 mt-2 hover:text-error"
                      >
                          <ShieldAlert className="size-3 mr-1" /> Matikan Simulasi Gembok (Admin)
                      </button>
                  )}
              </div>
          </div>
      );
  }

  // --- JIKA WAKTU MASIH ADA / ROLE GRATIS, TAMPILKAN INPUT NORMAL ---
  return (
    <div className="p-4 w-full relative">
      
      {/* TOMBOL SIMULASI GEMBOK KHUSUS ADMIN SAAT BEBAS */}
      {authUser?.role === "admin" && (
          <div className="absolute -top-10 right-4 z-10">
              <button 
                  onClick={() => setAdminBypass(false)} 
                  className="btn btn-xs btn-warning btn-outline bg-base-100 shadow-sm"
              >
                  <ShieldAlert className="size-3" /> Test Gembok (Admin)
              </button>
          </div>
      )}

      {showMusicInput && (
          <div className="absolute bottom-20 left-4 right-4 bg-base-200 p-3 rounded-xl border border-base-300 shadow-xl z-20 animate-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold flex items-center gap-1 text-primary">
                    <Music className="size-3"/> Share Music (YT / Spotify)
                  </span>
                  <button onClick={() => setShowMusicInput(false)} className="btn btn-xs btn-circle btn-ghost"><X className="size-3"/></button>
              </div>
              <form onSubmit={handleMusicSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    className="input input-sm input-bordered w-full" 
                    placeholder="Paste link YouTube atau Spotify..."
                    value={musicLink}
                    onChange={(e) => setMusicLink(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-sm btn-primary"><LinkIcon className="size-4"/></button>
              </form>
          </div>
      )}

      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-zinc-700"/>
            <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center" type="button"><X className="size-3" /></button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-1 sm:gap-2">
        <div className="flex-1 flex gap-1 sm:gap-2 items-center">
          <input type="text" className="w-full input input-bordered rounded-lg input-sm sm:input-md" placeholder="Ketik pesan..." value={text} onChange={(e) => setText(e.target.value)}/>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange}/>

          {/* FIX: 'hidden sm:flex' dihapus, diganti jadi 'flex' biar nongol di Mobile */}
          <button type="button" className={`flex btn btn-sm sm:btn-md btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`} onClick={() => fileInputRef.current?.click()}>
              <Image size={18} className="sm:w-5 sm:h-5" />
          </button>
          
          <button type="button" className={`flex btn btn-sm sm:btn-md btn-circle ${showMusicInput ? "text-primary bg-primary/10" : "text-zinc-400"}`} onClick={() => setShowMusicInput(!showMusicInput)}>
              <Music size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <button type="submit" className="btn btn-sm sm:btn-md btn-circle" disabled={!text.trim() && !imagePreview}>
            <Send size={18} className="sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;