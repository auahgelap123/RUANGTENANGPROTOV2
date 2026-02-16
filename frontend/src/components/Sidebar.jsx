import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Gamepad2, Map, Search, ChevronDown, ChevronUp, ShieldCheck, HeartHandshake, X, Upload, Send, Camera, RefreshCcw, Star, GraduationCap, UserPlus, MessageCircle, Check, Trash2, UserMinus, Clock } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadMessages, subscribeToMessages, unsubscribeFromMessages, sendRequest, acceptRequest, removeContact } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  
  const [showExplore, setShowExplore] = useState(false); 
  const [activeTab, setActiveTab] = useState("pendengar");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  // QUEST & CAMERA STATES (SAMA)
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questInput, setQuestInput] = useState("");
  const [questImage, setQuestImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // RATING STATES
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [userToRate, setUserToRate] = useState(null);
  const [ratingStars, setRatingStars] = useState(0);

  useEffect(() => {
    getUsers();
    fetchQuests();
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [getUsers, subscribeToMessages, unsubscribeFromMessages]);

  const fetchQuests = async () => { try { const res = await axiosInstance.get("/quests"); setQuests(res.data); } catch (e) {} };

  // ... (Paste ulang fungsi Camera/Image/Quest/Rating logic disini biar gak ilang) ...
  // (Gw singkat biar muat, PASTE LOGIC LAMA LO DISINI)
  const handleImageChange = (e) => { const file = e.target.files[0]; if(!file)return; const r = new FileReader(); r.readAsDataURL(file); r.onload=()=>setQuestImage(r.result); };
  const startCamera = async () => { setIsCameraOpen(true); try{ const s=await navigator.mediaDevices.getUserMedia({video:true}); streamRef.current=s; if(videoRef.current)videoRef.current.srcObject=s;}catch(e){} };
  const stopCamera = () => { if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop()); setIsCameraOpen(false); };
  const takePhoto = () => { const v=videoRef.current; const c=document.createElement("canvas"); c.width=v.videoWidth; c.height=v.videoHeight; c.getContext("2d").drawImage(v,0,0); setQuestImage(c.toDataURL("image/jpeg")); stopCamera(); };
  const closeQuestModal = () => { setSelectedQuest(null); setQuestImage(null); stopCamera(); };
  const handleSubmitQuest = async () => { setIsSubmitting(true); try{ await axiosInstance.post("/quests/submit", {questId:selectedQuest.id, textResponse:questInput, imageResponse:questImage}); toast.success("Done!"); closeQuestModal(); }catch(e){} finally{setIsSubmitting(false);} };
  const handleOpenRating = (e,u) => { e.stopPropagation(); setUserToRate(u); setIsRatingModalOpen(true); };
  const submitRating = async () => { try{ await axiosInstance.post(`/users/rate/${userToRate._id}`, {stars:ratingStars}); setIsRatingModalOpen(false); getUsers(); toast.success("Rated"); }catch(e){} };
  const handleReroll = async (questId) => {
      const originalQuests = [...quests]; // Simpan state lama buat rollback kalo error
      
      try {
          // Panggil API Reroll
          const res = await axiosInstance.put(`/quests/reroll/${questId}`);
          setQuests(res.data); // Update tampilan dengan quest baru
          toast.success("Misi berhasil diganti!");
      } catch (error) {
          console.error(error);
          setQuests(originalQuests); // Balikin kalo gagal
          toast.error(error.response?.data?.message || "Gagal ganti misi");
      }
  };


  if (isUsersLoading) return <SidebarSkeleton />;

  // --- LOGIC FILTER CANGGIH ---
  const myContactIds = authUser?.contacts || [];
  const myRequestIds = authUser?.friendRequests || []; // Request yang masuk ke SAYA

  // 1. REQUEST MASUK (Ada orang nge-add saya)
  const incomingRequests = users.filter(user => myRequestIds.includes(user._id));

  // 2. KONTAK SAYA (Udah Sah)
  const myContacts = users.filter(user => myContactIds.includes(user._id));

  // 3. EXPLORE (Orang asing)
  // Syarat: Bukan saya, Bukan kontak, Bukan yang lagi request ke saya
  const exploreUsers = users.filter(user => 
    user._id !== authUser._id && 
    !myContactIds.includes(user._id) && 
    !myRequestIds.includes(user._id)
  );

  const filteredContacts = myContacts.filter(u => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredExplore = exploreUsers.filter(u => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

  // Pisah Explore
  const exploreHelpers = filteredExplore.filter(u => u.role === "volunteer" || u.role === "psychologist");
  const exploreOthers = filteredExplore.filter(u => u.role !== "volunteer" && u.role !== "psychologist");

  const games = [{ id: 1, title: "Tebak Gambar", category: "Multiplayer" }, { id: 2, title: "Curhat Anonim", category: "Coming Soon" }];

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      
      {/* HEADER TABS */}
      <div className="flex border-b border-base-300 w-full bg-base-100">
        <button onClick={() => { setActiveTab("pendengar"); setShowExplore(false); }} className={`flex-1 p-3 flex justify-center ${!showExplore && activeTab === "pendengar" ? "text-primary border-b-2 border-primary" : "text-zinc-500"}`} title="Chat"><MessageCircle className="size-6" /></button>
        <button onClick={() => { setActiveTab("pendengar"); setShowExplore(true); }} className={`flex-1 p-3 flex justify-center ${showExplore && activeTab === "pendengar" ? "text-primary border-b-2 border-primary" : "text-zinc-500"}`} title="Cari Teman"><Users className="size-6" /></button>
        <button onClick={() => setActiveTab("aktivitas")} className={`flex-1 p-3 flex justify-center ${activeTab === "aktivitas" ? "text-primary border-b-2 border-primary" : "text-zinc-500"}`}><Map className="size-6" /></button>
      </div>

      {activeTab === "pendengar" && (
        <>
          <div className="p-4 pb-2">
             <h3 className="font-bold text-lg mb-2 px-1">{showExplore ? "Cari Teman" : "Chat"}</h3>
             <div className="relative w-full"><Search className="absolute left-3 top-2.5 size-4 text-zinc-400" /><input type="text" className="input input-sm input-bordered w-full pl-9" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          </div>

          <div className="overflow-y-auto flex-1 w-full py-2 px-2">
            
            {/* --- VIEW 1: CHAT LIST & INCOMING REQUESTS --- */}
            {!showExplore && (
                <>
                    {/* SECTION: REQUEST MASUK (Cuma muncul kalo ada request) */}
                    {incomingRequests.length > 0 && (
                        <div className="mb-4 bg-base-200 rounded-lg p-2">
                            <div className="text-xs font-bold text-primary mb-2 px-2 uppercase tracking-wider flex items-center gap-1"><UserPlus className="size-3"/> Permintaan Berteman</div>
                            {incomingRequests.map(user => (
                                <div key={user._id} className="flex items-center gap-3 p-2 bg-base-100 rounded-md mb-1 shadow-sm">
                                    <img src={user.profilePic || "/avatar.png"} className="size-8 rounded-full object-cover" />
                                    <div className="flex-1 min-w-0 font-medium text-sm truncate">{user.fullName}</div>
                                    <div className="flex gap-1">
                                        <button onClick={() => acceptRequest(user._id)} className="btn btn-xs btn-primary btn-square"><Check className="size-4"/></button>
                                        {/* Reject pake logic removeContact aja biar gampang */}
                                        <button onClick={() => removeContact(user._id)} className="btn btn-xs btn-ghost btn-square text-error"><X className="size-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SECTION: KONTAK SAYA */}
                    {filteredContacts.length === 0 && incomingRequests.length === 0 ? (
                        <div className="text-center text-zinc-500 mt-10">
                            <p className="text-sm">Belum ada kontak.</p>
                            <button onClick={() => setShowExplore(true)} className="btn btn-sm btn-link">Cari Teman</button>
                        </div>
                    ) : (
                        filteredContacts.map((user) => (
                            <div key={user._id} className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 cursor-pointer rounded-lg group relative ${selectedUser?._id === user._id ? "bg-base-300" : ""}`} onClick={() => setSelectedUser(user)}>
                                <div className="relative"><img src={user.profilePic || "/avatar.png"} className={`size-12 rounded-full object-cover border-2 ${user.role==='psychologist'?'border-yellow-500':user.role==='volunteer'?'border-primary':'border-transparent'}`} />{onlineUsers.includes(user._id) && <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />}</div>
                                <div className="hidden lg:block min-w-0 flex-1">
                                    <div className="flex justify-between items-center">
                                        <div className="font-medium truncate flex gap-1 items-center">
                                            {user.fullName}
                                            {user.role === 'psychologist' && <GraduationCap className="size-3 text-yellow-500"/>}
                                            {user.role === 'volunteer' && <ShieldCheck className="size-3 text-primary"/>}
                                        </div>
                                        {unreadMessages[user._id] > 0 && <span className="badge badge-sm badge-error text-white font-bold">{unreadMessages[user._id]}</span>}
                                    </div>
                                    <div className="text-xs text-zinc-400">{user.role==='psychologist'?'Psikolog':user.role==='volunteer'?'Relawan': onlineUsers.includes(user._id)?"Online":"Offline"}</div>
                                </div>
                                
                                {/* Tombol Unfriend & Rate (Muncul pas hover) */}
                                <div className="hidden group-hover:flex absolute right-2 gap-1 bg-base-300/80 p-1 rounded-lg backdrop-blur-sm">
                                    <button onClick={(e) => handleOpenRating(e, user)} className="btn btn-ghost btn-xs text-yellow-500" title="Rate"><Star className="size-3"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); removeContact(user._id); }} className="btn btn-ghost btn-xs text-error" title="Unfriend"><Trash2 className="size-3"/></button>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* --- VIEW 2: EXPLORE (TOMBOL ADD) --- */}
            {showExplore && (
                <>
                    {/* HELPER LIST */}
                    {exploreHelpers.length > 0 && (
                        <div className="mb-4">
                            <div className="px-3 pb-2 text-xs font-bold text-primary uppercase tracking-wider mt-2">Relawan Siaga</div>
                            {exploreHelpers.map((user) => (
                                <div key={user._id} className="card bg-base-200 p-3 mb-2 flex flex-row items-center gap-3">
                                    <img src={user.profilePic || "/avatar.png"} className={`size-10 rounded-full object-cover border-2 ${user.role==='psychologist'?'border-yellow-500':'border-primary'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate flex items-center gap-1">
                                            {user.fullName}
                                            {user.role === 'psychologist' ? <GraduationCap className="size-3 text-yellow-500"/> : <ShieldCheck className="size-3 text-primary"/>}
                                        </div>
                                        <div className="text-xs text-zinc-500">{user.role==='psychologist'?'Psikolog Klinis':'Volunteer'}</div>
                                    </div>
                                    <button onClick={() => sendRequest(user._id)} className="btn btn-sm btn-circle btn-primary btn-outline" title="Add"><UserPlus className="size-4"/></button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* USER LAIN */}
                    <div className="px-3 pb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mt-2">Komunitas</div>
                    {exploreOthers.map((user) => (
                        <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg">
                             <img src={user.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover" />
                             <div className="flex-1 min-w-0">
                                 <div className="font-medium text-sm truncate">{user.fullName}</div>
                                 <div className="text-xs text-zinc-400">User</div>
                             </div>
                             {/* Cek apakah sudah requested (optional, but good UX) */}
                             {user.friendRequests?.includes(authUser._id) ? (
                                <span className="text-xs text-zinc-400 flex items-center gap-1"><Clock className="size-3"/> Sent</span>
                             ) : (
                                <button onClick={() => sendRequest(user._id)} className="btn btn-sm btn-ghost text-zinc-500 hover:text-primary"><UserPlus className="size-4"/></button>
                             )}
                        </div>
                    ))}
                </>
            )}
          </div>
          <div className="p-4 border-t border-base-300"><button onClick={() => setIsVolunteerModalOpen(true)} className="btn btn-primary btn-outline btn-sm w-full gap-2"><HeartHandshake className="size-4" /><span className="hidden lg:inline">Jadilah Pendengar</span><span className="lg:hidden">Join</span></button></div>
        </>
      )}
   {/* --- TAB AKTIVITAS (QUEST) --- */}
      {activeTab === "aktivitas" && (
        <div className="p-4 overflow-y-auto h-full">
           <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-primary">Daily Quest</h3>
                {/* Tombol Fix Error (Opsional, boleh dihapus kalau udah lancar) */}
                <button onClick={async () => { try { await axiosInstance.get("/quests/force-reset"); window.location.reload(); } catch (e) {} }} className="btn btn-xs btn-error text-white opacity-50 hover:opacity-100">Reset quest</button>
           </div>

           <div className="space-y-3">
              {quests.length === 0 ? (
                  <div className="text-center text-zinc-500 text-sm py-10 flex flex-col items-center">
                      <Check className="size-10 text-green-500 mb-2"/>
                      <p>Semua misi hari ini selesai!</p>
                      <span className="text-xs mt-1">Kembali lagi besok ya.</span>
                  </div>
              ) : (
                  quests.map((quest) => (
                    <div key={quest.id} className="card bg-base-200 shadow-sm border border-base-300 p-3 relative">
                      
                      {/* HEADER: Judul, XP, dan Tombol Reroll */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <h4 className="font-bold text-sm text-base-content">{quest.title}</h4>
                            <span className="badge badge-accent badge-xs mt-1">{quest.exp} XP</span>
                        </div>
                        
                        {/* TOMBOL REROLL (SELALU MUNCUL) */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleReroll(quest.id); }} 
                            className="btn btn-xs btn-circle btn-ghost text-zinc-400 hover:text-primary hover:bg-base-300 tooltip tooltip-left"
                            data-tip="Ganti Misi"
                        >
                            <RefreshCcw className="size-4" />
                        </button>
                      </div>
                      
                      {/* Deskripsi */}
                      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{quest.description}</p>
                      
                      {/* Tombol Kerjakan */}
                      <button 
                        onClick={() => { setSelectedQuest(quest); setQuestInput(""); setQuestImage(null); }} 
                        className="btn btn-sm btn-outline btn-primary w-full gap-2"
                      >
                        {quest.questType === 'image' ? <Camera className="size-4"/> : <Send className="size-4"/>}
                        Kerjakan
                      </button>

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
    {/* --- MODAL QUEST (UPDATED questType) --- */}
      {selectedQuest && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="modal-box bg-base-100 max-w-md w-full relative">
                <button onClick={closeQuestModal} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X className="size-4"/></button>
                <h3 className="font-bold text-lg text-primary mb-1">{selectedQuest.title}</h3>
                <p className="text-sm text-zinc-500 mb-4">{selectedQuest.description}</p>
                
                <div className="space-y-4">
                    {/* GANTI .type JADI .questType DISINI */}
                    {selectedQuest.questType === "text" && (
                        <div className="form-control">
                            <label className="label"><span className="label-text">Ceritamu:</span></label>
                            <textarea className="textarea textarea-bordered h-32" placeholder="Ceritain detailnya di sini..." value={questInput} onChange={(e) => setQuestInput(e.target.value)}></textarea>
                        </div>
                    )}

                    {/* GANTI .type JADI .questType DISINI JUGA */}
                    {selectedQuest.questType === "image" && (
                        <div className="form-control">
                            <label className="label"><span className="label-text">Bukti Foto:</span></label>
                            <div className="w-full h-64 bg-black rounded-lg overflow-hidden relative flex items-center justify-center mb-2 border border-base-300">
                                {isCameraOpen ? (
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
                                ) : questImage ? (
                                    <img src={questImage} alt="Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-zinc-500 flex flex-col items-center"><Upload className="size-10 mb-2 opacity-50" /><span className="text-xs">Belum ada foto</span></div>
                                )}
                                {isCameraOpen && (<button onClick={takePhoto} className="absolute bottom-4 btn btn-circle btn-primary border-4 border-white transform hover:scale-110 transition-transform"><div className="size-3 bg-white rounded-full"></div></button>)}
                            </div>
                            {!isCameraOpen && !questImage && (<div className="grid grid-cols-2 gap-2"><button onClick={startCamera} className="btn btn-outline btn-secondary btn-sm gap-2"><Camera className="size-4" /> Buka Kamera</button><label className="btn btn-outline btn-accent btn-sm gap-2"><Upload className="size-4" /> Upload File<input type="file" className="hidden" accept="image/*" onChange={handleImageChange} /></label></div>)}
                            {!isCameraOpen && questImage && (<div className="flex gap-2"><button onClick={() => { setQuestImage(null); }} className="btn btn-ghost btn-sm text-error w-full gap-2"><RefreshCcw className="size-4" /> Foto Ulang</button></div>)}
                        </div>
                    )}
                </div>
                <div className="modal-action"><button onClick={handleSubmitQuest} className="btn btn-primary w-full" disabled={isSubmitting || (selectedQuest.questType === "image" && !questImage)}>{isSubmitting ? ( <span className="loading loading-spinner"></span> ) : ( <><Send className="size-4" /> Kirim Bukti</> )}</button></div>
            </div>
         </div>
      )}
      {/* --- MODAL RATING --- */}
      {isRatingModalOpen && userToRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="modal-box bg-base-100 max-w-sm text-center">
                <button onClick={() => setIsRatingModalOpen(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X className="size-4"/></button>
                <h3 className="font-bold text-lg mb-2">Beri Rating</h3>
                <p className="text-sm text-zinc-500 mb-6">Seberapa membantu sesi ngobrol bareng <span className="text-primary font-bold">{userToRate.fullName}</span>?</p>
                
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRatingStars(star)} className="transition-transform hover:scale-110 focus:scale-125 focus:outline-none">
                            <Star className={`size-8 ${star <= ratingStars ? "fill-yellow-400 text-yellow-400" : "text-zinc-300"}`} />
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsRatingModalOpen(false)} className="btn btn-ghost">Batal</button>
                    <button onClick={submitRating} className="btn btn-primary" disabled={ratingStars === 0}>Kirim Rating</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL RELAWAN INFO --- */}
      {isVolunteerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="modal-box relative bg-base-100 max-w-md w-full">
                <button onClick={() => setIsVolunteerModalOpen(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X className="size-4"/></button>
                <h3 className="font-bold text-lg flex items-center gap-2 text-primary"><HeartHandshake className="size-6" /> Gabung Relawan Siaga</h3>
                <p className="py-4 text-sm text-zinc-500">Ruang Tenang butuh orang baik kayak kamu...</p>
                <div className="modal-action mt-6">
                    <button onClick={() => setIsVolunteerModalOpen(false)} className="btn btn-ghost">Nanti Saja</button>
                    <a href="#" className="btn btn-primary px-8" onClick={() => setIsVolunteerModalOpen(false)}>Daftar Sekarang</a>
                </div>
            </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;       