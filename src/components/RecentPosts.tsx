import React, { useState } from 'react';
import { MessageCircle, Copy, Check, Calendar, ExternalLink, RefreshCw } from 'lucide-react';

interface Post {
  title: string;
  url: string;
  content: string;
  date: string;
  suggestedResponse: string;
}

interface RecentPostsProps {
  posts: Post[];
  onRegenerateResponse?: (postIndex: number) => Promise<string>;
}

const RecentPosts: React.FC<RecentPostsProps> = ({ posts, onRegenerateResponse }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [responses, setResponses] = useState<string[]>(posts.map(p => p.suggestedResponse));

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = async (index: number) => {
    if (!onRegenerateResponse) return;
    
    setRegeneratingIndex(index);
    try {
      const newResponse = await onRegenerateResponse(index);
      const newResponses = [...responses];
      newResponses[index] = newResponse;
      setResponses(newResponses);
    } catch (error) {
      console.error('Erreur lors de la régénération:', error);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  return (
    <div className="mt-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-indigo-600" />
          Posts récents sans réponse
        </h2>

        <div className="space-y-6">
          {posts.map((post, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{post.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </span>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{post.content}</p>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Réponse suggérée</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRegenerate(index)}
                      disabled={regeneratingIndex === index || !onRegenerateResponse}
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${regeneratingIndex === index ? 'animate-spin' : ''}`} />
                      {regeneratingIndex === index ? 'Reformulation...' : 'Reformuler'}
                    </button>
                    <button
                      onClick={() => handleCopy(responses[index], index)}
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copier
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">
                  {responses[index]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentPosts;