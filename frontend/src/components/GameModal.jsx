import { useGameStore } from "../store/useGameStore.jsx";
import { useChatStore } from "../store/useChatStore";
import { X, Trophy, Frown, Hand, Gamepad2, Timer, FastForward } from "lucide-react";
import { useState, useEffect } from "react";

const TRIVIA_QUESTIONS = [
    { q: "Ibukota Indonesia?", a: "Jakarta" },
    { q: "2 + 2 x 2?", a: "6" },
    { q: "Hewan kaki seribu?", a: "Lipan" },
    { q: "Warna bendera kita?", a: "Merah Putih" },
    { q: "Presiden pertama RI?", a: "Soekarno" },
    { q: "10 x 10?", a: "100" },
    { q: "Bahasa Inggris 'Kucing'?", a: "Cat" }
];

const GameModal = () => {
  const { isModalOpen, isGameActive, gameType, gameState, moveTicTacToe, moveSuit, submitMath, submitGuess, submitTrivia, isMyTurn, result, closeGameMenu, sendInvite, scores, round, nextRound } = useGameStore();
  const { selectedUser } = useChatStore();
  const [inputVal, setInputVal] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!isGameActive || result || !isMyTurn) return;
    if (["MATH", "TRIVIA"].includes(gameType)) {
        setTimeLeft(15);
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev <= 1 ? 0 : prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [isGameActive, result, isMyTurn, gameState]);

  if (!isModalOpen) return null;

  if (!isGameActive) {
      return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
             <div className="modal-box bg-base-100 max-w-lg text-center p-8">
                 <h3 className="font-black text-2xl mb-4">ARCADE ZONE 🕹️</h3>
                 <p className="mb-4 text-zinc-500">Pilih game buat mabar sama {selectedUser?.fullName}</p>
                 <div className="grid grid-cols-2 gap-3">
                     {["TICTACTOE", "SUIT", "MATH", "TEBAK_ANGKA", "TRIVIA"].map(g => (
                         <button key={g} onClick={() => sendInvite(selectedUser._id, g)} className="btn btn-outline h-16">{g}</button>
                     ))}
                 </div>
                 <button onClick={closeGameMenu} className="btn btn-circle btn-sm absolute right-2 top-2"><X/></button>
             </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="modal-box bg-base-100 max-w-md w-full relative border-2 border-base-300 shadow-2xl overflow-hidden p-0">
        
        {/* HEADER SIMPLE */}
        <div className="bg-base-200 p-3 flex items-center justify-between border-b border-base-300">
             <div className="badge badge-primary badge-outline font-bold">{gameType}</div>
             <button onClick={closeGameMenu} className="btn btn-sm btn-circle btn-ghost"><X/></button>
        </div>

        {/* SCOREBOARD */}
        <div className="flex justify-between items-center p-4 bg-base-100">
             <div className="text-center">
                 <span className="text-xs text-zinc-500">Kamu</span>
                 <div className="text-3xl font-black text-primary">{scores.me}</div>
             </div>
             <div className="flex flex-col items-center">
                 <div className="badge badge-outline font-bold px-4 py-3 mb-1">RONDE {round}</div>
                 <span className="text-[10px] text-zinc-400 uppercase tracking-widest">First to 3</span>
             </div>
             <div className="text-center">
                 <span className="text-xs text-zinc-500">Lawan</span>
                 <div className="text-3xl font-black text-error">{scores.opponent}</div>
             </div>
        </div>

        {/* GAME AREA */}
        <div className="p-6 bg-base-100 min-h-[300px] flex flex-col justify-center items-center relative">
            
            {result && !result.includes("MATCH") && (
                <div className="absolute inset-0 z-10 bg-base-100/90 flex flex-col items-center justify-center animate-in fade-in">
                    <h2 className="text-3xl font-black mb-2">{result === "WIN_ROUND" ? "WIN! 🔥" : result === "LOSE_ROUND" ? "LOSE..." : "SERI!"}</h2>
                    <button onClick={nextRound} className="btn btn-primary mt-6 gap-2 w-full max-w-xs"><FastForward className="size-5"/> Lanjut Ronde {round + 1}</button>
                </div>
            )}

            {result && result.includes("MATCH") && (
                <div className="absolute inset-0 z-20 bg-black/95 flex flex-col items-center justify-center text-white text-center p-6">
                    <Trophy className="size-24 text-yellow-400 mb-4 animate-bounce"/>
                    <h1 className="text-5xl font-black text-yellow-400 mb-2">{result === "WIN_MATCH" ? "VICTORY!" : "DEFEAT"}</h1>
                    <button onClick={closeGameMenu} className="btn btn-outline text-white btn-wide">Selesai</button>
                </div>
            )}

            {!result && (
                <>
                   {gameType === "TICTACTOE" && (
                        <div className="grid grid-cols-3 gap-3 w-64 h-64">
                            {gameState.board.map((c, i) => (
                                <button key={i} onClick={() => moveTicTacToe(i)} disabled={!!c || !isMyTurn} className={`btn h-full text-4xl font-black ${c==="X"?"btn-primary text-white":c==="O"?"btn-error text-white":"btn-outline"}`}>{c}</button>
                            ))}
                        </div>
                   )}
                   {gameType === "SUIT" && (
                       <div className="flex justify-center gap-4 w-full">
                           {["batu","gunting","kertas"].map(c => (
                               <button key={c} onClick={() => moveSuit(c)} disabled={!isMyTurn || gameState.myChoice} className={`btn btn-circle btn-xl w-20 h-20 text-3xl ${gameState.myChoice===c?"btn-primary":"btn-outline"}`}>
                                   {c==="batu"?"✊":c==="gunting"?"✌️":"✋"}
                               </button>
                           ))}
                       </div>
                   )}
                   {gameType === "MATH" && (
                       <div className="w-full text-center">
                           <div className="text-6xl font-black mb-8">{gameState.q}</div>
                           <input type="number" className="input input-bordered input-lg w-full text-center text-3xl" autoFocus onChange={(e) => setInputVal(e.target.value)} onKeyDown={(e) => e.key==="Enter" && submitMath(inputVal)}/>
                       </div>
                   )}
                   {gameType === "TRIVIA" && (
                       <div className="w-full text-center">
                           <div className="card bg-primary text-white p-6 mb-6"><h3 className="text-xl font-bold">{TRIVIA_QUESTIONS[gameState.currentQ]?.q}</h3></div>
                           <input type="text" className="input input-bordered w-full text-center" placeholder="Jawab..." onChange={(e)=>setInputVal(e.target.value)} onKeyDown={(e)=>e.key==="Enter" && submitTrivia(inputVal)}/>
                       </div>
                   )}
                   {gameType === "TEBAK_ANGKA" && (
                       <div className="w-full text-center">
                           <p className="mb-2">Tebak 0-100</p>
                           <input type="number" className="input input-bordered input-lg w-full text-center" onChange={(e)=>setInputVal(e.target.value)} onKeyDown={(e)=>e.key==="Enter" && submitGuess(inputVal)}/>
                           <div className="mt-2 text-xs">{gameState.history?.map(h => <span className="badge badge-ghost mr-1">{h}</span>)}</div>
                       </div>
                   )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default GameModal;