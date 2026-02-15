import User from "../models/user.model.js";

// Logic buat ngasih Rating ke User
export const rateUser = async (req, res) => {
  try {
    const { id } = req.params; // ID orang yang mau dirating
    const { stars } = req.body; // Jumlah bintang (1-5)

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Bintang harus 1 sampai 5" });
    }

    const userToRate = await User.findById(id);
    if (!userToRate) return res.status(404).json({ message: "User not found" });

    // Rumus Matematika Rata-Rata Baru
    // (Rata2 Lama * Jumlah Lama) + Bintang Baru  /  (Jumlah Lama + 1)
    const currentTotalScore = (userToRate.rating || 0) * (userToRate.totalReviews || 0);
    const newTotalReviews = (userToRate.totalReviews || 0) + 1;
    const newAverage = (currentTotalScore + stars) / newTotalReviews;

    // Update Database
    userToRate.rating = parseFloat(newAverage.toFixed(1)); // Ambil 1 desimal aja (contoh: 4.5)
    userToRate.totalReviews = newTotalReviews;
    
    await userToRate.save();

    res.status(200).json(userToRate);
  } catch (error) {
    console.error("Error rating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};