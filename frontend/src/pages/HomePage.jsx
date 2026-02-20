import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden relative">
            
            <Sidebar />

            {/* --- FIX RESPONSIVE DI SINI --- */}
            {/* Kalau di HP (belum pilih chat) -> Sembunyikan layar kanan (hidden) */}
            {/* Kalau di Laptop (lg) -> Selalu tampilkan layar kanan (lg:flex) */}
            <div className={`flex-1 flex-col h-full ${!selectedUser ? "hidden lg:flex" : "flex"}`}>
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
            {/* ----------------------------- */}

          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;