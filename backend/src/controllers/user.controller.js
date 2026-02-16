import User from "../models/user.model.js";

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
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. KIRIM REQUEST (SEND REQUEST)
export const sendFriendRequest = async (req, res) => {
  try {
    const { id } = req.params; // Orang yang mau di-add
    const myId = req.user._id;

    if (id === myId.toString()) return res.status(400).json({ message: "Gabisa add diri sendiri" });

    const targetUser = await User.findById(id);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // LOGIC: Kalau dia Volunteer/Psikolog -> LANGSUNG ADD (Auto Accept)
    if (targetUser.role === "volunteer" || targetUser.role === "psychologist") {
       await User.findByIdAndUpdate(myId, { $addToSet: { contacts: id } });
       // Opsional: Volunteer ga wajib add balik, tapi biar bisa chat 2 arah, add aja
       // await User.findByIdAndUpdate(id, { $addToSet: { contacts: myId } });
       return res.status(200).json({ message: "Added instantly", status: "connected" });
    }

    // LOGIC: Kalau User Biasa -> MASUK REQUEST
    if (targetUser.friendRequests.includes(myId)) {
        return res.status(400).json({ message: "Request sudah dikirim sebelumnya" });
    }
    
    // Masukin ID kita ke kotak "friendRequests" dia
    await User.findByIdAndUpdate(id, { $addToSet: { friendRequests: myId } });

    res.status(200).json({ message: "Request sent", status: "pending" });

  } catch (error) {
    console.log("Error send request:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. TERIMA REQUEST (ACCEPT)
export const acceptFriendRequest = async (req, res) => {
    try {
        const { id } = req.params; // ID orang yang request ke kita
        const myId = req.user._id;

        // 1. Masukin ke contacts masing-masing (Sah Temenan)
        await User.findByIdAndUpdate(myId, { 
            $addToSet: { contacts: id },
            $pull: { friendRequests: id } // Hapus dari antrian request
        });
        
        await User.findByIdAndUpdate(id, { $addToSet: { contacts: myId } });

        res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. HAPUS TEMAN (UNFRIEND)
export const removeContact = async (req, res) => {
    try {
        const { id } = req.params; // ID teman yang mau dibuang
        const myId = req.user._id;

        // Hapus dari kontak SAYA
        await User.findByIdAndUpdate(myId, { $pull: { contacts: id } });
        
        // Hapus saya dari kontak DIA (Biar putus hubungan total)
        await User.findByIdAndUpdate(id, { $pull: { contacts: myId } });

        res.status(200).json({ message: "Unfriended successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};