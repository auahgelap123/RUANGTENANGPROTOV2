import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // --- BASIC INFO ---
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    
    // --- ROLES & SOCIAL ---
    role: { 
      type: String, 
      enum: ["user", "volunteer", "admin", "psychologist"], 
      default: "user" 
    },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // --- REPUTATION (Untuk Relawan/Psikolog) ---
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    
    // --- GAMIFICATION & STATS ---
    gameWins: { type: Number, default: 0 },
    exp: { type: Number, default: 0 }, // Untuk nyimpen Total EXP
    
    // --- DIGITAL WELLBEING (Energi & Akses Waktu) ---
    points: {
      type: Number,
      default: 50, // Modal awal 50 Poin biar user baru bisa nyoba chat
    },
    chatAccessUntil: {
      type: Date,
      default: Date.now, // Default waktu habis/terkunci
    },

    // --- QUEST SYSTEM ---
    activeQuests: [{ 
        id: Number, 
        title: String, 
        description: String, 
        exp: Number, 
        points: Number, // <--- TAMBAHIN BARIS INI BRO
        questType: String 
    }],
    lastQuestDate: { type: String, default: "" } 
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;