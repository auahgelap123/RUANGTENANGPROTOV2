import { X, ChevronLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedUser) return null;

  return (
    <div className="p-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        
        {/* TOMBOL BACK KHUSUS MOBILE */}
        <button 
          onClick={() => setSelectedUser(null)} 
          className="lg:hidden btn btn-sm btn-circle btn-ghost text-zinc-500"
        >
          <ChevronLeft className="size-6" />
        </button>

        {/* Avatar */}
        <div className="avatar">
          <div className="size-10 rounded-full relative">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} className="object-cover" />
          </div>
        </div>

        {/* Info */}
        <div>
          <h3 className="font-bold text-sm">{selectedUser.fullName}</h3>
          <p className="text-xs text-zinc-500">
            {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* TOMBOL CLOSE KHUSUS DESKTOP */}
      <button 
        onClick={() => setSelectedUser(null)} 
        className="hidden lg:flex btn btn-sm btn-circle btn-ghost"
      >
        <X className="size-5" />
      </button>
    </div>
  );
};
export default ChatHeader;