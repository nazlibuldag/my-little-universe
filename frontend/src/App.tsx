import React, { useEffect, useRef, useState } from 'react';
import { CelestialObject, DailyMood, UserProfile } from './types/galaxy';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [celestials, setCelestials] = useState<CelestialObject[]>([]);
  const [dailyMoods, setDailyMoods] = useState<DailyMood[]>([]);
  
  // UI & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  
  // Big Bang Timeline Slider States
  const [timelineValue, setTimelineValue] = useState<number>(100);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const timelineTimerRef = useRef<any>(null);

  // UI Modal & Side Drawer states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedObject, setSelectedObject] = useState<CelestialObject | null>(null);
  const [magicToast, setMagicToast] = useState<{ title: string; message: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Form states
  const [category, setCategory] = useState<string>('Goal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [skin, setSkin] = useState('pink');
  const [selectedMood, setSelectedMood] = useState('Great');
  const [moodNote, setMoodNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Camera state & Generous Spaced Orbit Radii
  const camera = useRef({ x: 0, y: 0, zoom: 1, targetZoom: 1, isDragging: false, dragStart: { x: 0, y: 0 } });
  const orbitRadii = [0, 220, 390, 570, 760]; // Generous spacing so planets never overlap!
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  // Timeline Play / Pause Loop
  const togglePlayTimeline = () => {
    if (isPlayingTimeline) {
      setIsPlayingTimeline(false);
      if (timelineTimerRef.current) clearInterval(timelineTimerRef.current);
    } else {
      setIsPlayingTimeline(true);
      setTimelineValue(0);
      timelineTimerRef.current = setInterval(() => {
        setTimelineValue((prev) => {
          if (prev >= 100) {
            clearInterval(timelineTimerRef.current);
            setIsPlayingTimeline(false);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
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
        setSkin(data.analysis.skin);
        showToast('✨ AI ANALİZ ETTİ!', `Kategori "${data.analysis.category}" ve Takımyıldız "${data.analysis.constellationGroup}" olarak belirlendi.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Canvas Render Engine Loop with Kawaii Light Pastel Cotton-Candy Aesthetics
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
      const worldX = (e.clientX - cx - camera.current.x) / camera.current.zoom;
      const worldY = (e.clientY - cy - camera.current.y) / camera.current.zoom;

      for (let obj of celestials) {
        const radius = orbitRadii[obj.orbit] || 300;
        const currentAngle = obj.angle;
        const px = Math.cos(currentAngle) * radius;
        const py = Math.sin(currentAngle) * radius;

        const dist = Math.hypot(worldX - px, worldY - py);
        if (dist <= 35) {
          setSelectedObject(obj);
          playSoundEffect(659.25, 'sine');
          return;
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    const render = (time: number) => {
      camera.current.zoom += (camera.current.targetZoom - camera.current.zoom) * 0.1;

      // Soft Light Cotton Candy Gradient Background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#fff0f5');
      grad.addColorStop(0.4, '#ffe4e1');
      grad.addColorStop(0.7, '#f3e5f5');
      grad.addColorStop(1, '#e8eaf6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.translate(cx + camera.current.x, cy + camera.current.y);
      ctx.scale(camera.current.zoom, camera.current.zoom);

      // Kawaii Pastel Orbit Rings (Soft Pink & Lavender Dashes)
      const colors = [
        '',
        'rgba(255, 117, 160, 0.45)', // Orbit 1: People (Pink)
        'rgba(180, 160, 255, 0.45)', // Orbit 2: Hobbies (Lilac)
        'rgba(255, 160, 190, 0.45)', // Orbit 3: Memories (Rose Gold)
        'rgba(160, 170, 255, 0.45)'  // Orbit 4: Goals (Soft Lavender)
      ];

      for (let i = 1; i < orbitRadii.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, orbitRadii[i] * (timelineValue / 100), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Core Planet (Nzlbl / Sen) - Sweet Strawberry & Cream Sphere
      const pulse = Math.sin(time * 0.003) * 3;
      const r = 38 + pulse;

      const aura = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2.4);
      aura.addColorStop(0, 'rgba(255, 117, 160, 0.5)');
      aura.addColorStop(1, 'rgba(255, 183, 197, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Saturn Ring (Pastel Pink)
      ctx.save();
      ctx.rotate(Math.PI / 6);
      ctx.strokeStyle = 'rgba(255, 117, 160, 0.7)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.9, r * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const planetGrad = ctx.createRadialGradient(-10, -10, 2, 0, 0, r);
      planetGrad.addColorStop(0, '#ff75a0');
      planetGrad.addColorStop(0.7, '#ffb7c5');
      planetGrad.addColorStop(1, '#c8b6ff');
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3c096c';
      ctx.font = '700 14px Fredoka';
      ctx.textAlign = 'center';
      ctx.fillText(`🌍 ${user?.name || 'Nzlbl'} (Ana Gezegen)`, 0, r + 28);

      // Celestial Objects Render
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

        const isSelected = selectedObject?.id === obj.id;
        const isSearchMatch = searchQuery && obj.title.toLowerCase().includes(searchQuery.toLowerCase());

        ctx.save();
        ctx.translate(px, py);

        if (isSelected || isSearchMatch) {
          ctx.strokeStyle = isSelected ? '#ff4d6d' : '#ff75a0';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, 34, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (obj.category === 'Goal' && !obj.isCompleted) {
          // Locked Planet
          ctx.fillStyle = 'rgba(255, 240, 245, 0.95)';
          ctx.strokeStyle = 'rgba(255, 117, 160, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ff75a0';
          ctx.font = '13px FontAwesome';
          ctx.textAlign = 'center';
          ctx.fillText('🔒', 0, 4);
        } else {
          // Active Glowing Pastel Planet
          const pAura = ctx.createRadialGradient(0, 0, 10, 0, 0, 36);
          pAura.addColorStop(0, 'rgba(255, 117, 160, 0.45)');
          pAura.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = pAura;
          ctx.beginPath();
          ctx.arc(0, 0, 36, 0, Math.PI * 2);
          ctx.fill();

          const pGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, 20);
          if (obj.category === 'Person') {
            pGrad.addColorStop(0, '#ff75a0');
            pGrad.addColorStop(1, '#ff4d6d');
          } else if (obj.category === 'Hobby') {
            pGrad.addColorStop(0, '#e7c6ff');
            pGrad.addColorStop(1, '#9d4edd');
          } else if (obj.category === 'Memory') {
            pGrad.addColorStop(0, '#ffb7c5');
            pGrad.addColorStop(1, '#ff75a0');
          } else {
            pGrad.addColorStop(0, '#c8b6ff');
            pGrad.addColorStop(1, '#70d6ff');
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

        ctx.fillStyle = isSelected ? '#ff4d6d' : '#3c096c';
        ctx.font = isSelected ? '700 13px Fredoka' : '600 12px Fredoka';
        ctx.textAlign = 'center';
        ctx.fillText(`${icon} ${obj.title}`, 0, 32);

        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [celestials, user, searchQuery, activeCategoryFilter, selectedObject, timelineValue]);

  const handleAddObject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let orbit = 4;
      if (category === 'Person' || category === 'Moon') orbit = 1;
      if (category === 'Hobby') orbit = 2;
      if (category === 'Memory') orbit = 3;

      const res = await fetch('/api/celestials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, description, imageUrl, skin, orbit })
      });
      const data = await res.json();
      if (data.success) {
        setCelestials([...celestials, data.data]);
        setShowAddModal(false);
        setTitle('');
        setDescription('');
        setImageUrl('');
        playSoundEffect(587.33, 'triangle');
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

  const handleCompleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/celestials/${id}/complete`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        setCelestials(celestials.map(c => c.id === id ? { ...c, isCompleted: true } : c));
        setSelectedObject(null);
        playSoundEffect(1046.50, 'sawtooth');
        showToast('PLANET DISCOVERED! 🎉', data.magicMessage);
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

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Kawaii Cute Header HUD */}
      <header className="hud-header">
        <div className="brand">
          <div className="logo-icon">🌸</div>
          <div>
            <h1>My Little Universe <span className="badge">Kawaii Pastel</span></h1>
            <p className="subtitle">"Your life, your cute little universe."</p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '220px' }}>
          <input
            type="text"
            placeholder="🎀 Gezegen / Anı Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.9)', border: '2px solid rgba(255,183,197,0.6)', color: '#3c096c', fontSize: '0.88rem', fontWeight: 600, outline: 'none' }}
          />
        </div>

        {/* Stats Pills */}
        <div className="stats-bar">
          <div className="stat-pill"><i className="fa-solid fa-rocket" style={{ color: '#ff75a0' }}></i> <span><strong>{celestials.filter(c => c.category === 'Goal').length}</strong> Hayal</span></div>
          <div className="stat-pill"><i className="fa-solid fa-star" style={{ color: '#ffb7c5' }}></i> <span><strong>{celestials.filter(c => c.category === 'Memory').length}</strong> Anı</span></div>
          <div className="stat-pill"><i className="fa-solid fa-heart" style={{ color: '#ff4d6d' }}></i> <span><strong>{celestials.filter(c => c.category === 'Person').length}</strong> Gezegen</span></div>
          <div className="stat-pill"><i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#c8b6ff' }}></i> <span><strong>{celestials.filter(c => c.category === 'Hobby').length}</strong> Hobi</span></div>
        </div>

        <div className="header-actions">
          <button className={`btn ${soundEnabled ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSoundEnabled(!soundEnabled)}>
            <i className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i> {soundEnabled ? 'Ses Açık 🎵' : 'Ses Kapalı 🔇'}
          </button>
          <button className="btn btn-mood" onClick={() => setShowMoodModal(true)}><i className="fa-solid fa-moon"></i> Günün Yıldızı 🌙</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><i className="fa-solid fa-plus"></i> Evrene Ekle</button>
        </div>
      </header>

      {/* Category Filter Bar */}
      <div style={{ position: 'absolute', top: '96px', left: '20px', display: 'flex', gap: '8px', zIndex: 10 }}>
        {['ALL', 'Goal', 'Memory', 'Person', 'Hobby', 'Moon'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategoryFilter(cat)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: '2px solid rgba(255, 183, 197, 0.6)',
              background: activeCategoryFilter === cat ? 'linear-gradient(135deg, #ff75a0, #ffb7c5)' : 'rgba(255, 255, 255, 0.85)',
              color: activeCategoryFilter === cat ? '#ffffff' : '#3c096c',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: activeCategoryFilter === cat ? '0 4px 15px rgba(255, 117, 160, 0.35)' : '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            {cat === 'ALL' ? '🌌 Tümü' : cat === 'Goal' ? '🚀 Hayaller' : cat === 'Memory' ? '⭐ Anılar' : cat === 'Person' ? '💗 İnsanlar' : cat === 'Hobby' ? '✨ Hobiler' : '🌙 Uydular'}
          </button>
        ))}
      </div>

      {/* Big Bang Timeline Slider Bar (Bottom Center) */}
      <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'blur(20px)', border: '2px solid rgba(255,183,197,0.6)', padding: '14px 28px', borderRadius: '32px', display: 'flex', alignItems: 'center', gap: '18px', zIndex: 10, boxShadow: '0 10px 35px rgba(255,117,160,0.2)', minWidth: '480px' }}>
        <button onClick={togglePlayTimeline} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '16px' }}>
          {isPlayingTimeline ? '⏸️ Durdur' : '▶️ Big Bang İle Büyüt'}
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#3c096c', fontWeight: 700 }}>
            <span>🌱 İlk Gün</span>
            <span style={{ color: '#ff4d6d' }}>%{timelineValue} Genişleme</span>
            <span>✨ Bugün</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={timelineValue}
            onChange={(e) => setTimelineValue(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#ff75a0' }}
          />
        </div>
      </div>

      {/* Kawaii Cute Glassmorphism Side Drawer Inspector */}
      {selectedObject && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: '420px', height: '100vh', background: 'rgba(255, 245, 248, 0.94)', backdropFilter: 'blur(24px)', borderLeft: '2px solid rgba(255, 183, 197, 0.6)', boxShadow: '-10px 0 50px rgba(255,117,160,0.2)', zIndex: 60, padding: '30px', display: 'flex', flexDirection: 'column', transition: 'all 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,117,160,0.15)', color: '#ff4d6d', border: '1.5px solid rgba(255,117,160,0.4)', letterSpacing: '1px' }}>
              {selectedObject.category.toUpperCase()}
            </span>
            <button onClick={() => setSelectedObject(null)} style={{ background: 'rgba(255,117,160,0.15)', border: 'none', color: '#ff4d6d', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>

          {selectedObject.imageUrl ? (
            <div style={{ background: '#fff', padding: '12px 12px 24px 12px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(255,117,160,0.2)', transform: 'rotate(-2deg)', marginBottom: '20px', border: '2px solid #ffe4e1' }}>
              <img src={selectedObject.imageUrl} alt={selectedObject.title} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px' }} />
              <p style={{ color: '#3c096c', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'Fredoka', textAlign: 'center', marginTop: '10px' }}>{selectedObject.title}</p>
            </div>
          ) : (
            <div style={{ fontSize: '4.5rem', textAlign: 'center', margin: '20px 0', filter: 'drop-shadow(0 0 15px rgba(255,117,160,0.4))' }}>
              {selectedObject.category === 'Memory' ? '⭐' : selectedObject.category === 'Person' ? '💗' : selectedObject.category === 'Hobby' ? '✨' : '🪐'}
            </div>
          )}

          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: '6px', color: '#3c096c' }}>{selectedObject.title}</h2>
          <p style={{ fontSize: '0.85rem', color: '#7b2cbf', marginBottom: '16px', fontWeight: 600 }}><i className="fa-regular fa-calendar"></i> {new Date(selectedObject.createdAt).toLocaleDateString('tr-TR')}</p>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.8)', padding: '16px', borderRadius: '18px', border: '1.5px solid rgba(255, 183, 197, 0.5)', marginBottom: '20px', lineHeight: 1.6, fontSize: '0.95rem', color: '#3c096c', fontWeight: 600 }}>
            {selectedObject.description || 'Bu varlık için herhangi bir detay girilmemiş.'}
          </div>

          {selectedObject.category === 'Goal' && (
            <div style={{ marginBottom: '20px' }}>
              {selectedObject.isCompleted ? (
                <div style={{ padding: '14px', background: 'rgba(255, 183, 197, 0.25)', border: '2px solid #ff75a0', borderRadius: '18px', color: '#ff4d6d', fontWeight: 700, textAlign: 'center' }}>
                  ✨ PLANET DISCOVERED! (Keşfedildi)
                </div>
              ) : (
                <button onClick={() => handleCompleteGoal(selectedObject.id)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                  <i className="fa-solid fa-wand-magic-sparkles"></i> PLANET DISCOVERED! 🎉
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
            <button onClick={() => handleDeleteObject(selectedObject.id)} className="btn" style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', border: '1.5px solid rgba(255,77,109,0.4)', width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-trash"></i> Evrenden Sil
            </button>
          </div>
        </div>
      )}

      {/* Magic Event Toast */}
      {magicToast && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#ffffff', border: '3px solid #ff75a0', padding: '30px 50px', borderRadius: '32px', textAlign: 'center', zIndex: 100, boxShadow: '0 0 50px rgba(255,117,160,0.5)' }}>
          <h2 style={{ background: 'linear-gradient(135deg, #ff4d6d, #9d4edd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem', marginBottom: '10px', fontWeight: 800 }}>{magicToast.title}</h2>
          <p style={{ color: '#3c096c', fontWeight: 700 }}>{magicToast.message}</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(60,9,108,0.3)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#ffffff', border: '2px solid rgba(255,183,197,0.8)', padding: '28px', borderRadius: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 15px 40px rgba(255,117,160,0.25)' }}>
            <h2 style={{ marginBottom: '16px', color: '#3c096c' }}>Evrene Yeni Varlık Ekle 🌸</h2>
            <form onSubmit={handleAddObject}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#7b2cbf', fontWeight: 700 }}>Tür</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '14px', background: '#fff0f5', color: '#3c096c', border: '2px solid rgba(255,183,197,0.6)', fontWeight: 600 }}>
                  <option value="Goal">🚀 Keşfedilmemiş Hayal / Hedef</option>
                  <option value="Memory">⭐ Anı Yıldızı</option>
                  <option value="Person">💗 Önemli İnsan</option>
                  <option value="Hobby">✨ Hobi (Takımyıldız)</option>
                  <option value="Moon">🌙 Uydu (Favori)</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#7b2cbf', fontWeight: 700 }}>Başlık</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Japonya Tatili" required style={{ width: '100%', padding: '12px', borderRadius: '14px', background: '#fff0f5', color: '#3c096c', border: '2px solid rgba(255,183,197,0.6)', fontWeight: 600 }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ color: '#7b2cbf', fontWeight: 700 }}>Açıklama / Hikaye</label>
                  <button type="button" onClick={handleAIAnalyze} disabled={isAnalyzing} style={{ background: 'rgba(255,117,160,0.15)', color: '#ff4d6d', border: '1.5px solid #ff75a0', padding: '4px 12px', borderRadius: '14px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}>
                    {isAnalyzing ? 'Analiz ediliyor...' : '✨ AI Otomatik Analiz Et'}
                  </button>
                </div>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama veya detay..." style={{ width: '100%', padding: '12px', borderRadius: '14px', background: '#fff0f5', color: '#3c096c', border: '2px solid rgba(255,183,197,0.6)', fontWeight: 600 }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#7b2cbf', fontWeight: 700 }}>Fotoğraf URL (İsteğe Bağlı)</label>
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." style={{ width: '100%', padding: '12px', borderRadius: '14px', background: '#fff0f5', color: '#3c096c', border: '2px solid rgba(255,183,197,0.6)', fontWeight: 600 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" style={{ background: '#ffe4e1', color: '#3c096c' }} onClick={() => setShowAddModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Evrene Yolla 🚀</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mood Modal */}
      {showMoodModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(60,9,108,0.3)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#ffffff', border: '2px solid rgba(200,182,255,0.6)', padding: '28px', borderRadius: '28px', width: '100%', maxWidth: '420px', textAlign: 'center', boxShadow: '0 15px 40px rgba(200,182,255,0.3)' }}>
            <h2 style={{ marginBottom: '12px', color: '#3c096c' }}>Günün Yıldızı 🌙</h2>
            <p style={{ marginBottom: '16px', color: '#7b2cbf', fontWeight: 600 }}>Günün nasıl geçti?</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '2.2rem', marginBottom: '20px', cursor: 'pointer' }}>
              {['😊', '🙂', '😐', '😔', '😭'].map((emo, idx) => (
                <span key={idx} onClick={() => setSelectedMood(['Great','Good','Okay','NotGreat','Terrible'][idx])} style={{ padding: '6px', borderRadius: '16px', background: selectedMood === ['Great','Good','Okay','NotGreat','Terrible'][idx] ? 'rgba(255,117,160,0.25)' : 'transparent' }}>{emo}</span>
              ))}
            </div>
            <input type="text" value={moodNote} onChange={e => setMoodNote(e.target.value)} placeholder="Güne dair not..." style={{ width: '100%', padding: '12px', borderRadius: '14px', background: '#fff0f5', color: '#3c096c', border: '2px solid rgba(255,183,197,0.6)', marginBottom: '20px', fontWeight: 600 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" style={{ background: '#ffe4e1', color: '#3c096c' }} onClick={() => setShowMoodModal(false)}>İptal</button>
              <button type="button" className="btn btn-mood" onClick={handleSaveMood}>Yıldızı Oluştur ⭐</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
