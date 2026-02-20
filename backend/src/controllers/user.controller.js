import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js"; 

// 0. GET USERS FOR SIDEBAR
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 1. RATING USER
export const rateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { stars } = req.body;
    if (stars < 1 || stars > 5) return res.status(400).json({ message: "1-5 Stars only" });

    const userToRate = await User.findById(id);
    if (!userToRate) return res.status(404).json({ message: "User not found" });

    const currentTotalScore = (userToRate.rating || 0) * (userToRate.totalReviews || 0);
    const newTotalReviews = (userToRate.totalReviews || 0) + 1;
    const newAverage = (currentTotalScore + stars) / newTotalReviews;

    userToRate.rating = parseFloat(newAverage.toFixed(1));
    userToRate.totalReviews = newTotalReviews;
    await userToRate.save();

    res.status(200).json(userToRate);
  } catch (error) {
    console.error("Rate Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. KIRIM REQUEST
export const sendFriendRequest = async (req, res) => {
  try {
    const { id } = req.params; 
    const myId = req.user._id;

    if (id === myId.toString()) return res.status(400).json({ message: "Gabisa add diri sendiri" });

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (targetUser.contacts.includes(myId)) return res.status(400).json({ message: "Sudah berteman" });
    if (targetUser.friendRequests.includes(myId)) return res.status(400).json({ message: "Request sudah dikirim" });
    
    await User.findByIdAndUpdate(id, { $addToSet: { friendRequests: myId } });

    const receiverSocketId = getReceiverSocketId(id);
    if (receiverSocketId) io.to(receiverSocketId).emit("friendUpdate");

    res.status(200).json({ message: "Permintaan dikirim", status: "pending" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. TERIMA REQUEST
export const acceptFriendRequest = async (req, res) => {
    try {
        const { id } = req.params; 
        const myId = req.user._id;

        await User.findByIdAndUpdate(myId, { $addToSet: { contacts: id }, $pull: { friendRequests: id } });
        await User.findByIdAndUpdate(id, { $addToSet: { contacts: myId } });

        const senderSocketId = getReceiverSocketId(id);
        if (senderSocketId) io.to(senderSocketId).emit("friendUpdate");

        res.status(200).json({ message: "Pertemanan diterima" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. HAPUS TEMAN (UNFRIEND)
export const removeContact = async (req, res) => {
    try {
        const { id } = req.params; 
        const myId = req.user._id;

        await User.findByIdAndUpdate(myId, { $pull: { contacts: id, friendRequests: id } });
        await User.findByIdAndUpdate(id, { $pull: { contacts: myId, friendRequests: myId } });

        const exFriendSocketId = getReceiverSocketId(id);
        if (exFriendSocketId) io.to(exFriendSocketId).emit("friendUpdate");

        res.status(200).json({ message: "Berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// 5. UPDATE GAME WIN
export const addGameWin = async (req, res) => {
    try {
        const userId = req.user._id;
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $inc: { gameWins: 1 } }, 
            { new: true }
        );
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// 6. GET LEADERBOARD
export const getLeaderboard = async (req, res) => {
    try {
        const leaders = await User.find({}).sort({ gameWins: -1 }).limit(5).select("fullName profilePic gameWins");
        res.status(200).json(leaders);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// 7. BELI WAKTU CHAT DENGAN ENERGI (SISTEM PAKET WAKTU)
export const buyChatTime = async (req, res) => {
  try {
    const userId = req.user._id;
    const { packageKey } = req.body; 
    const user = await User.findById(userId);

    // DAFTAR PAKET WAKTU & HARGA POIN
    const PACKAGES = {
        '30m': { cost: 10, ms: 30 * 60 * 1000, label: "30 Menit" },
        '1h': { cost: 20, ms: 60 * 60 * 1000, label: "1 Jam" },
        '2h': { cost: 35, ms: 2 * 60 * 60 * 1000, label: "2 Jam" },
        '4h': { cost: 60, ms: 4 * 60 * 60 * 1000, label: "4 Jam" },
        '12h': { cost: 150, ms: 12 * 60 * 60 * 1000, label: "12 Jam" },
        '24h': { cost: 250, ms: 24 * 60 * 60 * 1000, label: "24 Jam" }
    };

    const selectedPkg = PACKAGES[packageKey];
    
    // Kalau packageKey nggak valid, kasih pesan error
    if (!selectedPkg) return res.status(400).json({ message: "Paket waktu tidak valid." });

    if (user.points < selectedPkg.cost) {
      return res.status(400).json({ message: "Energi tidak cukup! Selesaikan quest dulu ya." });
    }

    // Kurangi poin
    user.points -= selectedPkg.cost;

    // Kalkulasi Waktu (Diakumulasi kalau dia beli pas sisa waktu masih ada)
    const now = new Date();
    let currentAccess = user.chatAccessUntil && user.chatAccessUntil > now 
        ? new Date(user.chatAccessUntil) 
        : new Date(now);
    
    currentAccess.setTime(currentAccess.getTime() + selectedPkg.ms);
    user.chatAccessUntil = currentAccess;

    await user.save();

    res.status(200).json({ 
      message: `Berhasil menukar ${selectedPkg.cost} Energi untuk akses ${selectedPkg.label}!`,
      points: user.points,
      chatAccessUntil: user.chatAccessUntil
    });

  } catch (error) {
    console.error("Buy Time Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

//ADMIN CONTROLLER: RESET WAKTU CHAT (BUAT TESTING / ADMIN PANEL)
// --- 8. ADMIN: MANIPULASI POIN ---
export const adminUpdatePoints = async (req, res) => {
    try {
        // Cek apakah yang nge-request ini beneran Admin
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
        }

        const { id } = req.params; // ID user yang mau diedit
        const { pointsToAdd } = req.body; // Bisa angka plus (100) atau minus (-50)
        
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        // Update poin (gak boleh minus dari 0)
        user.points = Math.max(0, (user.points || 0) + Number(pointsToAdd));
        await user.save();

        res.status(200).json({ 
            message: `Poin ${user.fullName} berhasil diupdate jadi ${user.points} ⚡`, 
            points: user.points 
        });
    } catch (error) {
        console.error("Admin Update Points Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 9. ADMIN: MANIPULASI WAKTU CHAT ---
export const adminUpdateChatTime = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
        }

        const { id } = req.params;
        const { action, hoursToAdd } = req.body; // action: "expire" (reset ke 0) atau "add"

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        const now = new Date();

        if (action === "expire") {
            // Set waktu ke saat ini (langsung habis/kegembok detik ini juga)
            user.chatAccessUntil = now;
        } else if (action === "add") {
            // Tambah waktu
            let currentAccess = user.chatAccessUntil && user.chatAccessUntil > now 
                ? new Date(user.chatAccessUntil) 
                : new Date(now);
            currentAccess.setHours(currentAccess.getHours() + Number(hoursToAdd));
            user.chatAccessUntil = currentAccess;
        }

        await user.save();

        res.status(200).json({ 
            message: action === "expire" 
                ? `Waktu chat ${user.fullName} berhasil di-reset (Habis) 🔒` 
                : `Berhasil menambah ${hoursToAdd} jam ke ${user.fullName} ⏳`, 
            chatAccessUntil: user.chatAccessUntil 
        });
    } catch (error) {
        console.error("Admin Update Time Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};