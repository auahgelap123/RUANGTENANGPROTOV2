import { useEffect, useState, useRef } from "react"; // Tambah useRef
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
// Tambah import icon Camera & RefreshCcw
import { Users, Gamepad2, Map, Search, ChevronDown, ChevronUp, ShieldCheck, HeartHandshake, X, Upload, Send, CheckCircle2, Camera, RefreshCcw } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  
  // States
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("pendengar");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  // QUEST STATES
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questInput, setQuestInput] = useState("");
  const [questImage, setQuestImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- CAMERA STATES (NEW) ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    getUsers();
    fetchQuests();
  }, [getUsers]);

  const fetchQuests = async () => {
    try {
      const res = await axiosInstance.get("/quests");
      setQuests(res.data);
    } catch (error) {
      console.error("Gagal load quests");
    }
  };

  // --- LOGIC IMAGE HANDLING (UPLOAD) ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setQuestImage(reader.result);
      setIsCameraOpen(false); // Matikan kamera kalau upload manual
    };
  };

  // --- LOGIC LIVE CAMERA (NEW) ---
  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      setQuestImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Gagal akses kamera (izin ditolak/tidak ada kamera)");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageBase64 = canvas.toDataURL("image/jpeg");
    setQuestImage(imageBase64);
    stopCamera();
  };

  const closeQuestModal = () => {
    setSelectedQuest(null);
    setQuestInput("");
    setQuestImage(null);
    stopCamera(); // Pastikan kamera mati pas tutup modal
  };

  // --- LOGIC SUBMIT QUEST ---
  const handleSubmitQuest = async () => {
    if (!selectedQuest) return;
    setIsSubmitting(true);

    try {
      await axiosInstance.post("/quests/submit", {
        questId: selectedQuest.id,
        textResponse: questInput,
        imageResponse: questImage,
      });
      
      toast.success(`Mantap! ${selectedQuest.exp} didapatkan!`);
      closeQuestModal(); // Pake fungsi close yang baru
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onlineFilteredUsers = showOnlineOnly ? users.filter((user) => onlineUsers.includes(user._id)) : users;
  const searchFilteredUsers = onlineFilteredUsers.filter((user) => user.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const isSearching = searchQuery.length > 0;
  const relawanUsers = isSearching ? [] : searchFilteredUsers.filter(user => user.role === "volunteer");
  const communityUsers = isSearching ? searchFilteredUsers : searchFilteredUsers.filter(user => user.role !== "volunteer");

  if (isUsersLoading) return <SidebarSkeleton />;

  const games = [
    { id: 1, title: "Tebak Gambar", category: "Multiplayer", status: "Active" },
    { id: 2, title: "Curhat Anonim", category: "Social", status: "Coming Soon" },
  ];

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      
      {/* --- TAB NAV --- */}
      <div className="flex border-b border-base-300 w-full bg-base-100">
        <button onClick={() => { setActiveTab("pendengar"); closeQuestModal(); }} className={`flex-1 p-3 flex justify-center items-center ${activeTab === "pendengar" ? "border-b-2 border-primary text-primary bg-base-200" : "text-zinc-500 hover:bg-base-200"}`}><Users className="size-6" /></button>
        <button onClick={() => { setActiveTab("aktivitas"); closeQuestModal(); }} className={`flex-1 p-3 flex justify-center items-center ${activeTab === "aktivitas" ? "border-b-2 border-primary text-primary bg-base-200" : "text-zinc-500 hover:bg-base-200"}`}><Map className="size-6" /></button>
        <button onClick={() => { setActiveTab("hiburan"); closeQuestModal(); }} className={`flex-1 p-3 flex justify-center items-center ${activeTab === "hiburan" ? "border-b-2 border-primary text-primary bg-base-200" : "text-zinc-500 hover:bg-base-200"}`}><Gamepad2 className="size-6" /></button>
      </div>

      {/* --- PENDENGAR TAB --- */}
      {activeTab === "pendengar" && (
        <>
           <div className="border-b border-base-300 w-full p-5 pb-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium hidden lg:block">Cari Teman Cerita</span>
            </div>
            <div className="relative w-full mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="size-4 text-zinc-400" /></div>
                <input type="text" className="input input-sm input-bordered w-full pl-10 bg-base-200 focus:bg-base-100 transition-colors" placeholder="Cari Nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="overflow-y-auto w-full py-3 flex-1">
             {!isSearching && relawanUsers.length > 0 && (
                <div className="mb-4">
                    <div className="px-5 pb-2 text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-wider"><ShieldCheck className="size-3" /> Relawan Siaga</div>
                    {relawanUsers.map((user) => (
                      <button key={user._id} onClick={() => setSelectedUser(user)} className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}>
                        <div className="relative mx-auto lg:mx-0"><img src={user.profilePic || "/avatar.png"} alt={user.name} className="size-12 object-cover rounded-full border-2 border-primary" />{onlineUsers.includes(user._id) && <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />}</div>
                        <div className="hidden lg:block text-left min-w-0"><div className="font-medium truncate flex items-center gap-1">{user.fullName} <ShieldCheck className="size-3 text-primary" /></div><div className="text-xs text-zinc-400">Official Volunteer</div></div>
                      </button>
                    ))}
                </div>
            )}
            <div className="mb-2">
                {!isSearching && (<button onClick={() => setShowAllUsers(!showAllUsers)} className="w-full px-5 py-2 text-xs font-bold text-zinc-500 flex items-center justify-between hover:bg-base-200 uppercase tracking-wider"><span>Komunitas ({communityUsers.length})</span>{showAllUsers ? <ChevronUp className="size-3"/> : <ChevronDown className="size-3"/>}</button>)}
                {(showAllUsers || isSearching) && communityUsers.map((user) => (
                  <button key={user._id} onClick={() => setSelectedUser(user)} className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}>
                    <div className="relative mx-auto lg:mx-0"><img src={user.profilePic || "/avatar.png"} alt={user.name} className="size-12 object-cover rounded-full" />{onlineUsers.includes(user._id) && <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />}</div>
                    <div className="hidden lg:block text-left min-w-0"><div className="font-medium truncate">{user.fullName}</div><div className="text-xs text-zinc-400">{onlineUsers.includes(user._id) ? "Online" : "Offline"}</div></div>
                  </button>
                ))}
            </div>
          </div>
          <div className="p-4 border-t border-base-300"><button onClick={() => setIsVolunteerModalOpen(true)} className="btn btn-primary btn-outline btn-sm w-full gap-2"><HeartHandshake className="size-4" /><span className="hidden lg:inline">Jadilah Pendengar</span><span className="lg:hidden">Join</span></button></div>
        </>
      )}

      {/* --- TAB AKTIVITAS --- */}
      {activeTab === "aktivitas" && (
        <div className="p-4 overflow-y-auto h-full">
           <h3 className="font-bold text-lg mb-4 hidden lg:block text-primary">Daily Quest</h3>
           <div className="space-y-3">
              {quests.length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm py-4">Loading quests...</div>
              ) : (
                  quests.map((quest) => (
                    <div key={quest.id} className="card bg-base-200 shadow-sm border border-base-300 p-3 hover:bg-base-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm">{quest.title}</h4>
                        <span className="badge badge-accent badge-xs">{quest.exp}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 mb-3">{quest.description}</p>
                      <button onClick={() => { setSelectedQuest(quest); setQuestInput(""); setQuestImage(null); }} className="btn btn-xs btn-outline btn-primary w-full">Selesaikan Misi</button>
                    </div>
                  ))
              )}
           </div>
        </div>
      )}

      {/* --- TAB HIBURAN --- */}
      {activeTab === "hiburan" && (
        <div className="p-4 overflow-y-auto h-full">
           <div className="space-y-3">{games.map((game) => (<div key={game.id} className="card bg-base-200 shadow-sm border border-base-300 p-3 hover:bg-base-300 cursor-pointer transition-colors"><div className="flex items-center gap-3"><div className="size-10 rounded-lg bg-base-100 flex items-center justify-center"><Gamepad2 className="size-6 text-secondary"/></div><div><h4 className="font-bold text-sm">{game.title}</h4><p className="text-xs text-zinc-400">{game.category}</p></div></div></div>))}</div>
        </div>
      )}

      {/* --- MODAL SUBMIT QUEST (UPDATED: WITH CAMERA) --- */}
      {selectedQuest && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="modal-box bg-base-100 max-w-md w-full relative">
                <button onClick={closeQuestModal} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X className="size-4"/></button>
                
                <h3 className="font-bold text-lg text-primary mb-1">{selectedQuest.title}</h3>
                <p className="text-sm text-zinc-500 mb-4">{selectedQuest.description}</p>
                
                <div className="space-y-4">
                    {/* Input TEXT */}
                    {selectedQuest.type === "text" && (
                        <div className="form-control">
                            <label className="label"><span className="label-text">Ceritamu:</span></label>
                            <textarea className="textarea textarea-bordered h-32" placeholder="Ceritain detailnya di sini..." value={questInput} onChange={(e) => setQuestInput(e.target.value)}></textarea>
                            <label className="label"><span className="label-text-alt text-zinc-400">Min. {selectedQuest.minLength || 20} karakter</span></label>
                        </div>
                    )}

                    {/* Input IMAGE (CAMERA + UPLOAD) */}
                    {selectedQuest.type === "image" && (
                        <div className="form-control">
                            <label className="label"><span className="label-text">Bukti Foto:</span></label>
                            
                            {/* VIEW FINDER / PREVIEW AREA */}
                            <div className="w-full h-64 bg-black rounded-lg overflow-hidden relative flex items-center justify-center mb-2 border border-base-300">
                                {isCameraOpen ? (
                                    // VIDEO STREAM
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
                                ) : questImage ? (
                                    // HASIL FOTO / UPLOAD
                                    <img src={questImage} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    // EMPTY STATE
                                    <div className="text-zinc-500 flex flex-col items-center">
                                        <Upload className="size-10 mb-2 opacity-50" />
                                        <span className="text-xs">Belum ada foto</span>
                                    </div>
                                )}
                                
                                {/* TOMBOL JEPRET (Cuma muncul pas kamera nyala) */}
                                {isCameraOpen && (
                                    <button onClick={takePhoto} className="absolute bottom-4 btn btn-circle btn-primary border-4 border-white transform hover:scale-110 transition-transform">
                                        <div className="size-3 bg-white rounded-full"></div>
                                    </button>
                                )}
                            </div>

                            {/* TOMBOL KONTROL (Buka Kamera / Upload / Ulang) */}
                            {!isCameraOpen && !questImage && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={startCamera} className="btn btn-outline btn-secondary btn-sm gap-2">
                                        <Camera className="size-4" /> Buka Kamera
                                    </button>
                                    <label className="btn btn-outline btn-accent btn-sm gap-2">
                                        <Upload className="size-4" /> Upload File
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                </div>
                            )}

                            {/* TOMBOL RETAKE (Muncul kalau udah ada gambar) */}
                            {!isCameraOpen && questImage && (
                                <div className="flex gap-2">
                                    <button onClick={() => { setQuestImage(null); }} className="btn btn-ghost btn-sm text-error w-full gap-2">
                                        <RefreshCcw className="size-4" /> Foto Ulang
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-action">
                    <button onClick={handleSubmitQuest} className="btn btn-primary w-full" disabled={isSubmitting || (selectedQuest.type === "image" && !questImage)}>
                        {isSubmitting ? ( <span className="loading loading-spinner"></span> ) : ( <><Send className="size-4" /> Kirim Bukti</> )}
                    </button>
                </div>
            </div>
         </div>
      )}
       {/* --- MODAL RELAWAN (Tetap Ada) --- */}
      {isVolunteerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="modal-box relative bg-base-100 max-w-md w-full">
                <button
                    onClick={() => setIsVolunteerModalOpen(false)}
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                >
                    <X className="size-4"/>
                </button>
                <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                    <HeartHandshake className="size-6" />
                    Gabung Relawan Siaga
                </h3>
                <p className="py-4 text-sm text-zinc-500">
                    Ruang Tenang butuh orang baik kayak kamu. Tugasnya simpel: dengerin mereka yang butuh didengar, tanpa menghakimi.
                </p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <ShieldCheck className="size-5 text-primary" />
                        <div className="text-sm">Dapat Badge <b>Relawan</b> di profil</div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Users className="size-5 text-primary" />

                        <div className="text-sm">Akses ke channel khusus komunitas</div>
                    </div>
                </div>
                <div className="modal-action mt-6">
                    <button
                        onClick={() => setIsVolunteerModalOpen(false)}
                        className="btn btn-ghost"
                    >
                        Nanti Saja
                    </button>
                    <a
                        href="https://forms.gle/CONTOH_LINK_GOOGLE_FORM"
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary px-8"
                        onClick={() => setIsVolunteerModalOpen(false)}
                    >
                        Daftar Sekarang
                    </a>
                </div>
            </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

