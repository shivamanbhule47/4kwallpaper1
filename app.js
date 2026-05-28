import { supabaseClient } from './supabase.js';

const { useState, useEffect, useRef } = React;

const CATEGORIES = ["All", "Minimalist", "Dark Mode", "AMOLED", "Anime", "Cyberpunk", "Nature", "Abstract", "Vector"];

export default function App() {
    const [wallpapers, setWallpapers] = useState([]);
    const [currentTab, setCurrentTab] = useState('home'); // home, trending, downloads
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [savedDownloads, setSavedDownloads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    // Dynamic Server Repository Query Processing
    const fetchWallpapers = async (search = '', category = 'All', tab = 'home', append = false) => {
        setLoading(true);
        let query = supabaseClient.from('wallpapers').select('*');

        if (search) {
            query = query.ilike('title', `%${search}%`);
        }
        if (category !== 'All') {
            query = query.eq('category', category);
        }

        // Sorting Algorithms simulating YouTube's UI Feed Architecture
        if (tab === 'trending') {
            query = query.order('views', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Pagination layout limit calculation
        const itemsPerPage = 12;
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        if (!error && data) {
            if (tab === 'downloads') {
                const localSaved = JSON.parse(localStorage.getItem('downloads') || '[]');
                const filteredData = data.filter(w => localSaved.includes(w.id));
                setWallpapers(append ? [...wallpapers, ...filteredData] : filteredData);
            } else {
                setWallpapers(append ? [...wallpapers, ...data] : data);
            }
        }
        setLoading(false);
    };

    // Trigger state reset across criteria updates
    useEffect(() => {
        setPage(1);
        fetchWallpapers(searchQuery, selectedCategory, currentTab, false);
        setSavedDownloads(JSON.parse(localStorage.getItem('downloads') || '[]'));
    }, [selectedCategory, currentTab]);

    // Handle Infinite Scrolling Pagination extensions
    useEffect(() => {
        if (page > 1) {
            fetchWallpapers(searchQuery, selectedCategory, currentTab, true);
        }
    }, [page]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 && !loading) {
                setPage(prev => prev + 1);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchWallpapers(searchQuery, selectedCategory, currentTab, false);
    };

    const triggerDownload = async (wallpaper) => {
        // Increment analytics indicators inside database
        await supabaseClient.rpc('increment_downloads', { row_id: wallpaper.id });
        await supabaseClient.from('wallpapers').update({ views: (wallpaper.views || 0) + 1 }).eq('id', wallpaper.id);

        let tracks = JSON.parse(localStorage.getItem('downloads') || '[]');
        if (!tracks.includes(wallpaper.id)) {
            tracks.push(wallpaper.id);
            localStorage.setItem('downloads', JSON.stringify(tracks));
            setSavedDownloads(tracks);
        }

        // Direct high-resolution asset stream download pipeline execution
        const res = await fetch(wallpaper.image_url);
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${wallpaper.slug}-4k-wallpaper.jpg`;
        link.click();
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* FIXED YOUTUBE HEADER APPARATUS */}
            <header className="h-14 bg-pureBlack border-b border-zinc-800 flex items-center justify-between px-4 sticky top-0 z-50">
                <div className="flex items-center space-x-4">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-zinc-800 rounded-full transition">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </button>
                    <a href="#" onClick={() => { setCurrentTab('home'); setSelectedCategory('All'); }} className="text-xl font-black tracking-tighter uppercase font-mono border-b-2 border-white select-none">
                        4KWALLPATEER
                    </a>
                </div>

                {/* CENTRALIZED GOOGLE-OPTIMIZED SEARCH CONTAINER */}
                <form onSubmit={handleSearchSubmit} className="flex items-center w-full max-w-xl mx-4">
                    <div className="flex w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden focus-within:border-zinc-500 transition">
                        <input 
                            type="text" 
                            placeholder="Search high resolution 4K wallpapers..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent px-5 py-1.5 text-sm text-white focus:outline-none placeholder-zinc-500"
                        />
                        <button type="submit" className="bg-zinc-800 border-l border-zinc-800 px-6 py-1.5 hover:bg-zinc-700 transition">
                            <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </button>
                    </div>
                </form>

                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 text-white flex items-center justify-center font-bold text-xs select-none">A</div>
            </header>

            <div className="flex flex-1">
                {/* DYNAMIC COLLAPSIBLE YOUTUBE-STYLE SIDEBAR */}
                <aside className={`${sidebarOpen ? 'w-64' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'} transition-all duration-200 bg-pureBlack border-r border-zinc-900 flex flex-col pt-3 fixed md:sticky top-14 h-[calc(100vh-56px)] overflow-y-auto z-40`}>
                    <nav className="space-y-1 px-2">
                        <button onClick={() => setCurrentTab('home')} className={`w-full flex ${sidebarOpen ? 'flex-row space-x-5 items-center' : 'flex-col items-center justify-center space-y-1 py-3'} px-4 py-2.5 rounded-xl text-sm font-medium transition ${currentTab === 'home' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                            <span className={sidebarOpen ? "text-sm" : "text-[10px]"}>Home</span>
                        </button>

                        <button onClick={() => setCurrentTab('trending')} className={`w-full flex ${sidebarOpen ? 'flex-row space-x-5 items-center' : 'flex-col items-center justify-center space-y-1 py-3'} px-4 py-2.5 rounded-xl text-sm font-medium transition ${currentTab === 'trending' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                            <span className={sidebarOpen ? "text-sm" : "text-[10px]"}>Trending</span>
                        </button>

                        <button onClick={() => setCurrentTab('downloads')} className={`w-full flex ${sidebarOpen ? 'flex-row space-x-5 items-center' : 'flex-col items-center justify-center space-y-1 py-3'} px-4 py-2.5 rounded-xl text-sm font-medium transition ${currentTab === 'downloads' ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            <span className={sidebarOpen ? "text-sm" : "text-[10px]"}>Library</span>
                        </button>
                    </nav>
                </aside>

                {/* FEED AREA CONTAINER */}
                <main className="flex-1 min-w-0 px-6 py-4">
                    {/* HORIZONTAL CATEGORY PILLS BAR */}
                    <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-4 sticky top-14 bg-pureBlack z-30">
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition duration-150 whitespace-nowrap ${selectedCategory === cat ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* LIQUID MASONRY IMAGE MATRIX */}
                    <div className="masonry-grid mt-4">
                        {wallpapers.map(wall => (
                            <div key={wall.id} className="masonry-item bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden group hover:border-zinc-600 transition duration-300 flex flex-col">
                                <div className="relative overflow-hidden bg-zinc-950">
                                    {/* Native optimized SEO lazy-load configuration image tag */}
                                    <img 
                                        src={wall.image_url} 
                                        alt={`${wall.title} - Ultra 4K Wallpaper Setup`} 
                                        loading="lazy" 
                                        className="w-full h-auto object-cover transform group-hover:scale-[1.015] transition duration-500"
                                    />
                                </div>
                                <div className="p-4 flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center font-mono font-black text-[10px] border border-zinc-700 text-zinc-300">4K</div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-sm font-bold text-white tracking-tight truncate uppercase">{wall.title}</h2>
                                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{wall.category} Original Setup</p>
                                        <div className="text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-wide">
                                            <span>{wall.views || 0} views</span> • <span>Original Post</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 pb-4">
                                    <button 
                                        onClick={() => triggerDownload(wall)}
                                        className="w-full py-2 bg-white text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                        <span>Download Ultra 4K</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {loading && (
                        <div className="text-zinc-500 text-xs mt-8 text-center uppercase tracking-widest font-mono animate-pulse">Syncing dynamic asset arrays...</div>
                    )}

                    {!loading && wallpapers.length === 0 && (
                        <div className="text-zinc-600 text-xs mt-12 text-center py-24 border border-dashed border-zinc-800 rounded-xl uppercase tracking-widest font-mono">
                            No wall records located within system criteria.
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
