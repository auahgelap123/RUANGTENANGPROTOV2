import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGameStore } from "../store/useGameStore.jsx"; 
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Gamepad2, Map, Search, ShieldCheck, HeartHandshake, X, Upload, Send, Camera, RefreshCcw, Star, GraduationCap, UserPlus, MessageCircle, Check, Trash2, Trophy, Crown, Swords, Clock } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import GameModal from "./GameModal"; // <--- 1. IMPORT MODAL GAME

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading, 
    unreadMessages, 
    subscribeToMessages, 
    unsubscribeFromMessages, 
    sendRequest, 
    acceptRequest, 
    removeContact 
  } = useChatStore();

  const { onlineUsers, authUser, socket } = useAuthStore();
  
  const { sendInvite, fetchLeaderboard, leaderboard, subscribeToGameEvents, unsubscribeFromGameEvents } = useGameStore();

  const [showExplore, setShowExplore] = useState(false); 
  const [activeTab, setActiveTab] = useState("pendengar");
  const [searchQuery, setSearchQuery] = useState("");
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [selectedGameToPlay, setSelectedGameToPlay] = useState(null);

  // Quest & Camera States
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questInput, setQuestInput] = useState("");
  const [questImage, setQuestImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [userToRate, setUserToRate] = useState(null);
  const [ratingStars, setRatingStars] = useState(0);

  useEffect(() => {
    if(authUser) getUsers();
    fetchQuests();
    fetchLeaderboard(); 
    
    subscribeToMessages();

    // Listener Game (Hanya jika socket siap)
    if (socket) {
        subscribeToGameEvents();
    }

    return () => {
      unsubscribeFromMessages();
      if (socket) unsubscribeFromGameEvents();
    };
  }, [authUser, getUsers, subscribeToMessages, unsubscribeFromMessages, fetchLeaderboard, subscribeToGameEvents, unsubscribeFromGameEvents, socket]);

  const fetchQuests = async () => { try { const res = await axiosInstance.get("/quests"); setQuests(res.data); } catch (e) {} };

  // Helper Functions
  const handleImageChange = (e) => { const file = e.target.files[0]; if(!file)return; const r = new FileReader(); r.readAsDataURL(file); r.onload=()=>setQuestImage(r.result); };
  const startCamera = async () => { setIsCameraOpen(true); try{ const s = await navigator.mediaDevices.getUserMedia({video:true}); streamRef.current=s; if(videoRef.current) videoRef.current.srcObject=s;} catch(e) { toast.error("Gagal buka kamera"); } };
  const stopCamera = () => { if(streamRef.current)streamRef.current.getTracks().forEach(t=>t.stop()); setIsCameraOpen(false); };
  const takePhoto = () => { const v=videoRef.current; const c=document.createElement("canvas"); c.width=v.videoWidth; c.height=v.videoHeight; c.getContext("2d").drawImage(v,0,0); setQuestImage(c.toDataURL("image/jpeg")); stopCamera(); };
  const closeQuestModal = () => { setSelectedQuest(null); setQuestImage(null); stopCamera(); };
  const handleSubmitQuest = async () => { if(!selectedQuest) return; setIsSubmitting(true); try{ await axiosInstance.post("/quests/submit", {questId:selectedQuest.id, textResponse:questInput, imageResponse:questImage}); toast.success("Misi Selesai! +XP"); closeQuestModal(); fetchQuests(); } catch(e){ toast.error("Gagal submit"); } finally{ setIsSubmitting(false); } };
  const handleReroll = async (qid) => { try { const res = await axiosInstance.put(`/quests/reroll/${qid}`); setQuests(res.data); toast.success("Misi diganti!"); } catch(e) { toast.error("Gagal reroll"); }};
  const handleOpenRating = (e, u) => { e.stopPropagation(); setUserToRate(u); setRatingStars(0); setIsRatingModalOpen(true); };
  const submitRating = async () => { if(ratingStars === 0) return; try{ await axiosInstance.post(`/users/rate/${userToRate._id}`, {stars:ratingStars}); setIsRatingModalOpen(false); getUsers(); toast.success("Rating terkirim!"); } catch(e){ toast.error("Gagal rating"); } };

  if (isUsersLoading || !authUser) return <SidebarSkeleton />;

  const myContactIds = authUser.contacts || [];
  const myRequestIds = authUser.friendRequests || [];
  const incomingRequests = users.filter(user => myRequestIds.includes(user._id));
  const myContacts = users.filter(user => myContactIds.includes(user._id));
  const exploreUsers = users.filter(user => user._id !== authUser._id && !myContactIds.includes(user._id) && !myRequestIds.includes(user._id));

  const filteredContacts = myContacts.filter(u => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredExplore = exploreUsers.filter(u => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const exploreHelpers = filteredExplore.filter(u => u.role === "volunteer" || u.role === "psychologist");
  const exploreOthers = filteredExplore.filter(u => u.role !== "volunteer" && u.role !== "psychologist");

  const availableGames = [
      { id: "TICTACTOE", name: "Tic Tac Toe", desc: "Adu strategi klasik", icon: "❌⭕" },
      { id: "SUIT", name: "Suit Jepang", desc: "Batu Gunting Kertas", icon: "✌️" },
      { id: "MATH", name: "Math Duel", desc: "Siapa cepat dia dapat", icon: "🧮" },
      { id: "TEBAK_ANGKA", name: "Tebak Angka", desc: "Bomber 0-100", icon: "💣" },
      { id: "TRIVIA", name: "Trivia Quiz", desc: "Tes wawasanmu", icon: "🧠" },
  ];

  return (
    <> {/* <--- 2. BUNGKUS DENGAN FRAGMENT */}
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        
        {/* HEADER TABS */}
        <div className="flex border-b border-base-300 w-full bg-base-100">
          <button onClick={() => { setActiveTab("pendengar"); setShowExplore(false); }} className={`flex-1 p-3 flex justify-center ${!showExplore && activeTab === "pendengar" ? "text-primary border-b-2 border-primary" : "text-zinc-500"}`}><MessageCircle className="size-6" /></button>
          <button onClick={() => { setActiveTab("pendengar"); setShowExplore(true); }} className={`flex-1 p-3 flex justify-center ${showExplore && activeTab === "pendengar" ? "text-primary border-b-2 border-primary" : "text-zinc-500"}`}><Users className="size-6" /></button>
          <button onClick={() => setActiveTab("aktivitas")} className={`flex-1 p-3 flex justify-center ${activeTab === "aktivitas" ? "text-primary border-b-2 border-primary" : "text-zinc-500"}`}><Map className="size-6" /></button>
          <button onClick={() => setActiveTab("arcade")} className={`flex-1 p-3 flex justify-center ${activeTab === "arcade" ? "text-primary border-b-2 border-primary" : "text-zinc-500"}`}><Gamepad2 className="size-6" /></button>
        </div>

        {/* TAB CHAT */}
        {activeTab === "pendengar" && (
          <>
            <div className="p-4 pb-2">
               <h3 className="font-bold text-lg mb-2 px-1">{showExplore ? "Cari Teman" : "Chat"}</h3>
               <div className="relative w-full"><Search className="absolute left-3 top-2.5 size-4 text-zinc-400" /><input type="text" className="input input-sm input-bordered w-full pl-9" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            </div>
            <div className="overflow-y-auto flex-1 w-full py-2 px-2">
              {!showExplore ? (
                  <>
                      {incomingRequests.length > 0 && (
                          <div className="mb-4 bg-base-200 rounded-lg p-2">
                              <div className="text-xs font-bold text-primary mb-2 px-2 flex items-center gap-1"><UserPlus className="size-3"/> Request</div>
                              {incomingRequests.map(user => (
                                  <div key={user._id} className="flex items-center gap-2 p-2 bg-base-100 rounded-md mb-1 shadow-sm">
                                      <img src={user.profilePic || "/avatar.png"} className="size-8 rounded-full object-cover" />
                                      <div className="flex-1 min-w-0 font-medium text-sm truncate">{user.fullName}</div>
                                      <button onClick={() => acceptRequest(user._id)} className="btn btn-xs btn-primary btn-square"><Check className="size-4"/></button>
                                      <button onClick={() => removeContact(user._id)} className="btn btn-xs btn-ghost btn-square text-error"><X className="size-4"/></button>
                                  </div>
                              ))}
                          </div>
                      )}
                      {filteredContacts.map((user) => (
                          <div key={user._id} onClick={() => setSelectedUser(user)} className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 cursor-pointer rounded-lg group relative ${selectedUser?._id === user._id ? "bg-base-300" : ""}`}>
                              <div className="relative"><img src={user.profilePic || "/avatar.png"} className={`size-12 rounded-full object-cover border-2 ${user.role==='psychologist'?'border-yellow-500':user.role==='volunteer'?'border-primary':'border-transparent'}`} />{onlineUsers.includes(user._id) && <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />}</div>
                              <div className="hidden lg:block min-w-0 flex-1">
                                  <div className="flex justify-between items-center"><div className="font-medium truncate flex gap-1 items-center">{user.fullName}{user.role === 'psychologist' && <GraduationCap className="size-3 text-yellow-500"/>}{user.role === 'volunteer' && <ShieldCheck className="size-3 text-primary"/>}</div>{unreadMessages[user._id] > 0 && <span className="badge badge-sm badge-error text-white font-bold">{unreadMessages[user._id]}</span>}</div>
                                  <div className="text-xs text-zinc-400 flex items-center gap-2"><span>{user.role === 'psychologist' ? 'Psikolog' : user.role === 'volunteer' ? 'Relawan' : user.role === 'admin' ? 'Admin' : onlineUsers.includes(user._id) ? "Online" : "Offline"}</span>{user.rating > 0 && (<span className="flex items-center text-yellow-500 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded"><Star className="size-3 fill-yellow-500 mr-1" />{user.rating}</span>)}</div>
                              </div>
                              <div className="hidden lg:flex absolute right-2 gap-1 bg-base-100/90 p-1 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm border border-base-200">
                                  <button onClick={(e) => handleOpenRating(e, user)} className="btn btn-ghost btn-xs text-yellow-500 px-1 hover:bg-yellow-100" title="Beri Rating"><Star className="size-3"/></button>
                                  <button onClick={(e) => { e.stopPropagation(); removeContact(user._id); }} className="btn btn-ghost btn-xs text-error px-1 hover:bg-red-100" title="Hapus"><Trash2 className="size-3"/></button>
                              </div>
                          </div>
                      ))}
                  </>
              ) : (
                  <>
                      {exploreHelpers.map((user) => (
                          <div key={user._id} className="card bg-base-200 p-3 mb-2 flex flex-row items-center gap-3"><img src={user.profilePic || "/avatar.png"} className={`size-10 rounded-full border-2 ${user.role==='psychologist'?'border-yellow-500':'border-primary'}`} /><div className="flex-1 min-w-0"><div className="font-bold text-sm truncate flex items-center gap-1">{user.fullName}{user.role==='psychologist'?<GraduationCap className="size-3 text-yellow-500"/>:<ShieldCheck className="size-3 text-primary"/>}</div><div className="text-xs text-zinc-500">{user.role==='psychologist'?'Psikolog':'Volunteer'}</div></div>{user.friendRequests?.includes(authUser._id) ? <span className="text-xs text-zinc-400 flex gap-1 items-center"><Clock className="size-3"/> Sent</span> : <button onClick={() => sendRequest(user._id)} className="btn btn-sm btn-circle btn-primary btn-outline"><UserPlus className="size-4"/></button>}</div>
                      ))}
                      <div className="px-3 pb-2 text-xs font-bold text-zinc-500 mt-2">Komunitas</div>
                      {exploreOthers.map((user) => (
                          <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg"><img src={user.profilePic || "/avatar.png"} className="size-10 rounded-full" /><div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{user.fullName}</div><div className="text-xs text-zinc-400">User</div></div>{user.friendRequests?.includes(authUser._id) ? <span className="text-xs text-zinc-400 flex gap-1 items-center"><Clock className="size-3"/> Sent</span> : <button onClick={() => sendRequest(user._id)} className="btn btn-sm btn-ghost hover:text-primary"><UserPlus className="size-4"/></button>}</div>
                      ))}
                  </>
              )}
            </div>
            <div className="p-4 border-t border-base-300"><button onClick={() => setIsVolunteerModalOpen(true)} className="btn btn-primary btn-outline btn-sm w-full gap-2"><HeartHandshake className="size-4" /><span className="hidden lg:inline">Jadilah Pendengar</span></button></div>
          </>
        )}

        {/* TAB QUEST */}
        {activeTab === "aktivitas" && (
          <div className="p-4 overflow-y-auto h-full">
             <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-primary">Daily Quest</h3><button onClick={async () => { try { await axiosInstance.get("/quests/force-reset"); window.location.reload(); } catch (e) {} }} className="btn btn-xs btn-error text-white opacity-30 hover:opacity-100">Reset</button></div>
             <div className="space-y-3">
                {quests.map((quest) => (
                  <div key={quest.id} className="card bg-base-200 shadow-sm border border-base-300 p-3 relative group">
                    <div className="flex justify-between items-start mb-2"><div className="flex flex-col"><h4 className="font-bold text-sm">{quest.title}</h4><span className="badge badge-accent badge-xs mt-1">{quest.exp} XP</span></div><button onClick={(e) => { e.stopPropagation(); handleReroll(quest.id); }} className="btn btn-xs btn-circle btn-ghost text-zinc-400 hover:text-primary"><RefreshCcw className="size-4" /></button></div><p className="text-xs text-zinc-500 mb-4">{quest.description}</p><button onClick={() => { setSelectedQuest(quest); setQuestInput(""); setQuestImage(null); }} className="btn btn-sm btn-outline btn-primary w-full gap-2">{quest.questType === 'image' ? <Camera className="size-4"/> : <Send className="size-4"/>} Kerjakan</button>
                  </div>
                ))}
                {quests.length === 0 && <div className="text-center text-zinc-500 text-sm py-10"><p>Misi hari ini beres!</p></div>}
             </div>
          </div>
        )}

        {/* TAB ARCADE */}
        {activeTab === "arcade" && (
            <div className="p-4 overflow-y-auto h-full flex flex-col gap-6">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20">
                    <h3 className="font-bold text-lg text-primary flex items-center gap-2 mb-3"><Trophy className="size-5 text-yellow-500"/> Hall of Fame</h3>
                    <div className="space-y-2">
                        {leaderboard.map((user, idx) => (
                            <div key={user._id} className="flex items-center gap-3 bg-base-100 p-2 rounded-lg shadow-sm border border-base-200">
                                <div className={`font-black w-6 text-center ${idx===0?'text-yellow-500 text-xl':idx===1?'text-zinc-400 text-lg':idx===2?'text-orange-400 text-lg':'text-zinc-500'}`}>{idx+1}</div>
                                <img src={user.profilePic || "/avatar.png"} className="size-8 rounded-full object-cover border"/>
                                <div className="flex-1 min-w-0 font-medium text-sm truncate">{user.fullName}</div>
                                <div className="badge badge-ghost font-bold gap-1">{user.gameWins || 0} <Crown className="size-3 text-yellow-500"/></div>
                            </div>
                        ))}
                        {leaderboard.length === 0 && <div className="text-xs text-center text-zinc-500">Belum ada juara.</div>}
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg text-base-content mb-3 flex items-center gap-2"><Gamepad2 className="size-5"/> Game Library</h3>
                    <div className="grid gap-3">
                        {availableGames.map((game) => (
                            <button key={game.id} onClick={() => setSelectedGameToPlay(game)} className="card bg-base-200 hover:bg-base-300 transition-colors p-3 border border-base-300 text-left flex flex-row items-center gap-4 group">
                                <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{game.icon}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm">{game.name}</div>
                                    <div className="text-xs text-zinc-500">{game.desc}</div>
                                </div>
                                <div className="btn btn-sm btn-circle btn-primary btn-outline"><Swords className="size-4"/></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* MODALS */}
        {selectedGameToPlay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="modal-box bg-base-100 max-w-sm">
                    <button onClick={() => setSelectedGameToPlay(null)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X className="size-4"/></button>
                    <h3 className="font-bold text-lg mb-1">Main {selectedGameToPlay.name}</h3>
                    <p className="text-sm text-zinc-500 mb-4">Pilih lawan main kamu:</p>
                    <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                        {myContacts.length === 0 ? <div className="text-center py-4 text-zinc-500 text-sm">Belum ada teman online.</div> : myContacts.map(friend => (
                            <button key={friend._id} onClick={() => { sendInvite(friend._id, selectedGameToPlay.id); setSelectedGameToPlay(null); }} className="w-full flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg border border-transparent hover:border-base-300 transition-all">
                                <div className="relative"><img src={friend.profilePic || "/avatar.png"} className="size-10 rounded-full object-cover"/>{onlineUsers.includes(friend._id) && <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-white"></span>}</div>
                                <div className="flex-1 text-left"><div className="font-bold text-sm">{friend.fullName}</div><div className="text-xs text-zinc-500">{onlineUsers.includes(friend._id) ? "Online" : "Offline"}</div></div><div className="btn btn-xs btn-primary">Tantang</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {isRatingModalOpen && userToRate && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><div className="modal-box bg-base-100 max-w-sm text-center"><h3 className="font-bold text-lg mb-2">Rate {userToRate.fullName}</h3><div className="flex justify-center gap-2 my-4">{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setRatingStars(s)}><Star className={`size-8 ${s<=ratingStars?"fill-yellow-400 text-yellow-400":"text-zinc-300"}`}/></button>)}</div><div className="flex gap-2"><button onClick={()=>setIsRatingModalOpen(false)} className="btn btn-ghost flex-1">Batal</button><button onClick={submitRating} className="btn btn-primary flex-1">Kirim</button></div></div></div> )}
        {selectedQuest && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="modal-box bg-base-100 max-w-md w-full relative"><button onClick={closeQuestModal} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X className="size-4"/></button><h3 className="font-bold text-lg text-primary mb-1">{selectedQuest.title}</h3><p className="text-sm text-zinc-500 mb-4">{selectedQuest.description}</p><div className="space-y-4">{selectedQuest.questType === "text" && (<div className="form-control"><label className="label"><span className="label-text">Cerita:</span></label><textarea className="textarea textarea-bordered h-32" value={questInput} onChange={(e) => setQuestInput(e.target.value)}></textarea></div>)}{selectedQuest.questType === "image" && (<div className="form-control"><label className="label"><span className="label-text">Foto:</span></label><div className="w-full h-64 bg-black rounded-lg overflow-hidden relative flex items-center justify-center mb-2 border border-base-300">{isCameraOpen ? (<video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>) : questImage ? (<img src={questImage} alt="Preview" className="w-full h-full object-contain" />) : (<div className="text-zinc-500 flex flex-col items-center"><Upload className="size-10 mb-2 opacity-50" /><span className="text-xs">Belum ada foto</span></div>)}{isCameraOpen && (<button onClick={takePhoto} className="absolute bottom-4 btn btn-circle btn-primary border-4 border-white transform hover:scale-110 transition-transform"><div className="size-3 bg-white rounded-full"></div></button>)}</div>{!isCameraOpen && !questImage && (<div className="grid grid-cols-2 gap-2"><button onClick={startCamera} className="btn btn-outline btn-secondary btn-sm gap-2"><Camera className="size-4" /> Kamera</button><label className="btn btn-outline btn-accent btn-sm gap-2"><Upload className="size-4" /> Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageChange} /></label></div>)}{!isCameraOpen && questImage && (<div className="flex gap-2"><button onClick={() => { setQuestImage(null); }} className="btn btn-ghost btn-sm text-error w-full gap-2"><RefreshCcw className="size-4" /> Foto Ulang</button></div>)}</div>)}</div><div className="modal-action"><button onClick={handleSubmitQuest} className="btn btn-primary w-full" disabled={isSubmitting || (selectedQuest.questType === "image" && !questImage)}>{isSubmitting ? <span className="loading loading-spinner"></span> : "Kirim"}</button></div></div></div> )}
        {isVolunteerModalOpen && ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="modal-box relative bg-base-100 max-w-md w-full"><button onClick={() => setIsVolunteerModalOpen(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><X className="size-4"/></button><h3 className="font-bold text-lg">Gabung Relawan</h3><p className="py-4 text-sm text-zinc-500">Bantu teman-teman kita yang butuh didengar.</p><div className="modal-action"><button onClick={() => setIsVolunteerModalOpen(false)} className="btn btn-primary">Daftar</button></div></div></div> )}
      
      </aside>

      {/* --- 3. RENDER MODAL GAME DISINI (DILUAR ASIDE) --- */}
      <GameModal /> 
    </>
  );
};

export default Sidebar;