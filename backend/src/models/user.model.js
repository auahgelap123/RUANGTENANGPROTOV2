import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    
    // UPDATE: Nambah role 'psychologist'
    role: { 
      type: String, 
      enum: ["user", "volunteer", "admin", "psychologist"], 
      default: "user" 
    },

    // BARU: Kolom buat nyimpen Rating
    rating: { type: Number, default: 0 },      // Rata-rata bintang (contoh: 4.8)
    totalReviews: { type: Number, default: 0 } // Berapa orang yang ngerating
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;