import User from "../models/user.model.js";

// Fungsi 1: Ambil semua user dari database buat dikirim ke Admin Panel
export const getAllUsersForAdmin = async (req, res) => {
  try {
    // Cari semua user, tapi jangan bawa password-nya (bahaya)
    const users = await User.find({}).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Fungsi 2: Update role user (Jadwalin jadi Volunteer/Psikolog/User)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body; // Role baru (volunteer/psychologist/user)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: role },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Server Error" });
  }
};