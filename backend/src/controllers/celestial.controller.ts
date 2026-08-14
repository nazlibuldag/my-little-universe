import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';
import { analyzeMemoryText } from '../services/ai.service';

const INITIAL_CELESTIALS = [
  { category: "Person", title: "Ayşe (En Yakın Dost)", description: "Liseden beri en güvendiğim sırdaşım ❤️", skin: "pink", orbit: 1, angle: 0.8 },
  { category: "Person", title: "Annem & Babam", description: "En büyük destekçilerim 🏡", skin: "pink", orbit: 1, angle: 3.8 },
  { category: "Moon", title: "Kahve Tutkusu ☕", description: "V60 filtre kahve demleme ritüeli", skin: "crystal", orbit: 1, angle: 1.5, radiusOffset: 60 },
  { category: "Hobby", title: "Resim Yapmak", description: "Dijital illüstrasyon ve tuval boyama", skin: "crystal", orbit: 2, angle: 0.4, constellationGroup: "CREATIVE SOUL" },
  { category: "Hobby", title: "Müzik & Gitar", description: "Akustik gitar besteleri ve synthwave soundscape", skin: "crystal", orbit: 2, angle: 1.2, constellationGroup: "CREATIVE SOUL" },
  { category: "Hobby", title: "Kitap Okuma", description: "Bilimkurgu klasikleri ve felsefe", skin: "crystal", orbit: 2, angle: 2.0, constellationGroup: "CREATIVE SOUL" },
  { category: "Memory", title: "Bodrum Tatili 2026", description: "Ege koylarında harika bir tatil 🌅", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80", skin: "sun", orbit: 3, angle: 1.8 },
  { category: "Goal", title: "Japonya'ya Gitmek", description: "Kyoto ve Tokyo'yu gezmek, kiraz çiçeklerini görmek 🌸", imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80", skin: "saturn", orbit: 4, angle: 2.7, isCompleted: false, progress: 50 },
  { category: "Goal", title: "İspanyolca Öğrenmek", description: "B2 seviyesinde akıcı konuşma 🇪🇸", skin: "earth", orbit: 4, angle: 5.2, isCompleted: true, progress: 100 },
  { category: "Goal", title: "20 Kitap Okuma Hedefi", description: "20 yeni eser bitirmek 📚", skin: "purple", orbit: 4, angle: 0.1, isCompleted: false, progress: 25 }
];

async function ensureDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Nzlbl",
        universeName: "Nzlbl's Universe",
        avatar: "🌍",
        bio: "Yaratıcı Evren Mimarı",
        favoriteColor: "#ff85a1"
      }
    });

    for (const item of INITIAL_CELESTIALS) {
      await prisma.celestialObject.create({
        data: {
          ...item,
          userId: user.id
        }
      });
    }

    // Default Achievements
    await prisma.achievement.create({
      data: {
        userId: user.id,
        code: "UNIVERSE_BORN",
        title: "🌌 Evren Doğdu",
        description: "İlk kişisel dijital evrenini başlattın!",
        icon: "✨"
      }
    });
  }
  return user;
}

export const getCelestials = async (req: Request, res: Response) => {
  try {
    const user = await ensureDefaultUser();
    const celestials = await prisma.celestialObject.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });
    const achievements = await prisma.achievement.findMany({
      where: { userId: user.id }
    });
    return res.json({ success: true, user, celestials, achievements });
  } catch (error) {
    console.error('getCelestials Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const createCelestial = async (req: Request, res: Response) => {
  try {
    const user = await ensureDefaultUser();
    const { category, title, description, imageUrl, audioUrl, skin, orbit, angle, progress, constellationGroup, relationship, firstMet, tags } = req.body;

    const newObj = await prisma.celestialObject.create({
      data: {
        userId: user.id,
        category: category || "Goal",
        title,
        description,
        imageUrl: imageUrl || null,
        audioUrl: audioUrl || null,
        skin: skin || "pink",
        orbit: orbit || 4,
        angle: angle || Math.random() * Math.PI * 2,
        progress: progress || 0,
        constellationGroup: category === "Hobby" ? (constellationGroup || "CREATIVE SOUL") : null,
        relationship: category === "Person" ? (relationship || "Yakın Dost") : null,
        firstMet: firstMet || null,
        tags: tags || null,
        isCompleted: (progress || 0) >= 100
      }
    });

    return res.status(201).json({ success: true, data: newObj });
  } catch (error) {
    console.error('createCelestial Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create object' });
  }
};

