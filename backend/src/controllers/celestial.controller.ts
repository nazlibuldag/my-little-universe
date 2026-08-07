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
  { category: "Goal", title: "Japonya'ya Gitmek", description: "Kyoto ve Tokyo'yu gezmek, kiraz çiçeklerini görmek 🌸", imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80", skin: "saturn", orbit: 4, angle: 2.7, isCompleted: false },
  { category: "Goal", title: "İspanyolca Öğrenmek", description: "B2 seviyesinde akıcı konuşma 🇪🇸", skin: "earth", orbit: 4, angle: 5.2, isCompleted: true },
  { category: "Goal", title: "20 Kitap Okuma Hedefi", description: "20 yeni eser bitirmek 📚", skin: "purple", orbit: 4, angle: 0.1, isCompleted: false }
];

async function ensureDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Nzlbl",
        avatar: "🌍",
        bio: "Yaratıcı Evren Mimarı",
        favoriteColor: "#00f3ff",
        favoriteMusic: "M83 — Midnight City 🎶",
        tags: "Tasarımcı,Yazılımcı,Kaşif"
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
    return res.json({ success: true, user, celestials });
  } catch (error) {
    console.error('getCelestials Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const createCelestial = async (req: Request, res: Response) => {
  try {
    const user = await ensureDefaultUser();
    const { category, title, description, imageUrl, skin, orbit, angle, constellationGroup } = req.body;

    const newObj = await prisma.celestialObject.create({
      data: {
        userId: user.id,
        category: category || "Goal",
        title,
        description,
        imageUrl: imageUrl || null,
        skin: skin || "earth",
        orbit: orbit || 4,
        angle: angle || Math.random() * Math.PI * 2,
        constellationGroup: category === "Hobby" ? (constellationGroup || "CREATIVE SOUL") : null,
        isCompleted: false
      }
    });

    return res.status(201).json({ success: true, data: newObj });
  } catch (error) {
    console.error('createCelestial Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create object' });
  }
};

export const completeGoal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.celestialObject.update({
      where: { id },
      data: { isCompleted: true }
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
