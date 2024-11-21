import React from 'react';
import { ExternalLink, Users, Globe } from 'lucide-react';
import RecentPosts from './RecentPosts';

interface Source {
  name: string;
  url: string;
  description: string;
  audience: string;
}

interface Post {
  title: string;
  url: string;
  content: string;
  date: string;
  suggestedResponse: string;
}

interface Analysis {
  targetDescription: string;
  painPoints: string[];
  sources?: Source[];
  recentPosts: Post[];
}

interface ResultsListProps {
  analysis: Analysis;
  onRegenerateResponse?: (postIndex: number) => Promise<string>;
}

const ResultsList: React.FC<ResultsListProps> = ({ analysis, onRegenerateResponse }) => {
  return (
    <div className="mt-8 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Analyse de la cible</h2>
        <p className="text-gray-600">{analysis.targetDescription}</p>

        {analysis.painPoints && analysis.painPoints.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Points de douleur identifiés</h3>
            <ul className="space-y-2">
              {analysis.painPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span className="text-gray-600">{point}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {analysis.sources && analysis.sources.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sources recommandées</h2>
          <div className="grid gap-4">
            {analysis.sources.map((source, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600" />
                    {source.name}
                  </h3>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visiter
                  </a>
                </div>
                <p className="text-gray-600 text-sm mb-2">{source.description}</p>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{source.audience}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.recentPosts && analysis.recentPosts.length > 0 && (
        <RecentPosts 
          posts={analysis.recentPosts} 
          onRegenerateResponse={onRegenerateResponse}
        />
      )}
    </div>
  );
};

export default ResultsList;