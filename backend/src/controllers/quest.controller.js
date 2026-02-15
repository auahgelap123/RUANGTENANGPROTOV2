import cloudinary from "../lib/cloudinary.js";

const QUEST_POOL = [
  {
    id: "q1",
    title: "Selfie Senyum",
    description: "Ambil selfie senyum terbaikmu hari ini biar PD nambah!",
    type: "image",
    exp: "50 XP",
  },
  {
    id: "q2",
    title: "Touch Grass",
    description: "Foto suasana di luar rumah/kosan kamu. Buktikan kamu keluar!",
    type: "image",
    exp: "40 XP",
  },
  {
    id: "q3",
    title: "Sapa Orang Baru",
    description: "Ceritakan gimana kamu nyapa orang asing hari ini. Respon mereka gimana?",
    type: "text",
    minLength: 50,
    exp: "100 XP",
  },
  {
    id: "q4",
    title: "Kebaikan Kecil",
    description: "Tulis satu hal baik yang kamu lakuin buat orang lain hari ini.",
    type: "text",
    minLength: 30,
    exp: "60 XP",
  },
  {
    id: "q5",
    title: "Langit Hari Ini",
    description: "Foto langit di tempatmu sekarang. Mendung atau cerah?",
    type: "image",
    exp: "30 XP",
  },
];

export const getDailyQuests = async (req, res) => {
  try {
    // Logic: Quest berubah setiap hari (berdasarkan tanggal)
    const today = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = today.charCodeAt(i) + ((hash << 5) - hash);
    }

    const selectedQuests = [];
    const poolSize = QUEST_POOL.length;
    
    let index1 = Math.abs(hash) % poolSize;
    let index2 = Math.abs(hash * 2) % poolSize;
    let index3 = Math.abs(hash * 3) % poolSize;

    if (index2 === index1) index2 = (index2 + 1) % poolSize;
    if (index3 === index1 || index3 === index2) index3 = (index3 + 1) % poolSize;

    selectedQuests.push(QUEST_POOL[index1], QUEST_POOL[index2], QUEST_POOL[index3]);

    res.status(200).json(selectedQuests);
  } catch (error) {
    console.log("Error in getDailyQuests: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const submitQuest = async (req, res) => {
  try {
    const { questId, textResponse, imageResponse } = req.body;
    const quest = QUEST_POOL.find((q) => q.id === questId);

    if (!quest) return res.status(404).json({ message: "Quest tidak ditemukan" });

    // Validasi Anti-Troll Text
    if (quest.type === "text") {
      if (!textResponse || textResponse.length < quest.minLength) {
        return res.status(400).json({ 
          message: `Jawaban terlalu pendek! Minimal ${quest.minLength} karakter biar gak dikira trolling.` 
        });
      }
    }

    // Validasi Anti-Troll Image
    if (quest.type === "image") {
      if (!imageResponse) {
        return res.status(400).json({ message: "Harus upload foto bukti dong!" });
      }
      try {
        await cloudinary.uploader.upload(imageResponse);
      } catch (uploadError) {
        return res.status(500).json({ message: "Gagal upload gambar ke server" });
      }
    }

    res.status(200).json({ message: "Quest Selesai! XP Bertambah.", earnedExp: quest.exp });

  } catch (error) {
    console.log("Error in submitQuest: ", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};