export const updateProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    const current = await prisma.celestialObject.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ success: false, error: 'Object not found' });

    const newProgress = Math.min(100, Math.max(0, Number(progress)));
    const isCompleted = newProgress >= 100;

    const updated = await prisma.celestialObject.update({
      where: { id },
      data: {
        progress: newProgress,
        isCompleted
      }
    });

    let magicMessage = `Progression updated to %${newProgress}`;
    if (isCompleted && !current.isCompleted) {
      magicMessage = `PLANET DISCOVERED! 🎉 "${updated.title}" tam kıvama ulaştı ve evrende parıldamaya başladı!`;
    }

    return res.json({ success: true, data: updated, magicMessage });
  } catch (error) {
    console.error('updateProgress Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update progress' });
  }
};

export const completeGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.celestialObject.update({
      where: { id },
      data: { isCompleted: true, progress: 100 }
    });
    return res.json({ success: true, data: updated, magicMessage: `PLANET DISCOVERED! "${updated.title}" Keşfedildi ve evrende parlamaya başladı! 🎉` });
  } catch (error) {
    console.error('completeGoal Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to mark goal as completed' });
  }
};

export const deleteCelestial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.celestialObject.delete({ where: { id } });
    return res.json({ success: true, message: 'Object deleted' });
  } catch (error) {
    console.error('deleteCelestial Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete object' });
  }
};

export const analyzeMemory = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Text is required' });
    const analysis = await analyzeMemoryText(text);
    return res.json({ success: true, analysis });
  } catch (error) {
    console.error('analyzeMemory Error:', error);
    return res.status(500).json({ success: false, error: 'AI analysis failed' });
  }
};

// Export & Import Full Universe JSON
export const exportUniverse = async (req: Request, res: Response) => {
  try {
    const user = await ensureDefaultUser();
    const celestials = await prisma.celestialObject.findMany({ where: { userId: user.id } });
    const dailyMoods = await prisma.dailyMood.findMany({ where: { userId: user.id } });
    const achievements = await prisma.achievement.findMany({ where: { userId: user.id } });

    const exportData = {
      version: "2.0",
      exportedAt: new Date().toISOString(),
      user,
      celestials,
      dailyMoods,
      achievements
    };

    return res.json({ success: true, data: exportData });
  } catch (error) {
    console.error('exportUniverse Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to export universe' });
  }
};

export const importUniverse = async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    if (!data || !data.celestials) {
      return res.status(400).json({ success: false, error: 'Invalid universe export data' });
    }

    const user = await ensureDefaultUser();

    // Reset current user objects
    await prisma.celestialObject.deleteMany({ where: { userId: user.id } });
    await prisma.dailyMood.deleteMany({ where: { userId: user.id } });

    for (const item of data.celestials) {
      const { id, userId, createdAt, updatedAt, ...rest } = item;
      await prisma.celestialObject.create({
        data: {
          ...rest,
          userId: user.id
        }
      });
    }

    if (data.dailyMoods && Array.isArray(data.dailyMoods)) {
      for (const moodItem of data.dailyMoods) {
        const { id, userId, createdAt, ...restMood } = moodItem;
        await prisma.dailyMood.create({
          data: {
            ...restMood,
            userId: user.id
          }
        });
      }
    }

    return res.json({ success: true, message: 'Universe successfully imported!' });
  } catch (error) {
    console.error('importUniverse Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to import universe' });
  }
};
