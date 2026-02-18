import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js"; 

// 1. RATING USER
export const rateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { stars } = req.body;
    if (stars < 1 || stars > 5) return res.status(400).json({ message: "1-5 Stars only" });

    const userToRate = await User.findById(id);
    if (!userToRate) return res.status(404).json({ message: "User not found" });

    // Hitung Rata-rata Rating Baru
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
    
    // Masuk ke Pending List Target
    await User.findByIdAndUpdate(id, { $addToSet: { friendRequests: myId } });

    // Notif Realtime
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

        // Sahkan dua arah
        await User.findByIdAndUpdate(myId, { $addToSet: { contacts: id }, $pull: { friendRequests: id } });
        await User.findByIdAndUpdate(id, { $addToSet: { contacts: myId } }); // Target gak perlu pull request karena dia gak nyimpen request kita

        // Notif Realtime
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

        // Bersihkan Total (Hapus dari kontak & request di KEDUA sisi)
        await User.findByIdAndUpdate(myId, { $pull: { contacts: id, friendRequests: id } });
        await User.findByIdAndUpdate(id, { $pull: { contacts: myId, friendRequests: myId } });

        // Notif Realtime
        const exFriendSocketId = getReceiverSocketId(id);
        if (exFriendSocketId) io.to(exFriendSocketId).emit("friendUpdate");

        res.status(200).json({ message: "Berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// ... fungsi removeContact dll ...

// 5. UPDATE GAME WIN (Saat menang game)
export const addGameWin = async (req, res) => {
    try {
        const userId = req.user._id;
        // Tambah 1 kemenangan
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

// 6. GET LEADERBOARD (Top 5 Player)
export const getLeaderboard = async (req, res) => {
    try {
        // Ambil 5 user dengan gameWins terbanyak, urutkan descending
        const leaders = await User.find({}).sort({ gameWins: -1 }).limit(5).select("fullName profilePic gameWins");
        res.status(200).json(leaders);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};