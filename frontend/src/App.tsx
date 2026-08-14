import React, { useEffect, useRef, useState } from 'react';
import { CelestialObject, DailyMood, UserProfile, Achievement, Habit, JournalEntry } from './types/galaxy';
import { Camera } from './canvas/Camera';
import { ParticleSystem } from './canvas/ParticleSystem';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Core Engine Controllers
  const cameraRef = useRef<Camera>(new Camera());
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());

  const [user, setUser] = useState<UserProfile | null>(null);
  const [celestials, setCelestials] = useState<CelestialObject[]>([]);
  const [dailyMoods, setDailyMoods] = useState<DailyMood[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  
  // UI & Filter & Theme States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [activeTheme, setActiveTheme] = useState<string>('Pink Dream');
  
  // Big Bang Timeline Slider States
  const [timelineValue, setTimelineValue] = useState<number>(100);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const timelineTimerRef = useRef<any>(null);

  // UI Modal & Side Drawer states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [magicToast, setMagicToast] = useState<{ title: string; message: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);

  // Form & Media Capsule states
  const [category, setCategory] = useState<string>('Goal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progressInput, setProgressInput] = useState<number>(0);
  const [relationship, setRelationship] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMood, setSelectedMood] = useState('Great');
  const [moodNote, setMoodNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Habit & Journal Form States
  const [habitTitle, setHabitTitle] = useState('');
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');

  // Voice Memory Recorder States
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Camera state & Generous Spaced Orbit Radii
  const orbitRadii = [0, 220, 390, 570, 760];
  const audioCtxRef = useRef<AudioContext | null>(null);
  const planetPositionsRef = useRef<Record<string, { px: number; py: number }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const resC = await fetch('/api/celestials');
      const dataC = await resC.json();
      if (dataC.success) {
        setUser(dataC.user);
        setCelestials(dataC.celestials);
        if (dataC.achievements) setAchievements(dataC.achievements);
      }

      const resM = await fetch('/api/daily-moods');
      const dataM = await resM.json();
      if (dataM.success) {
        setDailyMoods(dataM.moods);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  // Keyboard Arrow Navigation for Photo Lightbox & Gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedObject) return;
      const photoList = getPhotoList(selectedObject.imageUrl);
      if (photoList.length <= 1) return;

      if (e.key === 'ArrowRight') {
        setActivePhotoIndex(prev => (prev + 1) % photoList.length);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex(prev => (prev - 1 + photoList.length) % photoList.length);
      } else if (e.key === 'Escape') {
        setShowLightbox(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject]);

  // Voice Memory Recorder Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      showToast('⚠️ MİKROFON İZNİ REDDEDİLDİ', 'Ses kaydı yapabilmek için mikrofon erişimine izin verin.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Real Multi-File Local Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('photos', files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadedPhotos(prev => [...prev, ...data.urls]);
        showToast('📸 FOTOĞRAFLAR YÜKLENDİ!', `${data.urls.length} adet fotoğraf başarıyla yüklendi.`);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const playSoundEffect = (freq = 440, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAIAnalyze = async () => {
    if (!description && !title) return;
    setIsAnalyzing(true);
    try {
      const textToAnalyze = description || title;
      const res = await fetch('/api/celestials/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToAnalyze })
      });
      const data = await res.json();
      if (data.success) {
        setCategory(data.analysis.category);
        showToast('✨ AI ANALİZ ETTİ!', `Kategori "${data.analysis.category}" olarak belirlendi.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Canvas Render Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleCanvasClick = (e: MouseEvent) => {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const worldX = (e.clientX - cx - cameraRef.current.x) / cameraRef.current.zoom;
      const worldY = (e.clientY - cy - cameraRef.current.y) / cameraRef.current.zoom;

      for (let obj of celestials) {
        const pos = planetPositionsRef.current[obj.id];
        if (!pos) continue;

        const dist = Math.hypot(worldX - pos.px, worldY - pos.py);
        if (dist <= 35) {
          setSelectedObject(obj);
          setActivePhotoIndex(0);
          playSoundEffect(659.25, 'sine');
          return;
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      cameraRef.current.handleWheel(e);
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    const render = (time: number) => {
      cameraRef.current.update();

      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (activeTheme === 'Deep Space') {
        grad.addColorStop(0, '#0d0714');
        grad.addColorStop(0.5, '#1a0b2e');
        grad.addColorStop(1, '#05020a');
      } else if (activeTheme === 'Sunset Universe') {
        grad.addColorStop(0, '#2d112c');
        grad.addColorStop(0.5, '#530031');
        grad.addColorStop(1, '#820027');
      } else if (activeTheme === 'Nature Galaxy') {
        grad.addColorStop(0, '#061c14');
        grad.addColorStop(0.5, '#0b3526');
        grad.addColorStop(1, '#020d09');
      } else {
        grad.addColorStop(0, '#fff0f5');
        grad.addColorStop(0.35, '#f3e8ff');
        grad.addColorStop(0.7, '#e0e7ff');
        grad.addColorStop(1, '#fff5f7');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.translate(cx + cameraRef.current.x, cy + cameraRef.current.y);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);

      const ringColors = ['', 'rgba(255, 183, 197, 0.55)', 'rgba(216, 180, 254, 0.55)', 'rgba(255, 209, 220, 0.55)', 'rgba(186, 230, 253, 0.55)'];
      for (let i = 1; i < orbitRadii.length; i++) {
        ctx.strokeStyle = ringColors[i];
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, orbitRadii[i] * (timelineValue / 100), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Core Planet
      const pulse = Math.sin(time * 0.003) * 3;
      const r = 38 + pulse;

      const aura = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2.5);
      aura.addColorStop(0, 'rgba(255, 183, 197, 0.6)');
      aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.rotate(Math.PI / 6);
      ctx.strokeStyle = 'rgba(255, 183, 197, 0.8)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.95, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const planetGrad = ctx.createRadialGradient(-10, -10, 2, 0, 0, r);
      planetGrad.addColorStop(0, '#ffffff');
      planetGrad.addColorStop(0.5, '#ffb7c5');
      planetGrad.addColorStop(1, '#d8b4fe');
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = activeTheme === 'Deep Space' ? '#ffffff' : '#2d1836';
      ctx.font = '700 14px "Plus Jakarta Sans"';
      ctx.textAlign = 'center';
      ctx.fillText(`🌸 ${user?.name || 'Nzlbl'} (Ana Gezegen)`, 0, r + 28);

      const maxAllowedIndex = Math.floor((celestials.length * timelineValue) / 100);
      const timelineFilteredList = celestials.slice(0, Math.max(1, maxAllowedIndex));

      const filteredList = timelineFilteredList.filter(obj => {
        const matchesCategory = activeCategoryFilter === 'ALL' || obj.category === activeCategoryFilter;
        const matchesSearch = !searchQuery || obj.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      filteredList.forEach((obj) => {
        const baseRadius = orbitRadii[obj.orbit] || 300;
        const radius = baseRadius * (timelineValue / 100);
        const currentAngle = obj.angle + (time * 0.0001 * (5 - obj.orbit));
        const px = Math.cos(currentAngle) * radius;
        const py = Math.sin(currentAngle) * radius;

        planetPositionsRef.current[obj.id] = { px, py };

        const isSelected = selectedObject?.id === obj.id;
        const isSearchMatch = searchQuery && obj.title.toLowerCase().includes(searchQuery.toLowerCase());

        ctx.save();
        ctx.translate(px, py);

        if (isSelected || isSearchMatch) {
          ctx.strokeStyle = isSelected ? '#ff85a1' : '#d8b4fe';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 34, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (obj.category === 'Goal' && !obj.isCompleted) {
          const prog = obj.progress || 0;
          if (prog >= 50) {
            const gAura = ctx.createRadialGradient(0, 0, 10, 0, 0, 32);
            gAura.addColorStop(0, 'rgba(255, 183, 197, 0.4)');
            gAura.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gAura;
            ctx.beginPath();
            ctx.arc(0, 0, 32, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = prog === 0 ? 'rgba(80, 80, 80, 0.85)' : 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = prog >= 75 ? '#ff85a1' : 'rgba(255, 183, 197, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ff85a1';
          ctx.font = '11px "Plus Jakarta Sans"';
          ctx.textAlign = 'center';
          ctx.fillText(`🔒 %${prog}`, 0, 4);
        } else {
          const pAura = ctx.createRadialGradient(0, 0, 10, 0, 0, 36);
          pAura.addColorStop(0, 'rgba(255, 183, 197, 0.5)');
          pAura.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = pAura;
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
          ctx.fill();

          const pGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, 20);
          if (obj.category === 'Person') {
            pGrad.addColorStop(0, '#ffb7c5');
            pGrad.addColorStop(1, '#ff85a1');
          } else if (obj.category === 'Hobby') {
            pGrad.addColorStop(0, '#e7c6ff');
            pGrad.addColorStop(1, '#d8b4fe');
          } else if (obj.category === 'Memory') {
            pGrad.addColorStop(0, '#ffffff');
            pGrad.addColorStop(1, '#ffb7c5');
          } else {
            pGrad.addColorStop(0, '#bae6fd');
            pGrad.addColorStop(1, '#c8b6ff');
          }

          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
        }

        let icon = '🚀';
        if (obj.category === 'Memory') icon = '⭐';
        if (obj.category === 'Hobby') icon = '✨';
        if (obj.category === 'Person') icon = '💗';
        if (obj.category === 'Moon') icon = '🌙';

        ctx.fillStyle = isSelected ? '#ff85a1' : (activeTheme === 'Deep Space' ? '#ffffff' : '#2d1836');
        ctx.font = isSelected ? '700 13px "Plus Jakarta Sans"' : '600 12px "Plus Jakarta Sans"';
        ctx.textAlign = 'center';
        ctx.fillText(`${icon} ${obj.title}`, 0, 32);

        ctx.restore();
      });

      particleSystemRef.current.updateAndRender(ctx);

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [celestials, user, searchQuery, activeCategoryFilter, selectedObject, timelineValue, activeTheme]);

  const handleAddObject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let orbit = 4;
      if (category === 'Person' || category === 'Moon') orbit = 1;
      if (category === 'Hobby') orbit = 2;
      if (category === 'Memory') orbit = 3;

      const imageUrl = uploadedPhotos.length > 0 ? JSON.stringify(uploadedPhotos) : '';
      const res = await fetch('/api/celestials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, description, imageUrl, audioUrl: audioBlobUrl, orbit, relationship, progress: progressInput })
      });
      const data = await res.json();
      if (data.success) {
        setCelestials([...celestials, data.data]);
        setShowAddModal(false);
        setTitle('');
        setDescription('');
        setUploadedPhotos([]);
        setAudioBlobUrl(null);
        setProgressInput(0);
        playSoundEffect(587.33, 'triangle');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle) return;
    const newHabit: Habit = {
      id: String(Date.now()),
      userId: user?.id || '1',
      title: habitTitle,
      frequency: 'daily',
      streak: 1,
      longestStreak: 1,
      createdAt: new Date().toISOString()
    };
    setHabits([...habits, newHabit]);
    setHabitTitle('');
    playSoundEffect(880, 'sine');
    showToast('🔥 YENİ ALIŞKANLIK EKLENDİ!', `"${newHabit.title}" için ilk streak günü başlatıldı!`);
  };

  const handleCheckinHabit = (id: string) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const newStreak = h.streak + 1;
        playSoundEffect(1046.5, 'triangle');
        showToast('🔥 STREAK ARTTI!', `"${h.title}" için ${newStreak} günlük seri tamamlandı!`);
        return { ...h, streak: newStreak, longestStreak: Math.max(h.longestStreak, newStreak) };
      }
      return h;
    }));
  };

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle || !journalContent) return;
    const newEntry: JournalEntry = {
      id: String(Date.now()),
      userId: user?.id || '1',
      title: journalTitle,
      content: journalContent,
      mood: selectedMood,
      createdAt: new Date().toISOString()
    };
    setJournalEntries([...journalEntries, newEntry]);
    setJournalTitle('');
    setJournalContent('');
    setShowJournalModal(false);
    playSoundEffect(783.99, 'sine');
    showToast('📔 DİJİTAL GÜNLÜK KAYDEDİLDİ!', `"${newEntry.title}" evren kapsülüne eklendi.`);
  };

  const handleUpdateProgress = async (id: string, newProg: number) => {
    try {
      const res = await fetch(`/api/celestials/${id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProg })
      });
      const data = await res.json();
      if (data.success) {
        setCelestials(celestials.map(c => c.id === id ? data.data : c));
        setSelectedObject(data.data);

        if (newProg >= 100) {
          const pos = planetPositionsRef.current[id];
          if (pos) {
            particleSystemRef.current.spawnConfetti(pos.px, pos.py, 80);
          }
          playSoundEffect(1046.50, 'sawtooth');
          showToast('PLANET DISCOVERED! 🎉', data.magicMessage);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportUniverse = async () => {
    try {
      const res = await fetch('/api/celestials/export');
      const data = await res.json();
      if (data.success) {
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-little-universe-export-${Date.now()}.json`;
        a.click();
        showToast('🌌 EVREN DIŞA AKTARILDI!', 'Tüm anıların ve verilerin JSON dosyası olarak bilgisayarına indirildi.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveMood = async () => {
    try {
      const res = await fetch('/api/daily-moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: selectedMood, note: moodNote })
      });
      const data = await res.json();
      if (data.success) {
        setDailyMoods([...dailyMoods, data.data]);
        setShowMoodModal(false);
        setMoodNote('');
        playSoundEffect(880, 'sine');
        showToast('GÜNÜN YILDIZI OLUŞTU! 🌙', data.magicMessage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteObject = async (id: string) => {
    try {
      const res = await fetch(`/api/celestials/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCelestials(celestials.filter(c => c.id !== id));
        setSelectedObject(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (t: string, m: string) => {
    setMagicToast({ title: t, message: m });
    setTimeout(() => setMagicToast(null), 3500);
  };

  const getPhotoList = (imgStr?: string): string[] => {
    if (!imgStr) return [];
    try {
      if (imgStr.startsWith('[')) {
        return JSON.parse(imgStr);
      }
      return [imgStr];
    } catch (e) {
      return [imgStr];
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Floating Brand Title (Top Left) */}
      <div className="brand-floating">
        <div style={{ fontSize: '1.8rem' }}>🌸</div>
        <div>
          <h1>My Little Universe</h1>
          <p>"Your life, your aesthetic universe."</p>
        </div>
      </div>

      {/* Floating Search & Settings Widget (Top Right) */}
      <div className="search-floating">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Gezegen / Anı Ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <select
          value={activeTheme}
          onChange={(e) => setActiveTheme(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.85)', border: '1.5px solid rgba(255,255,255,0.95)', fontWeight: 700, color: '#2d1836', cursor: 'pointer' }}
        >
          <option value="Pink Dream">🌸 Pink Dream</option>
          <option value="Deep Space">🌌 Deep Space</option>
          <option value="Sunset Universe">🌅 Sunset Universe</option>
          <option value="Nature Galaxy">🌿 Nature Galaxy</option>
        </select>

        <button className="btn-action-cancel" onClick={() => setShowAchievementsModal(true)} style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
          🏆 Rozetler
        </button>

        <button className="btn-action-cancel" onClick={() => setShowHabitsModal(true)} style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
          🔥 Alışkanlıklar
        </button>

        <button className="btn-action-cancel" onClick={() => setShowJournalModal(true)} style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
          📔 Günlük
        </button>

        <button className="btn-action-cancel" onClick={handleExportUniverse} style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
          💾 Export
        </button>

        <button className={`btn ${soundEnabled ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSoundEnabled(!soundEnabled)} style={{ padding: '10px 16px' }}>
          {soundEnabled ? '🎵' : '🔇'}
        </button>
      </div>

      {/* Sleek Apple Glass Dock (Bottom Center) */}
      <div className="apple-dock">
        {[
          { id: 'ALL', label: '🌌 Tümü' },
          { id: 'Goal', label: '🚀 Hayaller' },
          { id: 'Memory', label: '⭐ Anılar' },
          { id: 'Person', label: '💗 İnsanlar' },
          { id: 'Hobby', label: '✨ Hobiler' },
          { id: 'Moon', label: '🌙 Uydular' }
        ].map(cat => (
          <button
            key={cat.id}
            className={`dock-item ${activeCategoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}

        <div className="dock-divider"></div>

        <button className="dock-item" onClick={() => setShowMoodModal(true)}>
          🌙 Günün Yıldızı
        </button>

        <button className="dock-item active" onClick={() => setShowAddModal(true)} style={{ background: 'linear-gradient(135deg, #ff85a1, #d8b4fe)', color: '#fff' }}>
          ➕ Evrene Ekle
        </button>
      </div>

      {/* Pinterest Polaroid Side Drawer Inspector */}
      {selectedObject && (() => {
        const photoList = getPhotoList(selectedObject.imageUrl);
        return (
          <div style={{ position: 'absolute', top: 0, right: 0, width: '430px', height: '100vh', background: 'rgba(255, 245, 248, 0.94)', backdropFilter: 'blur(30px)', borderLeft: '1.5px solid rgba(255, 255, 255, 0.9)', boxShadow: '-10px 0 50px rgba(216,180,254,0.3)', zIndex: 60, padding: '32px', display: 'flex', flexDirection: 'column', transition: 'all 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,183,197,0.3)', color: '#2d1836', border: '1px solid rgba(255,255,255,0.9)', letterSpacing: '1px' }}>
                {selectedObject.category.toUpperCase()}
              </span>
              <button onClick={() => setSelectedObject(null)} style={{ background: 'rgba(255,255,255,0.8)', border: 'none', color: '#2d1836', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>

            {photoList.length > 0 ? (
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <div style={{ background: '#fff', padding: '14px 14px 26px 14px', borderRadius: '22px', boxShadow: '0 12px 35px rgba(216,180,254,0.3)', transform: 'rotate(-2deg)', border: '1.5px solid rgba(255,255,255,0.9)', position: 'relative' }}>
                  <img src={photoList[activePhotoIndex]} alt={selectedObject.title} onClick={() => setShowLightbox(true)} style={{ width: '100%', height: '230px', objectFit: 'cover', borderRadius: '14px', cursor: 'zoom-in' }} />
                  
                  {photoList.length > 1 && (
                    <>
                      <button className="photo-nav-btn" style={{ left: '10px' }} onClick={(e) => { e.stopPropagation(); setActivePhotoIndex((activePhotoIndex - 1 + photoList.length) % photoList.length); }}>‹</button>
                      <button className="photo-nav-btn" style={{ right: '10px' }} onClick={(e) => { e.stopPropagation(); setActivePhotoIndex((activePhotoIndex + 1) % photoList.length); }}>›</button>
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '0 4px' }}>
                    <p style={{ color: '#2d1836', fontSize: '0.95rem', fontWeight: 700, fontFamily: '"Playfair Display"' }}>{selectedObject.title}</p>
                    <span style={{ fontSize: '0.78rem', color: '#6b4d75', fontWeight: 700 }}>📷 {activePhotoIndex + 1} / {photoList.length}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '4.5rem', textAlign: 'center', margin: '20px 0', filter: 'drop-shadow(0 4px 20px rgba(216,180,254,0.5))' }}>
                {selectedObject.category === 'Memory' ? '⭐' : selectedObject.category === 'Person' ? '💗' : selectedObject.category === 'Hobby' ? '✨' : '🪐'}
              </div>
            )}

            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: '"Playfair Display"', marginBottom: '6px', color: '#2d1836' }}>{selectedObject.title}</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b4d75', marginBottom: '16px', fontWeight: 500 }}><i className="fa-regular fa-calendar"></i> {new Date(selectedObject.createdAt).toLocaleDateString('tr-TR')}</p>
            
            {selectedObject.category === 'Goal' && (
              <div style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '18px', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.9)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d1836' }}>Hedef İlerlemesi</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ff85a1' }}>%{selectedObject.progress || 0}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedObject.progress || 0}
                  onChange={(e) => handleUpdateProgress(selectedObject.id, Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#ff85a1', cursor: 'pointer' }}
                />
              </div>
            )}

            {selectedObject.audioUrl && (
              <div style={{ background: 'rgba(255, 255, 255, 0.85)', padding: '16px', borderRadius: '20px', border: '1.5px solid rgba(255,255,255,0.9)', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d1836', marginBottom: '8px' }}>🎤 Ses Kaydı Anısı</p>
                <audio controls src={selectedObject.audioUrl} style={{ width: '100%' }} />
              </div>
            )}

            <div style={{ background: 'rgba(255, 255, 255, 0.75)', padding: '18px', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.9)', marginBottom: '20px', lineHeight: 1.6, fontSize: '0.95rem', color: '#2d1836', fontWeight: 500 }}>
              {selectedObject.description || 'Bu varlık için herhangi bir detay girilmemiş.'}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
              <button onClick={() => handleDeleteObject(selectedObject.id)} className="btn" style={{ background: 'rgba(255,133,161,0.2)', color: '#2d1836', border: '1.5px solid rgba(255,133,161,0.4)', width: '100%', justifyContent: 'center' }}>
                <i className="fa-solid fa-trash"></i> Evrenden Sil
              </button>
            </div>
          </div>
        );
      })()}

      {/* Achievements Modal */}
      {showAchievementsModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,24,54,0.35)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.96)', border: '2px solid rgba(255,255,255,0.95)', padding: '32px', borderRadius: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 50px rgba(216,180,254,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: '"Playfair Display"', color: '#2d1836' }}>🏆 Başarılar & Rozetler</h2>
              <button onClick={() => setShowAchievementsModal(false)} style={{ background: 'rgba(255,255,255,0.8)', border: 'none', color: '#2d1836', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
              {[
                { icon: '✨', title: '🌌 Evren Doğdu', desc: 'Kendi kişisel evrenini başarıyla oluşturdun!', status: 'KAZANILDI' },
                { icon: '⭐', title: '⭐ İlk Anı Yıldızı', desc: 'Evrenine ilk fotoğraf anını kaydettin!', status: 'KAZANILDI' },
                { icon: '🚀', title: '🚀 Hayalperest', desc: '10 keşfedilmeyi bekleyen hedef ekledin.', status: 'YOLDA (%60)' },
                { icon: '🔥', title: '🔥 30-Gün Süpernova', desc: '30 gün üst üste mood yıldızı oluşturdun.', status: 'KİLİTLİ' }
              ].map((ach, idx) => (
                <div key={idx} style={{ background: '#fff0f5', padding: '14px 18px', borderRadius: '20px', border: '1.5px solid rgba(255,183,197,0.6)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '2rem' }}>{ach.icon}</span>
                  <div>
                    <h4 style={{ color: '#2d1836', fontSize: '1rem', fontWeight: 700 }}>{ach.title}</h4>
                    <p style={{ color: '#6b4d75', fontSize: '0.82rem' }}>{ach.desc}</p>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ff85a1', marginTop: '4px', display: 'inline-block' }}>{ach.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Habits Modal */}
      {showHabitsModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,24,54,0.35)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.96)', border: '2px solid rgba(255,255,255,0.95)', padding: '32px', borderRadius: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 50px rgba(216,180,254,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: '"Playfair Display"', color: '#2d1836' }}>🔥 Alışkanlık & Streak Takibi</h2>
              <button onClick={() => setShowHabitsModal(false)} style={{ background: 'rgba(255,255,255,0.8)', border: 'none', color: '#2d1836', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
            
            <form onSubmit={handleAddHabit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input type="text" value={habitTitle} onChange={e => setHabitTitle(e.target.value)} placeholder="Yeni alışkanlık (Örn: Su İçmek)" required style={{ flex: 1, padding: '10px 14px', borderRadius: '16px', border: '1.5px solid #ffb7c5', background: '#fff0f5' }} />
              <button type="submit" className="btn-action-primary" style={{ padding: '10px 16px' }}>Ekle</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '50vh', overflowY: 'auto' }}>
              {habits.map(h => (
                <div key={h.id} style={{ background: '#fff', padding: '14px', borderRadius: '18px', border: '1.5px solid #ffb7c5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: '#2d1836', fontWeight: 700 }}>{h.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#ff85a1', fontWeight: 800 }}>🔥 {h.streak} Gün Streak</span>
                  </div>
                  <button className="btn-action-primary" onClick={() => handleCheckinHabit(h.id)} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                    ✅ Tamamla
                  </button>
                </div>
              ))}
              {habits.length === 0 && <p style={{ color: '#6b4d75', fontSize: '0.85rem', textStyle: 'italic' }}>Henüz takip edilen alışkanlık yok. Yukarıdan ekleyin!</p>}
            </div>
          </div>
        </div>
      )}

      {/* Journal Modal */}
      {showJournalModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,24,54,0.35)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.96)', border: '2px solid rgba(255,255,255,0.95)', padding: '32px', borderRadius: '32px', width: '100%', maxWidth: '490px', boxShadow: '0 20px 50px rgba(216,180,254,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: '"Playfair Display"', color: '#2d1836' }}>📔 Dijital Günlük Kapsülü</h2>
              <button onClick={() => setShowJournalModal(false)} style={{ background: 'rgba(255,255,255,0.8)', border: 'none', color: '#2d1836', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
            
            <form onSubmit={handleAddJournal}>
              <input type="text" value={journalTitle} onChange={e => setJournalTitle(e.target.value)} placeholder="Günlük Başlığı..." required style={{ width: '100%', padding: '10px 14px', borderRadius: '16px', border: '1.5px solid #ffb7c5', background: '#fff0f5', marginBottom: '10px' }} />
              <textarea value={journalContent} onChange={e => setJournalContent(e.target.value)} placeholder="Bugüne dair düşüncelerin..." required style={{ width: '100%', height: '100px', padding: '10px 14px', borderRadius: '16px', border: '1.5px solid #ffb7c5', background: '#fff0f5', marginBottom: '16px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-action-cancel" onClick={() => setShowJournalModal(false)}>İptal</button>
                <button type="submit" className="btn-action-primary">Kapsüle Kaydet 📔</button>
              </div>
            </form>

            {journalEntries.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #ffb7c5', paddingTop: '14px' }}>
                <h4 style={{ color: '#2d1836', fontSize: '0.9rem', marginBottom: '8px' }}>Geçmiş Günlük Yazıları</h4>
                {journalEntries.map(j => (
                  <div key={j.id} style={{ background: '#fff', padding: '10px 14px', borderRadius: '14px', border: '1px solid #ffb7c5', marginBottom: '8px' }}>
                    <p style={{ fontWeight: 700, color: '#2d1836', fontSize: '0.88rem' }}>{j.title}</p>
                    <p style={{ fontSize: '0.8rem', color: '#6b4d75' }}>{j.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {showLightbox && selectedObject && (() => {
        const photoList = getPhotoList(selectedObject.imageUrl);
        if (photoList.length === 0) return null;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,24,54,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }} onClick={() => setShowLightbox(false)}>
            <div style={{ background: '#fff', padding: '20px 20px 38px 20px', borderRadius: '32px', maxWidth: '88vw', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <img src={photoList[activePhotoIndex]} alt="lightbox" style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: '20px', objectFit: 'contain' }} />

              {photoList.length > 1 && (
                <>
                  <button className="photo-nav-btn" style={{ left: '-24px', width: '48px', height: '48px', fontSize: '1.5rem' }} onClick={() => setActivePhotoIndex((activePhotoIndex - 1 + photoList.length) % photoList.length)}>‹</button>
                  <button className="photo-nav-btn" style={{ right: '-24px', width: '48px', height: '48px', fontSize: '1.5rem' }} onClick={() => setActivePhotoIndex((activePhotoIndex + 1) % photoList.length)}>›</button>
                </>
              )}

              <button onClick={() => setShowLightbox(false)} style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#ff85a1', border: '2px solid #fff', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800, fontSize: '1.1rem' }}>✕</button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 10px' }}>
                <p style={{ fontFamily: '"Playfair Display"', fontSize: '1.25rem', color: '#2d1836', fontWeight: 700 }}>{selectedObject.title}</p>
                <span style={{ fontSize: '0.88rem', color: '#6b4d75', fontWeight: 700, background: 'rgba(255,183,197,0.3)', padding: '4px 14px', borderRadius: '20px' }}>📷 {activePhotoIndex + 1} / {photoList.length}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Magic Event Toast */}
      {magicToast && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255, 255, 255, 0.95)', border: '2px solid #ffb7c5', padding: '32px 54px', borderRadius: '36px', textAlign: 'center', zIndex: 100, boxShadow: '0 0 60px rgba(216,180,254,0.6)' }}>
          <h2 style={{ fontFamily: '"Playfair Display"', color: '#2d1836', fontSize: '2.1rem', marginBottom: '10px', fontWeight: 700 }}>{magicToast.title}</h2>
          <p style={{ color: '#6b4d75', fontWeight: 600 }}>{magicToast.message}</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,24,54,0.35)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.96)', border: '2px solid rgba(255,255,255,0.95)', padding: '32px', borderRadius: '32px', width: '100%', maxWidth: '490px', boxShadow: '0 20px 50px rgba(216,180,254,0.35)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: '"Playfair Display"', marginBottom: '16px', color: '#2d1836' }}>Evrene Yeni Varlık Ekle 🌸</h2>
            <form onSubmit={handleAddObject}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#6b4d75', fontWeight: 600 }}>Tür</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#fff0f5', color: '#2d1836', border: '1.5px solid rgba(255,183,197,0.6)', fontWeight: 600 }}>
                  <option value="Goal">🚀 Keşfedilmemiş Hayal / Hedef</option>
                  <option value="Memory">⭐ Anı Yıldızı</option>
                  <option value="Person">💗 Önemli İnsan</option>
                  <option value="Hobby">✨ Hobi (Takımyıldız)</option>
                  <option value="Moon">🌙 Uydu (Favori)</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#6b4d75', fontWeight: 600 }}>Başlık</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Japonya Tatili" required style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#fff0f5', color: '#2d1836', border: '1.5px solid rgba(255,183,197,0.6)', fontWeight: 600 }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ color: '#6b4d75', fontWeight: 600 }}>Açıklama / Hikaye</label>
                  <button type="button" onClick={handleAIAnalyze} disabled={isAnalyzing} style={{ background: 'rgba(255,183,197,0.3)', color: '#2d1836', border: '1.5px solid #ffb7c5', padding: '4px 12px', borderRadius: '16px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                    {isAnalyzing ? 'Analiz ediliyor...' : '✨ AI Otomatik Analiz Et'}
                  </button>
                </div>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama veya detay..." style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#fff0f5', color: '#2d1836', border: '1.5px solid rgba(255,183,197,0.6)', fontWeight: 600 }} />
              </div>

              {/* Voice Recording Section */}
              <div style={{ marginBottom: '16px', background: '#fff0f5', padding: '14px', borderRadius: '18px', border: '1.5px solid rgba(255,183,197,0.6)' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#6b4d75', fontWeight: 600 }}>Ses Kaydı Ekle 🎤</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {!isRecording ? (
                    <button type="button" className="btn-action-cancel" onClick={startRecording} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      🎙️ Kaydı Başlat
                    </button>
                  ) : (
                    <button type="button" className="btn-action-primary" onClick={stopRecording} style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#ff4d6d' }}>
                      ⏹️ Kaydı Bitir
                    </button>
                  )}
                  {audioBlobUrl && <span style={{ fontSize: '0.8rem', color: '#2d1836', fontWeight: 700 }}>✅ Ses kaydedildi!</span>}
                </div>
              </div>

              {/* Real Multi-File Local Uploader */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#6b4d75', fontWeight: 600 }}>Bilgisayardan Fotoğraf Yükle 📸</label>
                <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '1.8rem', color: '#ff85a1', marginBottom: '8px' }}></i>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d1836' }}>
                    {isUploading ? 'Yükleniyor...' : 'Tıkla veya Fotoğraflarını Buraya Bırak'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b4d75', marginTop: '4px' }}>Çoklu fotoğraf desteği mevcut (PNG, JPG, WEBP)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-action-cancel" onClick={() => setShowAddModal(false)}>İptal</button>
                <button type="submit" className="btn-action-primary">🚀 Evrene Yolla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mood Modal */}
      {showMoodModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,24,54,0.35)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.96)', border: '2px solid rgba(255,255,255,0.95)', padding: '30px', borderRadius: '32px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 20px 50px rgba(216,180,254,0.35)' }}>
            <h2 style={{ fontFamily: '"Playfair Display"', marginBottom: '12px', color: '#2d1836' }}>Günün Yıldızı 🌙</h2>
            <p style={{ marginBottom: '16px', color: '#6b4d75', fontWeight: 500 }}>Günün nasıl geçti?</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '2.2rem', marginBottom: '20px', cursor: 'pointer' }}>
              {['😊', '🙂', '😐', '😔', '😭'].map((emo, idx) => (
                <span key={idx} onClick={() => setSelectedMood(['Great','Good','Okay','NotGreat','Terrible'][idx])} style={{ padding: '6px', borderRadius: '18px', background: selectedMood === ['Great','Good','Okay','NotGreat','Terrible'][idx] ? 'rgba(255,183,197,0.4)' : 'transparent' }}>{emo}</span>
              ))}
            </div>
            <input type="text" value={moodNote} onChange={e => setMoodNote(e.target.value)} placeholder="Güne dair not..." style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#fff0f5', color: '#2d1836', border: '1.5px solid rgba(255,183,197,0.6)', marginBottom: '20px', fontWeight: 600 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn-action-cancel" onClick={() => setShowMoodModal(false)}>İptal</button>
              <button type="button" className="btn-action-primary" onClick={handleSaveMood}>Yıldızı Oluştur ⭐</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
