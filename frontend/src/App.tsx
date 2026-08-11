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
  const [cosmicTheme, setCosmicTheme] = useState<'cyan' | 'violet' | 'solar' | 'cyberpunk'>('cyan');
  
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
  const [skin, setSkin] = useState('saturn');
  const [selectedMood, setSelectedMood] = useState('Great');
  const [moodNote, setMoodNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Camera state
  const camera = useRef({ x: 0, y: 0, zoom: 1, targetZoom: 1, isDragging: false, dragStart: { x: 0, y: 0 } });
  const orbitRadii = [0, 160, 310, 470, 640];
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

  // Canvas Render Engine Loop with Raycaster Object Clicking
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

    // Mouse click raycaster for side drawer selection
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

      let bg1 = '#090e2d', bg2 = '#040718', bg3 = '#020309';
      if (cosmicTheme === 'violet') { bg1 = '#1c0a35'; bg2 = '#0b041a'; bg3 = '#04010a'; }
      if (cosmicTheme === 'solar') { bg1 = '#301c08'; bg2 = '#140a02'; bg3 = '#080301'; }
      if (cosmicTheme === 'cyberpunk') { bg1 = '#30081a'; bg2 = '#14020a'; bg3 = '#080104'; }

      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 50,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      );
      grad.addColorStop(0, bg1);
      grad.addColorStop(0.5, bg2);
      grad.addColorStop(1, bg3);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.translate(cx + camera.current.x, cy + camera.current.y);
      ctx.scale(camera.current.zoom, camera.current.zoom);

      // Orbit Rings
      const colors = ['', 'rgba(255,117,160,0.25)', 'rgba(157,78,221,0.25)', 'rgba(255,215,0,0.25)', 'rgba(0,243,255,0.25)'];
      for (let i = 1; i < orbitRadii.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, orbitRadii[i], 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Core Planet
      const pulse = Math.sin(time * 0.003) * 3;
      const r = 34 + pulse;
      const aura = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2.2);
      aura.addColorStop(0, 'rgba(0, 243, 255, 0.5)');
      aura.addColorStop(1, 'rgba(0, 243, 255, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
      ctx.fill();

      const planetGrad = ctx.createRadialGradient(-8, -8, 2, 0, 0, r);
      planetGrad.addColorStop(0, '#00f3ff');
      planetGrad.addColorStop(1, '#03045e');
      ctx.fillStyle = planetGrad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 13px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(`🌍 ${user?.name || 'Sen'} (Ana Gezegen)`, 0, r + 24);

      // Filtered Celestial Objects Render
      const filteredList = celestials.filter(obj => {
        const matchesCategory = activeCategoryFilter === 'ALL' || obj.category === activeCategoryFilter;
        const matchesSearch = !searchQuery || obj.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });

      filteredList.forEach((obj) => {
        const radius = orbitRadii[obj.orbit] || 300;
        const currentAngle = obj.angle + (time * 0.0001 * (5 - obj.orbit));
        const px = Math.cos(currentAngle) * radius;
        const py = Math.sin(currentAngle) * radius;

        const isSelected = selectedObject?.id === obj.id;
        const isSearchMatch = searchQuery && obj.title.toLowerCase().includes(searchQuery.toLowerCase());

        ctx.save();
        ctx.translate(px, py);

        if (isSelected || isSearchMatch) {
          ctx.strokeStyle = isSelected ? '#ff007f' : '#ffd700';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 32, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (obj.category === 'Goal' && !obj.isCompleted) {
          ctx.fillStyle = 'rgba(20,25,45,0.9)';
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.font = '12px FontAwesome';
          ctx.textAlign = 'center';
          ctx.fillText('🔒', 0, 4);
        } else {
          const pAura = ctx.createRadialGradient(0, 0, 10, 0, 0, 35);
          pAura.addColorStop(0, 'rgba(0,243,255,0.4)');
          pAura.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = pAura;
          ctx.beginPath();
          ctx.arc(0, 0, 35, 0, Math.PI * 2);
          ctx.fill();

          const pGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, 18);
          pGrad.addColorStop(0, obj.category === 'Person' ? '#ff75a0' : '#00f3ff');
          pGrad.addColorStop(1, obj.category === 'Person' ? '#ff007f' : '#7b2cbf');
          ctx.fillStyle = pGrad;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        let icon = '🚀';
        if (obj.category === 'Memory') icon = '⭐';
        if (obj.category === 'Hobby') icon = '✨';
        if (obj.category === 'Person') icon = '💗';
        if (obj.category === 'Moon') icon = '🌙';

        ctx.fillStyle = isSelected ? '#ff75a0' : (isSearchMatch ? '#ffd700' : '#ffffff');
        ctx.font = isSelected ? '700 13px Outfit' : '500 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(`${icon} ${obj.title}`, 0, 28);

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
  }, [celestials, user, searchQuery, activeCategoryFilter, cosmicTheme, selectedObject]);

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

      {/* Header HUD */}
      <header className="hud-header">
        <div className="brand">
          <div className="logo-icon">🌌</div>
          <div>
            <h1>My Little Universe <span className="badge">Sci-Fi UI</span></h1>
            <p className="subtitle">"Your life, your little universe."</p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '220px' }}>
          <input
            type="text"
            placeholder="🔍 Gezegen / Anı Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 14px', borderRadius: '14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.85rem' }}
          />
        </div>

        {/* Stats Pills */}
        <div className="stats-bar">
          <div className="stat-pill"><i className="fa-solid fa-rocket color-cyan"></i> <span><strong>{celestials.filter(c => c.category === 'Goal').length}</strong> Hayal</span></div>
          <div className="stat-pill"><i className="fa-solid fa-star color-gold"></i> <span><strong>{celestials.filter(c => c.category === 'Memory').length}</strong> Anı</span></div>
          <div className="stat-pill"><i className="fa-solid fa-heart color-pink"></i> <span><strong>{celestials.filter(c => c.category === 'Person').length}</strong> Gezegen</span></div>
          <div className="stat-pill"><i className="fa-solid fa-palette color-purple"></i> <span><strong>{celestials.filter(c => c.category === 'Hobby').length}</strong> Hobi</span></div>
        </div>

        <div className="header-actions">
          <select value={cosmicTheme} onChange={(e: any) => setCosmicTheme(e.target.value)} style={{ padding: '8px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
            <option value="cyan">🌌 Deep Space</option>
            <option value="violet">🔮 Nebula Violet</option>
            <option value="solar">☀️ Solar Gold</option>
            <option value="cyberpunk">💖 Cyberpunk Pink</option>
          </select>

          <button className={`btn ${soundEnabled ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSoundEnabled(!soundEnabled)}>
            <i className={`fa-solid ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i> {soundEnabled ? 'Ses Açık 🎵' : 'Ses Kapalı 🔇'}
          </button>
          <button className="btn btn-mood" onClick={() => setShowMoodModal(true)}><i className="fa-solid fa-moon"></i> Günün Yıldızı 🌙</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><i className="fa-solid fa-plus"></i> Evrene Ekle</button>
        </div>
      </header>

      {/* Category Filter Bar */}
      <div style={{ position: 'absolute', top: '90px', left: '20px', display: 'flex', gap: '8px', zIndex: 10 }}>
        {['ALL', 'Goal', 'Memory', 'Person', 'Hobby', 'Moon'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategoryFilter(cat)}
            style={{
              padding: '6px 12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: activeCategoryFilter === cat ? 'linear-gradient(135deg, #00f3ff, #7b2cbf)' : 'rgba(10,16,38,0.7)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)'
            }}
          >
            {cat === 'ALL' ? '🌌 Tümü' : cat === 'Goal' ? '🚀 Hayaller' : cat === 'Memory' ? '⭐ Anılar' : cat === 'Person' ? '💗 İnsanlar' : cat === 'Hobby' ? '✨ Hobiler' : '🌙 Uydular'}
          </button>
        ))}
      </div>

      {/* Futuristic Glassmorphism Side Drawer Inspector */}
      {selectedObject && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: '420px', height: '100vh', background: 'rgba(10, 16, 42, 0.85)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '-10px 0 40px rgba(0,0,0,0.7)', zIndex: 60, padding: '30px', display: 'flex', flexDirection: 'column', transition: 'all 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', background: 'rgba(0,243,255,0.15)', color: '#00f3ff', border: '1px solid rgba(0,243,255,0.3)', letterSpacing: '1px' }}>
              {selectedObject.category.toUpperCase()}
            </span>
            <button onClick={() => setSelectedObject(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Polaroid Photo Frame if photo attached */}
          {selectedObject.imageUrl ? (
            <div style={{ background: '#fff', padding: '12px 12px 24px 12px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', transform: 'rotate(-2deg)', marginBottom: '20px' }}>
              <img src={selectedObject.imageUrl} alt={selectedObject.title} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px' }} />
              <p style={{ color: '#222', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'Outfit', textAlign: 'center', marginTop: '10px' }}>{selectedObject.title}</p>
            </div>
          ) : (
            <div style={{ fontSize: '4.5rem', textAlign: 'center', margin: '20px 0', filter: 'drop-shadow(0 0 20px rgba(0,243,255,0.5))' }}>
              {selectedObject.category === 'Memory' ? '⭐' : selectedObject.category === 'Person' ? '💗' : selectedObject.category === 'Hobby' ? '✨' : '🪐'}
            </div>
          )}

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px' }}>{selectedObject.title}</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}><i className="fa-regular fa-calendar"></i> {new Date(selectedObject.createdAt).toLocaleDateString('tr-TR')}</p>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', lineHeight: 1.6, fontSize: '0.92rem', color: 'rgba(255,255,255,0.85)' }}>
            {selectedObject.description || 'Bu varlık için herhangi bir detay girilmemiş.'}
          </div>

          {selectedObject.category === 'Goal' && (
            <div style={{ marginBottom: '20px' }}>
              {selectedObject.isCompleted ? (
                <div style={{ padding: '12px', background: 'rgba(0,245,212,0.15)', border: '1px solid #00f5d4', borderRadius: '14px', color: '#00f5d4', fontWeight: 700, textAlign: 'center' }}>
                  ✨ PLANET DISCOVERED! (Keşfedildi)
                </div>
              ) : (
                <button onClick={() => handleCompleteGoal(selectedObject.id)} className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                  <i className="fa-solid fa-wand-magic-sparkles"></i> PLANET DISCOVERED! 🎉
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
            <button onClick={() => handleDeleteObject(selectedObject.id)} className="btn" style={{ background: 'rgba(255,0,127,0.15)', color: '#ff007f', border: '1px solid rgba(255,0,127,0.3)', width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-trash"></i> Evrenden Sil
            </button>
          </div>
        </div>
      )}

      {/* Magic Event Toast */}
      {magicToast && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, #0e1430 0%, #030511 100%)', border: '2px solid #ffd700', padding: '30px 50px', borderRadius: '30px', textAlign: 'center', zIndex: 100, boxShadow: '0 0 50px rgba(255,215,0,0.6)' }}>
          <h2 style={{ background: 'linear-gradient(135deg, #ffd700, #ff75a0, #00f3ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '2rem', marginBottom: '10px' }}>{magicToast.title}</h2>
          <p style={{ color: '#fff' }}>{magicToast.message}</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,5,17,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#0e1430', border: '1px solid rgba(255,255,255,0.15)', padding: '28px', borderRadius: '24px', width: '100%', maxWidth: '460px' }}>
            <h2 style={{ marginBottom: '16px' }}>Evrene Yeni Varlık Ekle 🌌</h2>
            <form onSubmit={handleAddObject}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px' }}>Tür</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#182046', color: '#fff', border: '1px solid #334' }}>
                  <option value="Goal">🚀 Keşfedilmemiş Hayal / Hedef</option>
                  <option value="Memory">⭐ Anı Yıldızı</option>
                  <option value="Person">💗 Önemli İnsan</option>
                  <option value="Hobby">✨ Hobi (Takımyıldız)</option>
                  <option value="Moon">🌙 Uydu (Favori)</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px' }}>Başlık</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Japonya Tatili" required style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#182046', color: '#fff', border: '1px solid #334' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label>Açıklama / Hikaye</label>
                  <button type="button" onClick={handleAIAnalyze} disabled={isAnalyzing} style={{ background: 'rgba(0,243,255,0.15)', color: '#00f3ff', border: '1px solid #00f3ff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer' }}>
                    {isAnalyzing ? 'Analiz ediliyor...' : '✨ AI Otomatik Analiz Et'}
                  </button>
                </div>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Açıklama veya detay..." style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#182046', color: '#fff', border: '1px solid #334' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px' }}>Fotoğraf URL (İsteğe Bağlı)</label>
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#182046', color: '#fff', border: '1px solid #334' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" style={{ background: '#334' }} onClick={() => setShowAddModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Evrene Yolla 🚀</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mood Modal */}
      {showMoodModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,5,17,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#0e1430', border: '1px solid rgba(255,215,0,0.3)', padding: '28px', borderRadius: '24px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '12px' }}>Günün Yıldızı 🌙</h2>
            <p style={{ marginBottom: '16px', color: '#ccc' }}>Günün nasıl geçti?</p>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '2rem', marginBottom: '20px', cursor: 'pointer' }}>
              {['😊', '🙂', '😐', '😔', '😭'].map((emo, idx) => (
                <span key={idx} onClick={() => setSelectedMood(['Great','Good','Okay','NotGreat','Terrible'][idx])} style={{ padding: '6px', borderRadius: '12px', background: selectedMood === ['Great','Good','Okay','NotGreat','Terrible'][idx] ? 'rgba(255,215,0,0.25)' : 'transparent' }}>{emo}</span>
              ))}
            </div>
            <input type="text" value={moodNote} onChange={e => setMoodNote(e.target.value)} placeholder="Güne dair not..." style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#182046', color: '#fff', border: '1px solid #334', marginBottom: '20px' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" style={{ background: '#334' }} onClick={() => setShowMoodModal(false)}>İptal</button>
              <button type="button" className="btn btn-mood" onClick={handleSaveMood}>Yıldızı Oluştur ⭐</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
