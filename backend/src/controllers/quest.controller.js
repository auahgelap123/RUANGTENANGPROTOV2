import User from "../models/user.model.js";

// --- KOLAM MISI (QUEST POOL) ---
const QUEST_POOL = [
    { id: 1, title: "Sapa Pagi", description: "Sapa seseorang di chat hari ini.", exp: 20, points: 15, questType: "text" },
    { id: 2, title: "Langit Biru", description: "Foto langit hari ini dan ceritakan perasaanmu.", exp: 50, points: 30, questType: "image" },
    { id: 3, title: "Air Putih", description: "Upload foto botol minummu, jangan lupa hidrasi!", exp: 30, points: 20, questType: "image" },
    { id: 4, title: "Jurnal Singkat", description: "Tulis 3 hal yang bikin kamu bersyukur hari ini.", exp: 40, points: 25, questType: "text" },
    { id: 5, title: "Tanaman", description: "Foto tanaman atau pohon di sekitarmu.", exp: 35, points: 20, questType: "image" },
    { id: 6, title: "Musik", description: "Ceritakan lagu apa yang lagi kamu dengerin.", exp: 25, points: 15, questType: "text" },
    { id: 7, title: "Olahraga", description: "Foto sepatumu atau alat olahragamu.", exp: 60, points: 35, questType: "image" },
    { id: 8, title: "Selfie Senyum", description: "Ayo senyum! Kirim foto senyum terbaikmu.", exp: 50, points: 30, questType: "image" }
];

// Helper: Tanggal WIB (Indonesia)
const getIndonesianDate = () => {
    const date = new Date();
    date.setHours(date.getHours() + 7); // Tambah 7 jam buat WIB
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
};

const getRandomQuests = (count) => {
    const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// 1. GET QUEST (FIXED: Reset Murni Berdasarkan Pergantian Hari)
export const getDailyQuests = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const today = getIndonesianDate(); // Pake Tanggal WIB hari ini

    const isDataCorrupt = user.activeQuests.length > 0 && !user.activeQuests[0].questType;

    // LOGIC BARU: HANYA reset kalau tanggalnya beda (user.lastQuestDate !== today)
    // Syarat 'length === 0' udah gue hapus!
    if (user.lastQuestDate !== today || isDataCorrupt) {
        const newQuests = getRandomQuests(3);
        user.activeQuests = newQuests;
        user.lastQuestDate = today;
        await user.save();
        return res.status(200).json(newQuests);
    }

    // Kalau hari ini udah ngambil/ngerjain quest, balikin sisa quest yang ada
    res.status(200).json(user.activeQuests);
  } catch (error) {
    console.error("Error fetch quests:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. SUBMIT QUEST
export const submitQuest = async (req, res) => {
  try {
    const { questId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const questToSubmit = user.activeQuests.find(q => q.id === questId);
    if (!questToSubmit) {
        return res.status(400).json({ message: "Quest tidak ditemukan atau sudah selesai." });
    }

    await User.findByIdAndUpdate(userId, {
        $inc: { 
            exp: questToSubmit.exp, 
            points: questToSubmit.points 
        },
        $pull: { activeQuests: { id: questId } }
    });

    res.status(200).json({ 
        message: "Quest completed!", 
        addedExp: questToSubmit.exp,
        addedPoints: questToSubmit.points
    });
  } catch (error) {
    console.error("Error submit quest:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 3. REROLL QUEST
export const rerollQuest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const user = await User.findById(userId);

        const questIndex = user.activeQuests.findIndex(q => q.id === parseInt(id));
        if (questIndex === -1) return res.status(404).json({ message: "Quest not found" });

        const currentQuestIds = user.activeQuests.map(q => q.id);
        const availableQuests = QUEST_POOL.filter(q => !currentQuestIds.includes(q.id));

        const poolToUse = availableQuests.length > 0 ? availableQuests : QUEST_POOL;
        const randomNewQuest = poolToUse[Math.floor(Math.random() * poolToUse.length)];

        user.activeQuests[questIndex] = randomNewQuest;
        await user.save();

        res.status(200).json(user.activeQuests);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 4. ADMIN: PAKSA RESET QUEST USER ---
export const adminResetUserQuest = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Akses ditolak. Khusus Admin!" });
        }

        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

        // Paksa ganti tanggalnya jadi 'reset' biar pas dia buka tab quest, 
        // sistem ngira ini hari yang beda dan langsung bikin quest baru.
        user.lastQuestDate = "reset"; 
        user.activeQuests = []; 
        await user.save();

        res.status(200).json({ message: `Quest ${user.fullName} berhasil di-reset! 🔄` });
    } catch (error) {
        console.error("Admin Reset Quest Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};