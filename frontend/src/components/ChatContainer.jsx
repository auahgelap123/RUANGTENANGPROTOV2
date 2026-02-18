import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGameStore } from "../store/useGameStore.jsx";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { Gamepad2, XCircle, Youtube, RefreshCw } from "lucide-react";

const ChatContainer = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
  const { authUser } = useAuthStore(); 
  const { openGameMenu, musicId, musicPlatform, musicType, isMusicActive, stopMusic, resyncMusic, musicTimestamp } = useGameStore(); 
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => { unsubscribeFromMessages(); };
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return <div className="flex-1 flex flex-col overflow-auto"><ChatHeader /><MessageSkeleton /><MessageInput /></div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto relative">
      <div className="flex items-center justify-between border-b border-base-300 w-full pr-4 bg-base-100">
         <div className="flex-1"><ChatHeader /></div>
         <button onClick={openGameMenu} className="btn btn-sm btn-circle btn-ghost text-primary tooltip tooltip-left" data-tip="Main Game"><Gamepad2 className="size-6" /></button>
      </div> 

      {/* --- HYBRID PLAYER --- */}
      {isMusicActive && musicId && (
        <div className={`w-full p-2 flex items-center justify-between animate-in slide-in-from-top-2 z-20 sticky top-0 shadow-xl border-b 
            ${musicPlatform === 'spotify' ? 'bg-black/90 border-green-900/50' : 'bg-zinc-900/95 border-red-900/50'}`}>
            
            <div className="flex-1 h-[80px]">
                {musicPlatform === 'spotify' && (
                    <iframe 
                        key={musicTimestamp} 
                        style={{borderRadius: "12px"}} 
                        src={`https://open.spotify.com/embed/${musicType}/${musicId}?utm_source=generator&theme=0`} 
                        width="100%" 
                        height="80" 
                        frameBorder="0" 
                        allowFullScreen="" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                    ></iframe>
                )}

                {musicPlatform === 'youtube' && (
                    <div className="flex items-center gap-3 h-full px-2">
                        <iframe 
                            key={musicTimestamp} 
                            width="120" 
                            height="68" 
                            src={`https://www.youtube.com/embed/${musicId}?autoplay=1&start=0`} 
                            title="YouTube player" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            className="rounded-lg"
                        ></iframe>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white flex items-center gap-1"><Youtube className="size-3 text-red-500"/> YouTube</span>
                            <span className="text-[10px] text-zinc-400">Tekan sync 🔄 jika lag.</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1 ml-2">
                {/* FIX: MENGIRIM selectedUser._id KE FUNGSI STOP & RESYNC */}
                <button 
                    onClick={() => stopMusic(selectedUser._id)} 
                    className="btn btn-ghost btn-xs text-error" 
                    data-tip="Stop"
                >
                    <XCircle className="size-5"/>
                </button>
                <button 
                    onClick={() => resyncMusic(selectedUser._id)} 
                    className="btn btn-ghost btn-xs text-primary animate-pulse hover:animate-spin" 
                    data-tip="Sync"
                >
                    <RefreshCw className="size-5"/>
                </button>
            </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message._id} className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`} ref={messageEndRef}>
            <div className=" chat-image avatar"><div className="size-10 rounded-full border"><img src={message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"} alt="profile pic"/></div></div>
            <div className="chat-header mb-1"><time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time></div>
            <div className="chat-bubble flex flex-col">{message.image && (<img src={message.image} alt="Attachment" className="sm:max-w-[200px] rounded-md mb-2"/>)}{message.text && <p>{message.text}</p>}</div>
          </div>
        ))}
      </div>
      <MessageInput />
    </div>
  );
};
export default ChatContainer;