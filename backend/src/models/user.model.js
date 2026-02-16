import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    role: { 
      type: String, 
      enum: ["user", "volunteer", "admin", "psychologist"], 
      default: "user" 
    },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // --- QUEST SYSTEM (FIXED) ---
    activeQuests: [{ 
        id: Number, 
        title: String, 
        description: String, 
        exp: Number, 
        questType: String // <--- GANTI NAMA DARI 'type' JADI 'questType'
    }],
    lastQuestDate: { type: String, default: "" } 
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;