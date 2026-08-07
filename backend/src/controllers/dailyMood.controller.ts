import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';

const INITIAL_MOODS = [
  { date: "2026-08-10", mood: "Great", note: "Harika bir proje fikri buldum! 🚀", angle: 5.8 },
  { date: "2026-08-11", mood: "Good", note: "Arkadaşlarla kahve içip sohbet ettik ☕", angle: 6.0 },
  { date: "2026-08-12", mood: "Okay", note: "Sakin ve rutin bir kodlama günü 💻", angle: 6.15 },
  { date: "2026-08-13", mood: "Great", note: "My Little Universe sunucu altyapısı hazırlandı! 🌌", angle: 6.3 }
];

async function ensureDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: { name: "Nzlbl", avatar: "🌍", bio: "Yaratıcı Evren Mimarı" }
    });
  }
  return user;
}

export const getDailyMoods = async (req: Request, res: Response) => {
  try {
    const user = await ensureDefaultUser();
    let moods = await prisma.dailyMood.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });

    if (moods.length === 0) {
      for (const item of INITIAL_MOODS) {
        await prisma.dailyMood.create({
          data: { ...item, userId: user.id }
        });
      }
      moods = await prisma.dailyMood.findMany({ where: { userId: user.id } });
    }

    return res.json({ success: true, moods });
  } catch (error) {
    console.error('getDailyMoods Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const createDailyMood = async (req: Request, res: Response) => {
  try {
    const user = await ensureDefaultUser();
    const { mood, note, date } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    const existingCount = await prisma.dailyMood.count({ where: { userId: user.id } });
    const angle = 5.5 + (existingCount * 0.12);

    const newMood = await prisma.dailyMood.create({
      data: {
        userId: user.id,
        date: dateStr,
        mood: mood || "Great",
        note: note || "Güzel bir gün!",
        angle
      }
    });

    return res.status(201).json({
      success: true,
      data: newMood,
      magicMessage: `GÜNÜN YILDIZI OLUŞTU! 🌙 ${dateStr} tarihli ruh halin gökyüzündeki yerini aldı.`
    });
  } catch (error) {
    console.error('createDailyMood Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create daily mood star' });
  }
};
