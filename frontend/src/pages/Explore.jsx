import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { BottomNav } from '../components/BottomNav';

import { demoProblems, demoNews } from '../data/exploreDemoData';

const fallbackLiveNews = {
  'BBC': [
    { id: 'bbc-fb-1', title: 'Global Climate Summit Reaches Historic Agreement on Emissions', source: 'BBC', time: 'Today', description: 'World leaders have agreed on a binding pact to reduce carbon emissions by 45% by 2030.', link: 'https://bbc.com', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop' },
    { id: 'bbc-fb-2', title: 'Deep Ocean Exploration Reveals Dozens of New Species', source: 'BBC', time: 'Yesterday', description: 'A marine expedition in the Mariana Trench has discovered previously unknown sea creatures.', link: 'https://bbc.com', image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?q=80&w=600&auto=format&fit=crop' },
    { id: 'bbc-fb-3', title: 'NASA Mars Rover Discovers Evidence of Ancient Lake Bed', source: 'BBC', time: '2 days ago', description: 'The Perseverance rover has sent back data indicating a massive water body existed in Jezero Crater.', link: 'https://bbc.com', image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=600&auto=format&fit=crop' }
  ],
  'NYT': [
    { id: 'nyt-fb-1', title: 'The Future of Remote Work: A Post-Pandemic Analysis', source: 'NYT', time: 'Today', description: 'A comprehensive study shows hybrid models are here to stay, reshaping commercial real estate.', link: 'https://nytimes.com', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop' },
    { id: 'nyt-fb-2', title: 'Electric Vehicle Sales Surpass Gasoline Cars in European Markets', source: 'NYT', time: 'Yesterday', description: 'EV adoption accelerates faster than projected, backed by government incentives.', link: 'https://nytimes.com', image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=600&auto=format&fit=crop' },
    { id: 'nyt-fb-3', title: 'Artificial Intelligence in Medicine: Hype vs Reality', source: 'NYT', time: '3 days ago', description: 'AI diagnostic tools show promise but face regulatory and integration hurdles in hospitals.', link: 'https://nytimes.com', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop' }
  ],
  'India Today': [
    { id: 'it-fb-1', title: 'India Launches Next-Generation Weather Satellite Successfully', source: 'India Today', time: 'Today', description: 'ISRO placed the INSAT-3DS satellite into orbit, boosting weather forecasting capabilities.', link: 'https://indiatoday.in', image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop' },
    { id: 'it-fb-2', title: 'New Semiconductor Plant Approved in Gujarat with Massive Subsidy', source: 'India Today', time: 'Yesterday', description: 'The government greenlights a multi-billion dollar fabrication plant to boost local manufacturing.', link: 'https://indiatoday.in', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop' },
    { id: 'it-fb-3', title: 'National Chess Championship: Young Grandmaster Claims Title', source: 'India Today', time: '2 days ago', description: 'An 18-year-old prodigy wins the tournament in a dramatic final round match.', link: 'https://indiatoday.in', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop' }
  ]
};

export const Explore = () => {
  const navigate = useNavigate();
  const [newsData, setNewsData] = useState([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  const [liveNewsData, setLiveNewsData] = useState([]);
  const [isLoadingLiveNews, setIsLoadingLiveNews] = useState(true);
  const [selectedLiveSource, setSelectedLiveSource] = useState('BBC');
  const [liveNewsCache, setLiveNewsCache] = useState({});
  const liveSources = ['BBC', 'NYT', 'India Today'];

  const [sihProblems, setSihProblems] = useState([]);
  const [indiaInnovateProblems, setIndiaInnovateProblems] = useState([]);
  const [startupIndiaProblems, setStartupIndiaProblems] = useState([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoadingNews(true);
      setIsLoadingLiveNews(true);
      setIsLoadingProblems(true);

      try {
        const [newsRes, bbcRes, nytRes, itRes, sihRes, innovateRes, startupRes] = await Promise.all([
          apiClient.get('/news').catch(() => null),
          apiClient.get('/news/live?source=BBC').catch(() => null),
          apiClient.get('/news/live?source=NYT').catch(() => null),
          apiClient.get('/news/live?source=India Today').catch(() => null),
          apiClient.get('/problems?category=SIH').catch(() => null),
          apiClient.get('/problems?category=India Innovate').catch(() => null),
          apiClient.get('/problems?category=Startup India').catch(() => null)
        ]);

        // 1. Tech News
        if (newsRes && newsRes.data && newsRes.data.length > 0) {
          setNewsData(newsRes.data);
        } else {
          setNewsData(demoNews);
        }

        // 2. Live Top Stories Cache
        const cache = {};
        if (bbcRes && bbcRes.data && bbcRes.data.length > 0) cache['BBC'] = bbcRes.data;
        if (nytRes && nytRes.data && nytRes.data.length > 0) cache['NYT'] = nytRes.data;
        if (itRes && itRes.data && itRes.data.length > 0) cache['India Today'] = itRes.data;
        setLiveNewsCache(cache);

        // Set initial live news display from cache or fallbacks
        setLiveNewsData(cache[selectedLiveSource] || fallbackLiveNews[selectedLiveSource] || []);

        // 3. Problem Statements
        setSihProblems(sihRes && sihRes.data && sihRes.data.length > 0 ? sihRes.data : demoProblems.slice(0, 7));
        setIndiaInnovateProblems(innovateRes && innovateRes.data && innovateRes.data.length > 0 ? innovateRes.data : demoProblems.slice(7, 14));
        setStartupIndiaProblems(startupRes && startupRes.data && startupRes.data.length > 0 ? startupRes.data : demoProblems.slice(14, 20));

      } catch (error) {
        console.error("Failed to pre-load explore page data", error);
        setNewsData(demoNews);
        setLiveNewsData(fallbackLiveNews[selectedLiveSource] || []);
        setSihProblems(demoProblems.slice(0, 7));
        setIndiaInnovateProblems(demoProblems.slice(7, 14));
        setStartupIndiaProblems(demoProblems.slice(14, 20));
      } finally {
        setIsLoadingNews(false);
        setIsLoadingLiveNews(false);
        setIsLoadingProblems(false);
      }
    };

    loadAllData();
  }, []);

  useEffect(() => {
    // Prevent triggering a separate fetch if the page is still performing the initial pre-load
    if (isLoadingLiveNews) return;

    const revalidateLiveNews = async () => {
      const cached = liveNewsCache[selectedLiveSource];
      if (cached) {
        setLiveNewsData(cached);
      } else {
        setLiveNewsData(fallbackLiveNews[selectedLiveSource] || []);
      }

      try {
        const response = await apiClient.get(`/news/live?source=${selectedLiveSource}`);
        if (response.data && response.data.length > 0) {
          setLiveNewsData(response.data);
          setLiveNewsCache(prev => ({ ...prev, [selectedLiveSource]: response.data }));
        }
      } catch (error) {
        console.error("Failed to load live news", error);
      }
    };
    revalidateLiveNews();
  }, [selectedLiveSource]);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--color-background)] rounded-full transition-colors active:scale-95">
            <span className="material-symbols-outlined text-[var(--color-text-primary)]">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">Explore Ideas</h1>
        </div>
      </div>

      <div className="w-full max-w-[94vw] 2xl:max-w-[1550px] mx-auto py-6 px-3 md:px-[22px] space-y-8">
        {/* Tech Daily News */}
        <section>
          <div className="flex items-center justify-between mb-4 mt-2 pr-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">newspaper</span>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Tech Daily News</h2>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 pt-2">
            {isLoadingNews ? (
              [1, 2, 3].map(n => (
                <div key={n} className="snap-center shrink-0 w-[85vw] md:w-[320px] lg:w-[380px] bg-[var(--color-card)] rounded-xl shadow-sm flex flex-col overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-[var(--color-border)] opacity-50"></div>
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div className="h-6 bg-[var(--color-border)] rounded w-3/4 opacity-50"></div>
                    <div className="h-4 bg-[var(--color-border)] rounded w-1/2 opacity-50"></div>
                    <div className="h-16 bg-[var(--color-border)] rounded w-full mt-auto opacity-50"></div>
                  </div>
                </div>
              ))
            ) : (
              newsData.map(news => (
                <a href={news.link || '#'} target="_blank" rel="noopener noreferrer" key={news.id} className="snap-center shrink-0 w-[85vw] md:w-[320px] lg:w-[380px] bg-[var(--color-card)] rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col overflow-hidden">
                  {/* Image Header */}
                  <div className="w-full h-48 bg-[var(--color-background)] overflow-hidden">
                    <img 
                      src={news.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop'} 
                      alt={news.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                      {news.title}
                    </h3>
                    <div className="flex items-center text-xs text-[var(--color-text-secondary)] mb-3 font-medium">
                      <span className="material-symbols-outlined text-[14px] mr-1">calendar_today</span>
                      {news.time}
                      <span className="mx-2">•</span>
                      <span>By {news.author || news.source}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed mt-auto">
                      {news.description || 'Click to read the full article and stay updated with the latest in tech.'}
                    </p>
                  </div>
                </a>
              ))
            )}
          </div>
        </section>

        {/* Live General News */}
        <section>
          <div className="flex items-center justify-between mb-3 mt-8 pr-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">public</span>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Live Top Stories</h2>
            </div>
          </div>

          {/* Source Tabs */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
            {liveSources.map(src => (
              <button
                key={src}
                onClick={() => setSelectedLiveSource(src)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedLiveSource === src
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                  }`}
              >
                {src}
              </button>
            ))}
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4">
            {isLoadingLiveNews ? (
              [1, 2, 3].map(n => (
                <div key={n} className="snap-center shrink-0 w-[85vw] md:w-[320px] lg:w-[380px] bg-[var(--color-card)] rounded-xl shadow-sm flex flex-col overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-[var(--color-border)] opacity-50"></div>
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div className="h-6 bg-[var(--color-border)] rounded w-3/4 opacity-50"></div>
                    <div className="h-4 bg-[var(--color-border)] rounded w-1/2 opacity-50"></div>
                    <div className="h-16 bg-[var(--color-border)] rounded w-full mt-auto opacity-50"></div>
                  </div>
                </div>
              ))
            ) : liveNewsData.length > 0 ? (
              liveNewsData.map(news => (
                <a href={news.link || '#'} target="_blank" rel="noopener noreferrer" key={news.id || news.link} className="snap-center shrink-0 w-[85vw] md:w-[320px] lg:w-[380px] bg-[var(--color-card)] rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col overflow-hidden">
                  {/* Image Header */}
                  <div className="w-full h-48 bg-[var(--color-background)] overflow-hidden">
                    <img 
                      src={news.image || 'https://images.unsplash.com/photo-1495020689067-958852a6565d?q=80&w=600&auto=format&fit=crop'} 
                      alt={news.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1495020689067-958852a6565d?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                      {news.title}
                    </h3>
                    <div className="flex items-center text-xs text-[var(--color-text-secondary)] mb-3 font-medium">
                      <span className="material-symbols-outlined text-[14px] mr-1">calendar_today</span>
                      {news.time}
                      <span className="mx-2">•</span>
                      <span>By {news.author || news.source}</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed mt-auto">
                      {news.description || 'Click to read the full article and stay updated with the latest news.'}
                    </p>
                  </div>
                </a>
              ))
            ) : (
              <div className="w-full py-8 text-center text-[var(--color-text-secondary)] text-sm">
                No articles found right now.
              </div>
            )}
          </div>
        </section>

        {/* SIH Problem Statements */}
        <section>
          <div className="flex items-center justify-between mb-4 mt-8 pr-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">lightbulb</span>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Smart India Hackathon</h2>
            </div>
            <a href="https://www.sih.gov.in/sih2023PS" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 group">
              View More <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 pt-2">
            {isLoadingProblems ? (
              [1, 2, 3].map(n => (
                <div key={n} className="snap-center shrink-0 w-[85vw] md:w-[300px] lg:w-[350px] bg-[var(--color-card)] rounded-3xl p-5 border border-[var(--color-border)] shadow-sm animate-pulse flex flex-col justify-between h-48">
                  <div className="h-4 bg-[var(--color-border)] rounded w-1/3 opacity-50 mb-4"></div>
                  <div className="h-6 bg-[var(--color-border)] rounded w-3/4 opacity-50 mb-2"></div>
                  <div className="h-16 bg-[var(--color-border)] rounded w-full opacity-50"></div>
                </div>
              ))
            ) : sihProblems.map(prob => (
              <a href={prob.link || 'https://www.sih.gov.in/sih2023PS'} target="_blank" rel="noopener noreferrer" key={prob.id} className="snap-center shrink-0 w-[85vw] md:w-[300px] lg:w-[350px] bg-[var(--color-card)] rounded-3xl p-5 border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)] transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{prob.org}</div>
                    {prob.psNumber && (
                      <div className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2 py-0.5 rounded-full">{prob.psNumber}</div>
                    )}
                  </div>
                  {prob.category && (
                    <div className="text-[11px] font-semibold text-[var(--color-primary)] mb-2 opacity-80">{prob.category}</div>
                  )}
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] leading-tight mb-2 group-hover:text-[var(--color-primary)] transition-colors">{prob.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed line-clamp-3">{prob.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {prob.tags.map(tag => (
                    <span key={tag} className="bg-[var(--color-background)] text-[var(--color-text-primary)] border border-[var(--color-border)] px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">{tag}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* India Innovate Problem Statements */}
        <section>
          <div className="flex items-center justify-between mb-4 mt-8 pr-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">emoji_objects</span>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">India Innovate</h2>
            </div>
            <a href="https://innovateindia.mygov.in/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 group">
              View More <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 pt-2">
            {isLoadingProblems ? (
              [1, 2, 3].map(n => (
                <div key={n} className="snap-center shrink-0 w-[85vw] md:w-[300px] lg:w-[350px] bg-[var(--color-card)] rounded-3xl p-5 border border-[var(--color-border)] shadow-sm animate-pulse flex flex-col justify-between h-48">
                  <div className="h-4 bg-[var(--color-border)] rounded w-1/3 opacity-50 mb-4"></div>
                  <div className="h-6 bg-[var(--color-border)] rounded w-3/4 opacity-50 mb-2"></div>
                  <div className="h-16 bg-[var(--color-border)] rounded w-full opacity-50"></div>
                </div>
              ))
            ) : indiaInnovateProblems.map(prob => (
              <a href={prob.link || 'https://innovateindia.mygov.in/'} target="_blank" rel="noopener noreferrer" key={prob.id} className="snap-center shrink-0 w-[85vw] md:w-[300px] lg:w-[350px] bg-[var(--color-card)] rounded-3xl p-5 border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)] transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{prob.org}</div>
                    {prob.psNumber && (
                      <div className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2 py-0.5 rounded-full">{prob.psNumber}</div>
                    )}
                  </div>
                  {prob.category && (
                    <div className="text-[11px] font-semibold text-[var(--color-primary)] mb-2 opacity-80">{prob.category}</div>
                  )}
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] leading-tight mb-2 group-hover:text-[var(--color-primary)] transition-colors">{prob.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed line-clamp-3">{prob.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {prob.tags.map(tag => (
                    <span key={tag} className="bg-[var(--color-background)] text-[var(--color-text-primary)] border border-[var(--color-border)] px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">{tag}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Startup India Problem Statements */}
        <section>
          <div className="flex items-center justify-between mb-4 mt-8 pr-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">rocket_launch</span>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Startup India</h2>
            </div>
            <a href="https://www.startupindia.gov.in/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 group">
              View More <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4 pt-2">
            {isLoadingProblems ? (
              [1, 2, 3].map(n => (
                <div key={n} className="snap-center shrink-0 w-[85vw] md:w-[300px] lg:w-[350px] bg-[var(--color-card)] rounded-3xl p-5 border border-[var(--color-border)] shadow-sm animate-pulse flex flex-col justify-between h-48">
                  <div className="h-4 bg-[var(--color-border)] rounded w-1/3 opacity-50 mb-4"></div>
                  <div className="h-6 bg-[var(--color-border)] rounded w-3/4 opacity-50 mb-2"></div>
                  <div className="h-16 bg-[var(--color-border)] rounded w-full opacity-50"></div>
                </div>
              ))
            ) : startupIndiaProblems.map(prob => (
              <a href={prob.link || 'https://www.startupindia.gov.in/'} target="_blank" rel="noopener noreferrer" key={prob.id} className="snap-center shrink-0 w-[85vw] md:w-[300px] lg:w-[350px] bg-[var(--color-card)] rounded-3xl p-5 border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)] transition-colors cursor-pointer group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">{prob.org}</div>
                    {prob.psNumber && (
                      <div className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-2 py-0.5 rounded-full">{prob.psNumber}</div>
                    )}
                  </div>
                  {prob.category && (
                    <div className="text-[11px] font-semibold text-[var(--color-primary)] mb-2 opacity-80">{prob.category}</div>
                  )}
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] leading-tight mb-2 group-hover:text-[var(--color-primary)] transition-colors">{prob.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed line-clamp-3">{prob.desc}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {prob.tags.map(tag => (
                    <span key={tag} className="bg-[var(--color-background)] text-[var(--color-text-primary)] border border-[var(--color-border)] px-2 py-1 rounded-md text-[10px] font-bold shadow-sm">{tag}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};
