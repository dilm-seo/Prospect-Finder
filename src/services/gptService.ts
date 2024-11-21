import OpenAI from 'openai';
import type { FeedItem } from './feedService';

interface CostEstimate {
  tokens: number;
  cost: number;
}

interface AnalysisProgress {
  step: string;
  progress: number;
}

const COST_PER_1K_TOKENS = 0.002;

export function validateApiKey(apiKey: string): boolean {
  return apiKey.startsWith('sk-');
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function calculateCost(tokens: number): number {
  return (tokens / 1000) * COST_PER_1K_TOKENS;
}

export async function getSuggestions(apiKey: string, input: string): Promise<string[]> {
  if (!input.trim() || !validateApiKey(apiKey)) return [];

  const openai = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en prospection B2B. Suggère 5 variations ou compléments pertinents du terme de recherche fourni, séparés par des virgules.'
        },
        {
          role: 'user',
          content: `Suggère des termes de recherche similaires ou complémentaires à : "${input}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const suggestions = completion.choices[0].message.content
      ?.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .slice(0, 5) || [];

    return suggestions;
  } catch (error) {
    console.error('Erreur suggestions:', error);
    return [];
  }
}

export async function analyzeKeywordAndFeeds(
  apiKey: string,
  keyword: string,
  location: string,
  feedItems: FeedItem[],
  onProgress?: (progress: AnalysisProgress) => void
): Promise<{ data: any, cost: CostEstimate }> {
  const openai = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true
  });

  const updateProgress = (step: string, progress: number) => {
    onProgress?.({ step, progress });
  };

  updateProgress("Analyse du contexte", 20);

  const systemPrompt = `Tu es un expert freelance qui aide d'autres freelances avec leurs problèmes quotidiens.
Tu dois analyser uniquement les questions fournies et identifier :

1. Le profil précis du freelance (domaine, expérience, situation)
2. Le problème spécifique et son contexte
3. Les points de douleur sous-jacents
4. Les besoins immédiats et à long terme

Pour chaque question, fournis une réponse :
- Naturelle et amicale, comme si tu parlais à un collègue
- Qui montre que tu comprends leur situation spécifique
- Avec un conseil concret et applicable immédiatement
- Qui inclut subtilement ton expertise sans être trop commercial
- Qui se termine par une proposition d'aide discrète

Style de réponse :
- Utilise "tu" plutôt que "vous"
- Évite le langage trop formel
- Reste concis et direct
- Utilise des émojis avec modération (1-2 max)
- Termine par une question ouverte ou une proposition d'aide naturelle

IMPORTANT : 
- Ne génère PAS de fausses questions ou réponses
- Analyse UNIQUEMENT les questions fournies
- Si aucune question n'est fournie, indique-le clairement
- Prends en compte la localisation : ${location || 'non spécifiée'}`

  const userPrompt = `Analyse ces questions de freelances pour identifier précisément les profils et leurs besoins :

${JSON.stringify(feedItems, null, 2)}

Pour chaque question réelle fournie :
1. Une analyse détaillée du profil et du contexte
2. Les points de douleur identifiés
3. Une réponse prête à être utilisée, en texte brut, dans un style naturel et amical`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
    });

    updateProgress("Traitement des résultats", 90);

    const response = completion.choices[0].message.content;
    const tokens = completion.usage?.total_tokens || estimateTokens(systemPrompt + userPrompt + (response || ''));
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response || '{}');
    } catch (e) {
      const responseLines = (response || '').split('\n');
      parsedResponse = {
        targetDescription: responseLines.find(line => line.includes('Analyse')) || 'Analyse du problème',
        painPoints: responseLines
          .filter(line => line.includes('- '))
          .map(line => line.replace('- ', '')),
        recentPosts: feedItems.map((item, index) => {
          const itemStart = response?.indexOf(`Question ${index + 1}`) || -1;
          const itemEnd = response?.indexOf(`Question ${index + 2}`) || response?.length;
          const itemResponse = response?.substring(itemStart, itemEnd);
          
          return {
            title: item.title,
            url: item.link,
            content: item.content,
            date: item.formattedDate,
            suggestedResponse: itemResponse || 'Désolé, je n\'ai pas pu analyser cette question correctement.'
          };
        })
      };
    }

    updateProgress("Finalisation", 100);

    return {
      data: parsedResponse,
      cost: {
        tokens,
        cost: calculateCost(tokens)
      }
    };
  } catch (error: any) {
    console.error('Erreur OpenAI:', error);
    
    if (error?.status === 401) {
      throw new Error('Clé API invalide ou expirée. Vérifie ta clé.');
    } else if (error?.status === 429) {
      throw new Error('Limite de requêtes atteinte. Réessaie dans quelques minutes.');
    } else if (error?.status === 500) {
      throw new Error('Erreur du service OpenAI. Réessaie.');
    }
    
    throw error;
  }
}

export async function regenerateResponse(
  apiKey: string, 
  title: string, 
  content: string, 
  location: string = ''
): Promise<string> {
  const openai = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert freelance qui aide d'autres freelances${location ? ` de la région : ${location}` : ''}.
Analyse cette question et génère une réponse :
- Naturelle et amicale (tutoiement)
- Qui montre ta compréhension de leur situation
- Avec un conseil concret et applicable
- Qui inclut subtilement ton expertise
- Qui se termine par une proposition d'aide discrète

Style :
- Langage naturel, pas trop formel
- Concis et direct
- 1-2 émojis maximum
- Question ouverte ou proposition d'aide en conclusion`
        },
        {
          role: 'user',
          content: `Titre: ${title}\n\nContenu: ${content}\n\nGénère une nouvelle réponse avec un angle différent de la précédente.`
        }
      ],
      temperature: 0.8,
    });

    return completion.choices[0].message.content || 'Désolé, je n\'ai pas pu générer une nouvelle réponse.';
  } catch (error) {
    console.error('Erreur OpenAI:', error);
    throw error;
  }
}