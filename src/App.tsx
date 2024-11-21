import React, { useState, useEffect } from 'react';
import { Search, Target, Loader2 } from 'lucide-react';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import CostDisplay from './components/CostDisplay';
import LoadingBar from './components/LoadingBar';
import Preloader from './components/Preloader';
import { fetchRelevantFeeds } from './services/feedService';
import { analyzeKeywordAndFeeds, validateApiKey, regenerateResponse } from './services/gptService';

interface CostEstimate {
  tokens: number;
  cost: number;
}

interface AnalysisProgress {
  step: string;
  progress: number;
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<AnalysisProgress>({ step: '', progress: 0 });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !keyword) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!validateApiKey(apiKey)) {
      setError('La clé API doit commencer par "sk-"');
      return;
    }

    setIsLoading(true);
    setError('');
    setCostEstimate(null);
    setProgress({ step: 'Récupération des sources', progress: 10 });

    try {
      const feedItems = await fetchRelevantFeeds(keyword, location);
      const { data, cost } = await analyzeKeywordAndFeeds(
        apiKey, 
        keyword,
        location,
        feedItems,
        (progress) => setProgress(progress)
      );
      setAnalysis(data);
      setCostEstimate(cost);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'analyse. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      setProgress({ step: '', progress: 0 });
    }
  };

  const handleRegenerateResponse = async (postIndex: number) => {
    if (!analysis?.recentPosts?.[postIndex] || !apiKey) return '';

    const post = analysis.recentPosts[postIndex];
    try {
      const newResponse = await regenerateResponse(apiKey, post.title, post.content, location);
      return newResponse;
    } catch (error) {
      console.error('Erreur lors de la régénération:', error);
      throw error;
    }
  };

  if (isInitialLoading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {isLoading && <LoadingBar progress={progress.progress} />}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">ProspectFinder</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Trouvez vos prospects idéaux grâce à l'intelligence artificielle
          </p>
        </header>

        <SearchForm
          apiKey={apiKey}
          keyword={keyword}
          location={location}
          setApiKey={setApiKey}
          setKeyword={setKeyword}
          setLocation={setLocation}
          handleSearch={handleSearch}
          isLoading={isLoading}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {costEstimate && (
          <CostDisplay tokens={costEstimate.tokens} cost={costEstimate.cost} />
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 mt-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-gray-600">{progress.step}...</p>
            <div className="w-full max-w-md h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {analysis && (
          <ResultsList 
            analysis={analysis} 
            onRegenerateResponse={handleRegenerateResponse}
          />
        )}

        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Utilisez cette application de manière responsable et éthique.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;