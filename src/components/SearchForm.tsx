import React, { useState, useEffect, useRef } from 'react';
import { Search, Key, MapPin } from 'lucide-react';
import { getSuggestions } from '../services/gptService';
import useDebounce from '../hooks/useDebounce';

interface SearchFormProps {
  apiKey: string;
  keyword: string;
  location: string;
  setApiKey: (value: string) => void;
  setKeyword: (value: string) => void;
  setLocation: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({
  apiKey,
  keyword,
  location,
  setApiKey,
  setKeyword,
  setLocation,
  handleSearch,
  isLoading
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debouncedKeyword = useDebounce(keyword, 500);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedKeyword.length >= 3 && apiKey) {
        const newSuggestions = await getSuggestions(apiKey, debouncedKeyword);
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedKeyword, apiKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setKeyword(suggestion);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Clé API OpenAI
            </div>
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="sk-..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Mot-clé ou description
              </div>
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: problèmes de comptabilité freelance"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Localisation
              </div>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: France, Paris, Europe..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
        >
          Analyser
        </button>
      </div>
    </form>
  );
};

export default SearchForm;