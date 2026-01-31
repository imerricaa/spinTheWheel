import React, { useState, useEffect } from 'react';

const spinTheWheel = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState('login'); 
  const [creds, setCreds] = useState({ email: '', password: '' });

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState('wheel');
  const [area, setArea] = useState('Taipa');
  const [restaurants, setRestaurants] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);

  // --- TRENDING DATA ---
  const [trending] = useState([
    { name: "Lord Stow's Bakery", score: 98, area: "Coloane" },
    { name: "Single Origin", score: 85, area: "Taipa" },
    { name: "O Santos", score: 72, area: "Taipa" },
    { name: "Rooftop Macau", score: 64, area: "Taipa" },
    { name: "Margaret's Café e Nata", score: 91, area: "Macau" }
  ]);

  // DARKER NAVY PALETTE
  const heatmapPalette = ['bg-[#0A192F]', 'bg-[#112240]', 'bg-[#1D2D50]', 'bg-[#1E3A8A]', 'bg-[#3B82F6]'];
  const areaCoords = { 'Macau': '22.197,113.543', 'Taipa': '22.156,113.557', 'Coloane': '22.116,113.558' };

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    const session = localStorage.getItem('big_backs_session');
    if (session && session !== "undefined") {
      try {
        const email = JSON.parse(session);
        setCurrentUser(email);
        const userVault = localStorage.getItem(`vault_${email}`);
        if (userVault) setFavorites(JSON.parse(userVault));
      } catch (e) { console.error("Session Corrupted"); }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`vault_${currentUser}`, JSON.stringify(favorites));
    }
  }, [favorites, currentUser]);

  const handleAuth = (e) => {
    e.preventDefault();
    const emailStr = JSON.stringify(creds.email);
    localStorage.setItem('big_backs_session', emailStr);
    
    const savedVault = localStorage.getItem(`vault_${creds.email}`);
    if (!savedVault) {
      localStorage.setItem(`vault_${creds.email}`, JSON.stringify([]));
      setFavorites([]);
    } else {
      setFavorites(JSON.parse(savedVault));
    }
    
    setCurrentUser(creds.email);
    setShowAuth(false);
  };

  const logout = () => {
    localStorage.removeItem('big_backs_session');
    setCurrentUser(null);
    setFavorites([]);
  };

  const loadData = async (selectedArea) => {
    try {
      setRestaurants([]);
      let query = `[out:json];(node["amenity"~"restaurant|cafe"](around:1500,${areaCoords[selectedArea]}););out body;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      const raw = data.elements.filter(e => e.tags.name).map(e => ({
        id: e.id, name: e.tags.name,
        cuisine: (e.tags.cuisine || 'FOOD').toUpperCase(),
        lat: e.lat, lon: e.lon
      })).sort(() => Math.random() - 0.5);
      setRestaurants(raw.slice(0, 15));
    } catch (err) { console.error("API Error"); }
  };

  useEffect(() => { loadData(area); }, [area]);

  const spinWheel = () => {
    if (isSpinning || restaurants.length === 0) return;
    setIsSpinning(true);
    setResult(null);
    const spinDegrees = 1800 + Math.floor(Math.random() * 360);
    const newRotation = rotation + spinDegrees;
    setRotation(newRotation);

    setTimeout(() => {
      const actualDegrees = newRotation % 360;
      const sliceSize = 360 / Math.min(restaurants.length, 8);
      const winningIndex = Math.floor(((360 - actualDegrees) % 360) / sliceSize);
      setResult(restaurants[winningIndex]);
      setIsSpinning(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center select-none overflow-hidden font-sans">
      
      {/* AUTH MODAL */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#020C1B] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter text-white">
              {authView === 'login' ? 'The Vault' : 'New Identity'}
            </h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <input required type="email" placeholder="EMAIL" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs font-bold" onChange={e => setCreds({...creds, email: e.target.value})} />
              <input required type="password" placeholder="PASSWORD" className="w-full bg-black border border-white/10 p-4 rounded-xl text-xs font-bold" onChange={e => setCreds({...creds, password: e.target.value})} />
              <button className="w-full py-4 bg-[#0A192F] text-white font-black rounded-xl uppercase tracking-widest text-xs border border-white/10">
                {authView === 'login' ? 'Access' : 'Create'}
              </button>
            </form>
            <div className="mt-6 flex flex-col gap-3 text-center">
              <button onClick={() => setAuthView(authView === 'login' ? 'signup' : 'login')} className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                {authView === 'login' ? 'Create Account' : 'Back to Login'}
              </button>
              <button onClick={() => setShowAuth(false)} className="mt-2 text-[10px] text-red-900/50 font-black uppercase">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="w-full max-w-md p-6 flex justify-between items-center border-b border-white/5 bg-black z-30">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-[#0A192F]">BIG BACKS</h1>
        {!currentUser ? (
          <button onClick={() => {setAuthView('login'); setShowAuth(true);}} className="text-[9px] font-black bg-[#0A192F] text-white px-5 py-2 rounded-full border border-white/10">LOGIN</button>
        ) : (
          <button onClick={logout} className="text-[8px] font-black border border-white/20 px-3 py-1 rounded-full text-zinc-500 uppercase tracking-widest">LOGOUT</button>
        )}
      </div>

      <main className="w-full max-w-md px-6 flex-grow flex flex-col relative">
        
        {/* WHEEL TAB */}
        {activeTab === 'wheel' && (
          <div className="pt-4 animate-in fade-in duration-500">
            <div className="flex justify-center gap-2 mb-6">
              {['Macau', 'Taipa', 'Coloane'].map(l => (
                <button key={l} onClick={() => setArea(l)} className={`text-[9px] font-black uppercase px-4 py-2 rounded-full border transition-all ${area === l ? 'bg-[#0A192F] text-white border-white/20' : 'border-white/5 text-white/20'}`}>{l}</button>
              ))}
            </div>

            <div className="relative w-72 h-72 mx-auto mb-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-40 text-white text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">▼</div>
              <div className="w-full h-full rounded-full border-[10px] border-[#020C1B] relative overflow-hidden"
                style={{ 
                  transform: `rotate(${rotation}deg)`, 
                  transition: 'transform 4s cubic-bezier(0.15, 0, 0, 1)',
                  clipPath: 'circle(50% at 50% 50%)' 
                }}>
                {restaurants.slice(0, 8).map((res, i) => (
                  <div key={res.id + i} className={`absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left border-l border-black/30 ${heatmapPalette[i % heatmapPalette.length]}`}
                    style={{ transform: `rotate(${(360 / Math.min(restaurants.length, 8)) * i}deg) skewY(-${90 - (360 / Math.min(restaurants.length, 8))}deg)` }}>
                    <div className="absolute text-[7px] font-black uppercase text-black w-[80px] text-center" 
                      style={{ transform: `skewY(${90 - (360 / Math.min(restaurants.length, 8))}deg) rotate(${(360 / Math.min(restaurants.length, 8)) / 2}deg) translate(15px, -15px)` }}>
                      {res.name.substring(0, 14)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button onClick={spinWheel} className="w-full py-5 bg-[#0A192F] text-white rounded-2xl font-black text-lg uppercase tracking-[0.3em] active:scale-95 transition-all shadow-2xl border border-white/5">
              {isSpinning ? 'SPINNING...' : 'PUSH TO SPIN'}
            </button>
            
            {result && !isSpinning && (
              <div className="mt-6 text-center animate-in zoom-in duration-300">
                <div className="text-2xl font-black uppercase text-white mb-4 tracking-tighter">{result.name}</div>
                <div className="flex justify-center gap-3">
                  <button onClick={spinWheel} className="px-5 py-2 border border-white/10 rounded-full text-[9px] font-black uppercase text-zinc-400">Re-roll</button>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${result.lat},${result.lon}`} target="_blank" rel="noreferrer" className="px-5 py-2 bg-white text-black rounded-full text-[9px] font-black uppercase">Maps</a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DISCOVER (HINGE SWIPE) TAB */}
        {activeTab === 'discover' && (
          <div className="pt-8 flex-grow flex flex-col items-center animate-in slide-in-from-bottom-8">
            <div className="w-full aspect-[3/4] bg-[#020C1B] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-center text-center shadow-2xl relative overflow-hidden">
              {restaurants.length > 0 ? (
                <>
                  <p className="text-zinc-600 font-black text-[9px] mb-2 tracking-[0.5em] uppercase">{restaurants[0].cuisine}</p>
                  <h2 className="text-3xl font-black leading-tight mb-8 uppercase tracking-tighter text-white px-2">{restaurants[0].name}</h2>
                  <div className="flex gap-6 px-4 mt-auto">
                    <button onClick={() => setRestaurants(prev => prev.slice(1))} className="flex-1 py-6 bg-black border border-white/5 rounded-3xl text-2xl hover:bg-red-950/20 transition-colors">✕</button>
                    <button onClick={() => { 
                      if(!currentUser) return setShowAuth(true); 
                      setFavorites([...favorites, restaurants[0]]); 
                      setRestaurants(prev => prev.slice(1));
                    }} className="flex-1 py-6 bg-[#0A192F] text-white rounded-3xl text-2xl font-black border border-white/10 hover:bg-blue-900/30 transition-colors">♥</button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-zinc-800 font-black tracking-widest text-xs uppercase">No more spots in {area}</div>
                  <button onClick={() => loadData(area)} className="text-[10px] font-black underline text-zinc-500 uppercase">Refresh List</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HEATMAP TAB */}
        {activeTab === 'heat' && (
           <div className="pt-6 animate-in fade-in">
             <h2 className="text-xl font-black mb-8 uppercase border-l-4 border-[#0A192F] pl-4 tracking-tighter">Live Heat</h2>
             {trending.map((item, idx) => (
               <div key={idx} className="mb-5">
                 <div className="flex justify-between items-end mb-2 px-1">
                   <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                   <span className="text-[8px] text-zinc-600 font-bold uppercase">{item.area}</span>
                 </div>
                 <div className="h-1.5 bg-[#020C1B] rounded-full overflow-hidden border border-white/5">
                   <div className="h-full bg-gradient-to-r from-[#0A192F] to-blue-500 transition-all duration-1000" style={{ width: `${item.score}%` }} />
                 </div>
               </div>
             ))}
           </div>
        )}

        {/* VAULT TAB */}
        {activeTab === 'profile' && (
          <div className="pt-6 h-[65vh] overflow-y-auto">
            <h2 className="text-xl font-black border-l-4 border-[#0A192F] pl-4 mb-8 uppercase tracking-tighter">The Vault</h2>
            {favorites.length > 0 ? favorites.map((f) => (
              <div key={f.id} className="flex justify-between items-center bg-[#020C1B] p-5 rounded-3xl mb-3 border border-white/5">
                <div>
                  <h4 className="font-black text-xs uppercase text-white">{f.name}</h4>
                  <p className="text-[8px] text-zinc-600 font-black tracking-widest uppercase">{f.cuisine}</p>
                </div>
                <button onClick={() => setFavorites(prev => prev.filter(it => it.id !== f.id))} className="text-[9px] font-black text-red-900/40 hover:text-red-600 transition-colors uppercase">Remove</button>
              </div>
            )) : (
              <div className="mt-20 text-center space-y-2">
                <p className="text-zinc-800 font-black uppercase text-[10px] tracking-[0.4em]">Vault Locked</p>
                <p className="text-[8px] text-zinc-900 uppercase font-bold">Save spots in Feed to unlock</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* NAV */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 px-10 py-5 bg-[#020C1B]/90 backdrop-blur-2xl border border-white/5 rounded-full z-40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
        {[{l: 'WHEEL', k: 'wheel'}, {l: 'FEED', k: 'discover'}, {l: 'HEAT', k: 'heat'}, {l: 'VAULT', k: 'profile'}].map((tab) => (
          <button key={tab.k} onClick={() => setActiveTab(tab.k)} className={`text-[8px] font-black tracking-[0.2em] transition-all ${activeTab === tab.k ? 'text-white scale-125' : 'text-zinc-700'}`}>
            {tab.l}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default spinTheWheel;