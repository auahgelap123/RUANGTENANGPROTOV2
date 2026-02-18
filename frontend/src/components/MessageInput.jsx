import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGameStore } from "../store/useGameStore.jsx"; 
import { Image, Send, X, Music, Link as LinkIcon, Youtube } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  
  // State Music
  const [showMusicInput, setShowMusicInput] = useState(false);
  const [musicLink, setMusicLink] = useState("");

  const fileInputRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore(); 
  const { sendMusicInvite } = useGameStore(); 

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

  // Submit Link Musik (Auto Detect)
  const handleMusicSubmit = (e) => {
      e.preventDefault();
      if(!musicLink.trim()) return;
      
      // Kirim ke store buat dideteksi logic-nya
      sendMusicInvite(selectedUser._id, musicLink);
      
      setMusicLink("");
      setShowMusicInput(false);
  };

  return (
    <div className="p-4 w-full relative">
      {/* POPUP INPUT MUSIK */}
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

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input type="text" className="w-full input input-bordered rounded-lg input-sm sm:input-md" placeholder="Ketik pesan..." value={text} onChange={(e) => setText(e.target.value)}/>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange}/>

          <button type="button" className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`} onClick={() => fileInputRef.current?.click()}><Image size={20} /></button>
          
          {/* Tombol Musik */}
          <button type="button" className={`hidden sm:flex btn btn-circle ${showMusicInput ? "text-primary bg-primary/10" : "text-zinc-400"}`} onClick={() => setShowMusicInput(!showMusicInput)}><Music size={20} /></button>
        </div>
        <button type="submit" className="btn btn-sm btn-circle" disabled={!text.trim() && !imagePreview}><Send size={22} /></button>
      </form>
    </div>
  );
};
export default MessageInput;