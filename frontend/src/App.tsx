import React, { useEffect, useRef, useState } from 'react';
import { CelestialObject, DailyMood, UserProfile } from './types/galaxy';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Form & Local Upload states
  const [category, setCategory] = useState<string>('Goal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMood, setSelectedMood] = useState('Great');
  const [moodNote, setMoodNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Camera state & Generous Spaced Orbit Radii
  const camera = useRef({ x: 0, y: 0, zoom: 1, targetZoom: 1, isDragging: false, dragStart: { x: 0, y: 0 } });
  const orbitRadii = [0, 220, 390, 570, 760];
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
        showToast('✨ AI ANALİZ ETTİ!', `Kategori "${data.analysis.category}" olarak belirlendi.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Canvas Render Loop
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
          setActivePhotoIndex(0);
          playSoundEffect(659.25, 'sine');
          return;
        }
      }
    };

    canvas.addEventListener('click', handleCanvasClick);

    const render = (time: number) => {
      camera.current.zoom += (camera.current.targetZoom - camera.current.zoom) * 0.1;

      // Soft Holographic Background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#fff0f5');
      grad.addColorStop(0.35, '#f3e8ff');
      grad.addColorStop(0.7, '#e0e7ff');
      grad.addColorStop(1, '#fff5f7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.translate(cx + camera.current.x, cy + camera.current.y);
      ctx.scale(camera.current.zoom, camera.current.zoom);

      // Elegant Orbit Rings
      const colors = ['', 'rgba(255, 183, 197, 0.55)', 'rgba(216, 180, 254, 0.55)', 'rgba(255, 209, 220, 0.55)', 'rgba(186, 230, 253, 0.55)'];
      for (let i = 1; i < orbitRadii.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, orbitRadii[i] * (timelineValue / 100), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Core Planet (Nzlbl / Sen)
      const pulse = Math.sin(time * 0.003) * 3;
      const r = 38 + pulse;

      const aura = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 2.5);
      aura.addColorStop(0, 'rgba(255, 183, 197, 0.6)');
      aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Saturn Ring
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

      ctx.fillStyle = '#2d1836';
      ctx.font = '700 14px "Plus Jakarta Sans"';
      ctx.textAlign = 'center';
      ctx.fillText(`🌸 ${user?.name || 'Nzlbl'} (Ana Gezegen)`, 0, r + 28);

      // Render Objects
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
          ctx.strokeStyle = isSelected ? '#ff85a1' : '#d8b4fe';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 34, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (obj.category === 'Goal' && !obj.isCompleted) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.strokeStyle = 'rgba(255, 183, 197, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ff85a1';
          ctx.font = '12px FontAwesome';
          ctx.textAlign = 'center';
          ctx.fillText('🔒', 0, 4);
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

        ctx.fillStyle = isSelected ? '#ff85a1' : '#2d1836';
        ctx.font = isSelected ? '700 13px "Plus Jakarta Sans"' : '600 12px "Plus Jakarta Sans"';
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

      const imageUrl = uploadedPhotos.length > 0 ? uploadedPhotos[0] : '';
      const res = await fetch('/api/celestials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, description, imageUrl, orbit })
      });
      const data = await res.json();
      if (data.success) {
        setCelestials([...celestials, data.data]);
        setShowAddModal(false);
        setTitle('');
        setDescription('');
        setUploadedPhotos([]);
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

      {/* Floating Brand Title (Top Left) */}
      <div className="brand-floating">
        <div style={{ fontSize: '1.8rem' }}>🌸</div>
        <div>
          <h1>My Little Universe</h1>
          <p>"Your life, your aesthetic universe."</p>
        </div>
      </div>

      {/* Floating Search Pill (Top Right) */}
      <div className="search-floating">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Gezegen / Anı Ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className={`btn ${soundEnabled ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSoundEnabled(!soundEnabled)} style={{ padding: '10px 16px' }}>
          {soundEnabled ? '🎵' : '🔇'}
        </button>
      </div>

      {/* Sleek Apple Glass Dock (Bottom Center) - NO TOP BAR! */}
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

      {/* Side Drawer Inspector */}
      {selectedObject && (
        <div style={{ position: 'absolute', top: 0, right: 0, width: '420px', height: '100vh', background: 'rgba(255, 245, 248, 0.92)', backdropFilter: 'blur(30px)', borderLeft: '1.5px solid rgba(255, 255, 255, 0.9)', boxShadow: '-10px 0 50px rgba(216,180,254,0.3)', zIndex: 60, padding: '32px', display: 'flex', flexDirection: 'column', transition: 'all 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,183,197,0.3)', color: '#2d1836', border: '1px solid rgba(255,255,255,0.9)', letterSpacing: '1px' }}>
              {selectedObject.category.toUpperCase()}
            </span>
            <button onClick={() => setSelectedObject(null)} style={{ background: 'rgba(255,255,255,0.8)', border: 'none', color: '#2d1836', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>

          {/* Photo Polaroid View */}
          {selectedObject.imageUrl ? (
            <div style={{ background: '#fff', padding: '14px 14px 26px 14px', borderRadius: '22px', boxShadow: '0 12px 35px rgba(216,180,254,0.3)', transform: 'rotate(-2deg)', marginBottom: '20px', border: '1.5px solid rgba(255,255,255,0.9)' }}>
              <img src={selectedObject.imageUrl} alt={selectedObject.title} style={{ width: '100%', height: '230px', objectFit: 'cover', borderRadius: '14px' }} />
              <p style={{ color: '#2d1836', fontSize: '0.95rem', fontWeight: 700, fontFamily: '"Playfair Display"', textAlign: 'center', marginTop: '12px' }}>{selectedObject.title}</p>
            </div>
          ) : (
            <div style={{ fontSize: '4.5rem', textAlign: 'center', margin: '20px 0', filter: 'drop-shadow(0 4px 20px rgba(216,180,254,0.5))' }}>
              {selectedObject.category === 'Memory' ? '⭐' : selectedObject.category === 'Person' ? '💗' : selectedObject.category === 'Hobby' ? '✨' : '🪐'}
            </div>
          )}

          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: '"Playfair Display"', marginBottom: '6px', color: '#2d1836' }}>{selectedObject.title}</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b4d75', marginBottom: '16px', fontWeight: 500 }}><i className="fa-regular fa-calendar"></i> {new Date(selectedObject.createdAt).toLocaleDateString('tr-TR')}</p>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.75)', padding: '18px', borderRadius: '20px', border: '1.5px solid rgba(255, 255, 255, 0.9)', marginBottom: '20px', lineHeight: 1.6, fontSize: '0.95rem', color: '#2d1836', fontWeight: 500 }}>
            {selectedObject.description || 'Bu varlık için herhangi bir detay girilmemiş.'}
          </div>

          {selectedObject.category === 'Goal' && (
            <div style={{ marginBottom: '20px' }}>
              {selectedObject.isCompleted ? (
                <div style={{ padding: '14px', background: 'rgba(255, 183, 197, 0.3)', border: '1.5px solid #ffb7c5', borderRadius: '20px', color: '#2d1836', fontWeight: 700, textAlign: 'center' }}>
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
            <button onClick={() => handleDeleteObject(selectedObject.id)} className="btn" style={{ background: 'rgba(255,133,161,0.2)', color: '#2d1836', border: '1.5px solid rgba(255,133,161,0.4)', width: '100%', justifyContent: 'center' }}>
              <i className="fa-solid fa-trash"></i> Evrenden Sil
            </button>
          </div>
        </div>
      )}

      {/* Magic Event Toast */}
      {magicToast && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(255, 255, 255, 0.95)', border: '2px solid #ffb7c5', padding: '32px 54px', borderRadius: '36px', textAlign: 'center', zIndex: 100, boxShadow: '0 0 60px rgba(216,180,254,0.6)' }}>
          <h2 style={{ fontFamily: '"Playfair Display"', color: '#2d1836', fontSize: '2.1rem', marginBottom: '10px', fontWeight: 700 }}>{magicToast.title}</h2>
          <p style={{ color: '#6b4d75', fontWeight: 600 }}>{magicToast.message}</p>
        </div>
      )}

      {/* Add Modal with Real Multi-File Drag-and-Drop Local Upload */}
      {showAddModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,24,54,0.35)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.96)', border: '2px solid rgba(255,255,255,0.95)', padding: '30px', borderRadius: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 50px rgba(216,180,254,0.35)' }}>
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

              {/* Real Multi-File Drag & Drop Local File Uploader */}
              <div style={{ marginBottom: '20px' }}>
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

                {/* Uploaded Photos Preview Badges */}
                {uploadedPhotos.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {uploadedPhotos.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '54px', height: '54px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #ffb7c5' }}>
                        <img src={url} alt="upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" style={{ background: '#f3e8ff', color: '#2d1836' }} onClick={() => setShowAddModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">Evrene Yolla 🚀</button>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" style={{ background: '#f3e8ff', color: '#2d1836' }} onClick={() => setShowMoodModal(false)}>İptal</button>
              <button type="button" className="btn btn-mood" onClick={handleSaveMood}>Yıldızı Oluştur ⭐</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
