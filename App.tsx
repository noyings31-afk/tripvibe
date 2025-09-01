import React, { useState, useCallback, useMemo } from 'react';
import { generateTravelGuide, generateItinerary, getRecentBlogPosts } from './services/geminiService';
import type { TravelGuide, Itinerary, BlogPost, WebSource } from './types';
import ResultCard from './components/ResultCard';
import BlogCard from './components/BlogCard';
import Loader from './components/Loader';
import Map from './components/Map';
import ItineraryCard from './components/ItineraryCard';

const App: React.FC = () => {
  const [location, setLocation] = useState('');
  const [travelData, setTravelData] = useState<TravelGuide | null>(null);
  const [blogData, setBlogData] = useState<{ posts: BlogPost[]; sources: WebSource[]; } | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isItineraryLoading, setIsItineraryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hoveredItemName, setHoveredItemName] = useState<string | null>(null);

  const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported by your browser."));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          reject(new Error("Could not get your location. Distances will not be shown."));
        }
      );
    });
  };

  const handleSearch = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location.trim()) {
      setError('여행지를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTravelData(null);
    setBlogData(null);
    setItinerary(null);
    setUserLocation(null);

    try {
      try {
        const coords = await getUserLocation();
        setUserLocation(coords);
      } catch (locationError: any) {
        console.warn(locationError.message);
      }
      
      const [guideResult, blogResult] = await Promise.allSettled([
        generateTravelGuide(location),
        getRecentBlogPosts(location),
      ]);

      if (guideResult.status === 'fulfilled') {
        setTravelData(guideResult.value);
      } else {
        console.error("Failed to generate travel guide:", guideResult.reason);
        throw new Error(guideResult.reason.message || "여행 정보를 가져오는 데 실패했습니다.");
      }

      if (blogResult.status === 'fulfilled') {
        setBlogData(blogResult.value);
      } else {
         console.warn("Could not fetch blog posts:", blogResult.reason);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  const handleGenerateItinerary = useCallback(async () => {
    if (!travelData) return;
    setIsItineraryLoading(true);
    setItinerary(null);
    setError(null);
    try {
      const generatedItinerary = await generateItinerary(travelData);
      setItinerary(generatedItinerary);
    } catch (err: any) {
       setError(err.message || '일정 생성에 실패했습니다.');
    } finally {
      setIsItineraryLoading(false);
    }
  }, [travelData]);
  
  const allLocations = useMemo(() => {
    if (!travelData) return [];
    
    const extract = (items: any[], category: string) => 
      items.map(item => ({...item, category}));

    return [
      ...extract(travelData.restaurants, '맛집'),
      ...extract(travelData.attractions, '즐길거리'),
      ...extract(travelData.accommodations, '숙소'),
      ...extract(travelData.photoSpots, '사진스폿'),
      ...extract(travelData.popularPlaces, '인기 장소'),
    ];
  }, [travelData]);


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col">
      <header className="bg-gradient-to-r from-pink-400 to-orange-300 p-8 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{backgroundImage: "url('https://picsum.photos/1920/1080?random=1&blur=2')"}}></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-stone-800 tracking-tight">여행바이브</h1>
          <p className="mt-4 text-lg text-orange-900/80">가고 싶은 곳을 입력하고 나만의 여행 바이브를 찾아보세요.</p>
          
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
            <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden p-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="예: 해운대, 경주, 제주도"
                className="w-full px-4 py-2 text-gray-700 focus:outline-none bg-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 disabled:bg-orange-300 disabled:cursor-not-allowed whitespace-nowrap"
                disabled={isLoading || isItineraryLoading}
              >
                {isLoading ? '검색중...' : '찾아보기'}
              </button>
            </div>
          </form>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-8 max-w-7xl flex-grow">
        {isLoading && <Loader />}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center my-4" role="alert">
            <strong className="font-bold">오류: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {travelData && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-8">
               {blogData && blogData.posts.length > 0 && <BlogCard posts={blogData.posts} sources={blogData.sources} />}
               {travelData.restaurants.length > 0 && <ResultCard category="맛집" items={travelData.restaurants} userLocation={userLocation} setHoveredItemName={setHoveredItemName} />}
               {travelData.attractions.length > 0 && <ResultCard category="즐길거리" items={travelData.attractions} userLocation={userLocation} setHoveredItemName={setHoveredItemName} />}
               {travelData.accommodations.length > 0 && <ResultCard category="숙소" items={travelData.accommodations} userLocation={userLocation} setHoveredItemName={setHoveredItemName} />}
               {travelData.photoSpots.length > 0 && <ResultCard category="사진스폿" items={travelData.photoSpots} userLocation={userLocation} setHoveredItemName={setHoveredItemName} />}
               {travelData.popularPlaces.length > 0 && <ResultCard category="인기 장소" items={travelData.popularPlaces} userLocation={userLocation} setHoveredItemName={setHoveredItemName} />}
            </div>
            <div className="lg:col-span-2 relative">
              <div className="sticky top-8">
                 <div className="mb-6 text-center">
                    <button 
                      onClick={handleGenerateItinerary}
                      disabled={isItineraryLoading}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 disabled:bg-teal-300 shadow-lg w-full"
                    >
                      {isItineraryLoading ? "AI 코스 생성중..." : "✨ AI 1일 코스 추천"}
                    </button>
                  </div>
                
                {itinerary && <ItineraryCard itinerary={itinerary} />}
                
                <Map locations={allLocations} hoveredItemName={hoveredItemName} />
              </div>
            </div>
          </div>
        )}

        {!isLoading && !travelData && !error && (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-xl font-medium text-gray-900">어디로 떠나볼까요?</h3>
            <p className="mt-1 text-base text-gray-500">위 검색창에 원하는 장소를 입력하여 여행 계획을 시작하세요.</p>
          </div>
        )}
      </main>
      <footer className="text-center md:text-right py-4 px-8 text-xs text-gray-500">
        <p>Created by OVE9</p>
      </footer>
    </div>
  );
};

export default App;