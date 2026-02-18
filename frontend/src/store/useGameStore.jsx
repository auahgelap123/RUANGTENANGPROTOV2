import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const TRIVIA_QUESTIONS = [
    { q: "Ibukota Indonesia?", a: "Jakarta" },
    { q: "2 + 2 x 2?", a: "6" },
    { q: "Hewan kaki seribu?", a: "Lipan" },
    { q: "Warna bendera kita?", a: "Merah Putih" },
    { q: "Presiden pertama RI?", a: "Soekarno" },
    { q: "10 x 10?", a: "100" },
    { q: "Bahasa Inggris 'Kucing'?", a: "Cat" }
];

export const useGameStore = create((set, get) => ({
  isModalOpen: false,
  isGameActive: false,
  gameType: null, 
  opponentId: null,
  myRole: null, 
  gameState: {}, 
  scores: { me: 0, opponent: 0 }, 
  round: 1,
  isMyTurn: false,
  result: null, 
  
  // STATE MUSIC HYBRID
  musicId: null,
  musicPlatform: null, 
  musicType: null,     
  isMusicActive: false,
  musicTimestamp: 0, 

  leaderboard: [],

  openGameMenu: () => set({ isModalOpen: true }),
  closeGameMenu: () => set({ isModalOpen: false, isGameActive: false, result: null, gameState: {}, scores: {me:0, opponent:0}, round: 1 }),

  // --- MUSIC ACTIONS (FIXED SYNC & STOP) ---
  
  // 1. Send Invite (Sudah Benar)
  sendMusicInvite: (targetId, link) => {
      const socket = useAuthStore.getState().socket;
      let platform = null, id = null, type = null;

      const ytMatch = link.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      const spMatch = link.match(/spotify\.com\/(?:intl-[a-z0-9]+\/)?(track|playlist|album|artist)\/([a-zA-Z0-9]+)/);

      if (ytMatch && ytMatch[2].length === 11) {
          platform = "youtube"; id = ytMatch[2];
      } else if (spMatch) {
          platform = "spotify"; type = spMatch[1]; id = spMatch[2];
      } else {
          toast.error("Link tidak valid! Gunakan link YouTube atau Spotify.");
          return;
      }

      set({ musicId: id, musicPlatform: platform, musicType: type, isMusicActive: true, musicTimestamp: 0 });

      socket.emit("musicBotAction", { 
          targetId, action: "INVITE", data: { id, platform, type, timestamp: 0 } 
      });
      toast.success(`Mengajak dengar ${platform}...`);
  },

  acceptMusicInvite: (data) => {
      set({ 
          musicId: data.id, 
          musicPlatform: data.platform, 
          musicType: data.type, 
          isMusicActive: true,
          musicTimestamp: data.timestamp || 0 
      });
      toast.success(`Mendengarkan ${data.platform}! 🎧`);
  },

  // 2. Resync Music (FIXED: Terima targetId)
  resyncMusic: (targetId) => {
      const { musicId, musicPlatform, musicType } = get();
      const socket = useAuthStore.getState().socket;
      const newTimestamp = Date.now(); 
      
      set({ musicTimestamp: newTimestamp }); 
      
      // Kirim ke targetId yang diklik di ChatContainer
      if(targetId) {
          socket.emit("musicBotAction", { targetId, action: "SYNC", data: { id: musicId, platform: musicPlatform, type: musicType, timestamp: newTimestamp } });
          toast("🔄 Menyinkronkan ulang...");
      }
  },

  // 3. Stop Music (FIXED: Terima targetId)
  stopMusic: (targetId) => {
      const socket = useAuthStore.getState().socket;
      set({ isMusicActive: false, musicId: null });
      
      if(targetId) {
          socket.emit("musicBotAction", { targetId, action: "STOP", data: {} });
          toast("Musik dihentikan.");
      }
  },

  // --- GAME ACTIONS ---
  sendInvite: (targetId, type) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("gameInvite", { targetId, gameType: type });
    set({ isModalOpen: false });
    toast.success(`Mengundang main...`);
  },
  acceptInvite: (targetId, type) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("gameAccept", { targetId, gameType: type });
  },
  sendMove: (data) => {
      const { opponentId } = get();
      const socket = useAuthStore.getState().socket;
      socket.emit("gameMove", { targetId: opponentId, moveData: data });
  },
  nextRound: () => {
      const { opponentId, gameType } = get();
      const socket = useAuthStore.getState().socket;
      socket.emit("gameNextRound", { targetId: opponentId });
      get().resetBoard(gameType);
  },
  resetBoard: (gameType) => {
      let initialState = {};
      if(gameType === "TICTACTOE") initialState = { board: Array(9).fill(null) };
      if(gameType === "SUIT") initialState = { myChoice: null, opponentChoice: null };
      if(gameType === "MATH") { const n1 = Math.floor(Math.random()*20); const n2 = Math.floor(Math.random()*20); initialState = { q: `${n1} + ${n2} = ?`, targetAnswer: n1+n2 }; }
      if(gameType === "TEBAK_ANGKA") initialState = { secretInfos: Math.floor(Math.random()*100), history: [] };
      if(gameType === "TRIVIA") initialState = { currentQ: Math.floor(Math.random() * TRIVIA_QUESTIONS.length) };
      set((state) => ({ gameState: initialState, result: null, round: state.round + 1, isMyTurn: state.myRole === "HOST" }));
      if(["SUIT", "MATH", "TRIVIA"].includes(gameType)) set({ isMyTurn: true });
  },
  handleRoundEnd: (resultType) => { 
      const { scores } = get();
      let newScores = { ...scores };
      let finalResult = null;
      if(resultType === "WIN") newScores.me += 1;
      if(resultType === "LOSE") newScores.opponent += 1;
      if(newScores.me >= 3) { finalResult = "WIN_MATCH"; get().registerWin(); } 
      else if (newScores.opponent >= 3) { finalResult = "LOSE_MATCH"; } 
      else { finalResult = resultType === "WIN" ? "WIN_ROUND" : resultType === "LOSE" ? "LOSE_ROUND" : "DRAW_ROUND"; }
      set({ scores: newScores, result: finalResult });
  },
  registerWin: async () => { try { await axiosInstance.put("/users/add-win"); get().fetchLeaderboard(); } catch (e) {} },
  fetchLeaderboard: async () => { try { const res = await axiosInstance.get("/users/leaderboard"); set({ leaderboard: res.data }); } catch (e) {} },
  
  moveTicTacToe: (index) => {
      const { gameState, isMyTurn, myRole } = get();
      if(!isMyTurn || gameState.board[index]) return;
      const symbol = myRole === "HOST" ? "X" : "O";
      const newBoard = [...gameState.board];
      newBoard[index] = symbol;
      set({ gameState: { ...gameState, board: newBoard }, isMyTurn: false });
      get().sendMove({ type: "TICTACTOE_MOVE", index, symbol });
      get().checkTicTacToeWinner(newBoard, symbol);
  },
  checkTicTacToeWinner: (board, mySymbol) => {
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      if(lines.some(([a,b,c]) => board[a] && board[a]===board[b] && board[a]===board[c] && board[a]===mySymbol)) {
          get().handleRoundEnd("WIN"); get().sendMove({ type: "ROUND_OVER", result: "LOSE" }); 
      } else if (!board.includes(null)) { get().handleRoundEnd("DRAW"); get().sendMove({ type: "ROUND_OVER", result: "DRAW" }); }
  },
  moveSuit: (choice) => { set({ gameState: { ...get().gameState, myChoice: choice }, isMyTurn: false }); get().sendMove({ type: "SUIT_PICK", choice }); get().checkSuitWinner(); },
  checkSuitWinner: () => {
      const { myChoice, opponentChoice } = get().gameState;
      if(!myChoice || !opponentChoice) return; 
      if(myChoice === opponentChoice) { get().handleRoundEnd("DRAW"); } 
      else if ((myChoice === "batu" && opponentChoice === "gunting") || (myChoice === "gunting" && opponentChoice === "kertas") || (myChoice === "kertas" && opponentChoice === "batu")) { get().handleRoundEnd("WIN"); } 
      else { get().handleRoundEnd("LOSE"); }
  },
  submitMath: (answer) => { const { targetAnswer } = get().gameState; if(parseInt(answer) === targetAnswer) { get().handleRoundEnd("WIN"); get().sendMove({ type: "ROUND_OVER", result: "LOSE" }); } },
  submitGuess: (num) => { const { secretInfos } = get().gameState; if(parseInt(num) === secretInfos) { get().handleRoundEnd("WIN"); get().sendMove({ type: "ROUND_OVER", result: "LOSE" }); } else { get().sendMove({ type: "GUESS_WRONG", num }); set({ isMyTurn: false }); } },
  submitTrivia: (answer) => { const { currentQ } = get().gameState; if(answer.toLowerCase() === TRIVIA_QUESTIONS[currentQ].a.toLowerCase()) { get().handleRoundEnd("WIN"); get().sendMove({ type: "ROUND_OVER", result: "LOSE" }); } else { toast.error("Salah!"); } },

  subscribeToGameEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.on("gameInviteReceived", ({ fromId, gameType }) => { toast((t) => ( <div className="flex flex-col gap-2"><span className="font-bold">🎮 Diajak main {gameType}!</span><button onClick={() => { get().acceptInvite(fromId, gameType); toast.dismiss(t.id); }} className="btn btn-sm btn-primary">Gas Main!</button></div>), { duration: 5000 }); });
    socket.on("gameStart", ({ opponentId, role, gameType }) => { set({ scores: { me: 0, opponent: 0 }, round: 1 }); set({ isModalOpen: true, isGameActive: true, result: null, gameType, opponentId, myRole: role }); get().resetBoard(gameType); });
    socket.on("gameNextRoundReceived", () => { const { gameType } = get(); get().resetBoard(gameType); toast("Ronde Baru Dimulai!"); });
    socket.on("gameMoveReceived", (data) => {
        const { gameState, gameType } = get();
        if(data.type === "ROUND_OVER") { get().handleRoundEnd(data.result); }
        if(gameType === "TICTACTOE" && data.type === "TICTACTOE_MOVE") { const newBoard = [...gameState.board]; newBoard[data.index] = data.symbol; set({ gameState: { board: newBoard }, isMyTurn: true }); }
        if(gameType === "SUIT" && data.type === "SUIT_PICK") { set({ gameState: { ...gameState, opponentChoice: data.choice } }); get().checkSuitWinner(); }
        if(gameType === "TEBAK_ANGKA" && data.type === "GUESS_WRONG") { set({ isMyTurn: true, gameState: { ...gameState, history: [...gameState.history, data.num] } }); }
    });
    socket.on("musicBotActionReceived", ({ action, data }) => {
        if(action === "INVITE") { toast((t) => ( <div className="flex flex-col gap-2"><div className="font-bold text-sm">🎵 Undangan Dengar Bareng</div><div className="flex gap-2 mt-1"><button onClick={() => { get().acceptMusicInvite(data); toast.dismiss(t.id); }} className="btn btn-xs btn-success text-white">Accept</button><button onClick={() => toast.dismiss(t.id)} className="btn btn-xs btn-ghost">Ignore</button></div></div> ), { duration: 8000, position: "top-right" }); }
        if(action === "SYNC") { set({ musicId: data.id, musicPlatform: data.platform, musicType: data.type, isMusicActive: true, musicTimestamp: data.timestamp }); toast("🔄 Sinkronisasi ulang..."); }
        if(action === "STOP") { set({ isMusicActive: false, musicId: null }); toast("Musik dihentikan teman."); }
    });
  },

  unsubscribeFromGameEvents: () => {
    const socket = useAuthStore.getState().socket;
    if(socket) {
        socket.off("gameInviteReceived"); socket.off("gameStart"); socket.off("gameMoveReceived"); socket.off("gameNextRoundReceived"); socket.off("musicBotActionReceived");
    }
  }
}));