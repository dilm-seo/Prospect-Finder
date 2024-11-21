import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface FeedItem {
  title: string;
  link: string;
  content: string;
  creator?: string;
  pubDate: string;
  formattedDate: string;
  source: string;
  relevanceScore?: number;
  category?: string;
  comments?: number;
  isQuestion?: boolean;
  location?: string;
}

// Sources françaises vérifiées et actives
const FEED_SOURCES = [
  {
    url: 'https://community.malt.com/feed',
    name: 'Malt Community',
    weight: 1.0,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://forum.freelance-republic.fr/feed',
    name: 'Freelance Republic Forum',
    weight: 1.0,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.freelance-info.fr/feed',
    name: 'Freelance Info',
    weight: 0.9,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.portail-autoentrepreneur.fr/feed',
    name: 'Portail Auto-Entrepreneur',
    weight: 0.9,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.federation-auto-entrepreneur.fr/feed',
    name: 'Fédération Auto-Entrepreneur',
    weight: 0.8,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.codeur.com/blog/feed/',
    name: 'Codeur.com Blog',
    weight: 0.9,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.freelance.com/blog/feed/',
    name: 'Freelance.com Blog',
    weight: 0.9,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.lecoindesentrepreneurs.fr/feed/',
    name: 'Le Coin des Entrepreneurs',
    weight: 0.8,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.netpme.fr/feed/',
    name: 'NetPME',
    weight: 0.7,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.journaldunet.com/management/direction-generale/rss/1/',
    name: 'Journal du Net Management',
    weight: 0.7,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.dynamique-mag.com/feed/',
    name: 'Dynamique Entrepreneuriale',
    weight: 0.7,
    type: 'rss',
    region: 'france'
  },
  {
    url: 'https://www.leblogdudirigeant.com/feed/',
    name: 'Le Blog du Dirigeant',
    weight: 0.7,
    type: 'rss',
    region: 'france'
  }
];

function extractContent(content: string): string {
  const div = document.createElement('div');
  div.innerHTML = content;
  
  // Nettoyer les scripts et styles
  const scripts = div.getElementsByTagName('script');
  const styles = div.getElementsByTagName('style');
  while (scripts[0]) scripts[0].parentNode?.removeChild(scripts[0]);
  while (styles[0]) styles[0].parentNode?.removeChild(styles[0]);
  
  // Nettoyer les URLs et autres métadonnées
  const text = div.textContent || div.innerText || '';
  return text
    .replace(/\[link\].*?\[comments\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/submitted by.*?to/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();
}

function detectQuestionPost(title: string, content: string): boolean {
  const questionIndicators = [
    '?', 'comment', 'conseil', 'aide', 'besoin', 'cherche',
    'recherche', 'question', 'avis', 'problème', 'solution',
    'svp', 'urgent', 'sos', 'qui peut', 'quelqu\'un', 'possible',
    'impossible', 'difficile', 'galère', 'souci', 'bug', 'erreur',
    'bloqué', 'help', 'conseil', 'astuce', 'débutant'
  ];
  
  const text = (title + ' ' + content).toLowerCase();
  
  // Vérifie la présence d'indicateurs de question
  const hasQuestionIndicator = questionIndicators.some(indicator => 
    text.includes(indicator.toLowerCase())
  );
  
  // Vérifie si le texte commence par un mot interrogatif
  const interrogativeWords = [
    'comment', 'pourquoi', 'quand', 'où', 'qui', 'que', 'quel',
    'quelle', 'quels', 'quelles', 'combien'
  ];
  const startsWithQuestion = interrogativeWords.some(word => 
    title.toLowerCase().startsWith(word)
  );
  
  // Vérifie la présence de points d'interrogation
  const hasQuestionMark = text.includes('?');
  
  return hasQuestionIndicator || startsWithQuestion || hasQuestionMark;
}

function isLocationRelevant(sourceRegion: string, targetLocation: string): boolean {
  if (!targetLocation) return true;
  
  const location = targetLocation.toLowerCase();
  const region = sourceRegion.toLowerCase();
  
  // Correspondances géographiques françaises
  const frenchRegions = [
    'france', 'fr', 'french', 'français', 'ile-de-france', 'idf',
    'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'lille',
    'nantes', 'strasbourg', 'rennes', 'reims', 'nice', 'montpellier'
  ];
  
  return frenchRegions.some(r => location.includes(r)) && region === 'france';
}

async function fetchFeed(source: typeof FEED_SOURCES[0], targetLocation: string): Promise<FeedItem[]> {
  if (!isLocationRelevant(source.region, targetLocation)) {
    return [];
  }

  try {
    // Utilise un proxy CORS fiable
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(corsProxy + encodeURIComponent(source.url));
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    // Support pour RSS et Atom
    const isRSS = !!xml.querySelector('rss, channel');
    const isAtom = !!xml.querySelector('feed');
    
    let items: Element[] = [];
    if (isRSS) {
      items = Array.from(xml.querySelectorAll('item'));
    } else if (isAtom) {
      items = Array.from(xml.querySelectorAll('entry'));
    }

    return items.map(item => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || 
                  item.querySelector('link')?.getAttribute('href') || '';
      const content = item.querySelector('description, content\\:encoded, content')?.textContent || '';
      const creator = item.querySelector('dc\\:creator, author')?.textContent || '';
      const pubDate = item.querySelector('pubDate, published')?.textContent || '';
      
      const cleanContent = extractContent(content);
      const isQuestion = detectQuestionPost(title, cleanContent);
      const date = new Date(pubDate);

      return {
        title: title.trim(),
        link: link.trim(),
        content: cleanContent.substring(0, 300) + '...',
        creator: creator.trim(),
        pubDate: date.toISOString(),
        formattedDate: formatDistanceToNow(date, { addSuffix: true, locale: fr }),
        source: source.name,
        isQuestion,
        location: source.region
      };
    });
  } catch (error) {
    console.error(`Erreur flux ${source.name}:`, error);
    return [];
  }
}

function calculateRelevanceScore(item: FeedItem, keyword: string, location: string): number {
  const searchTerms = keyword.toLowerCase().split(' ');
  const content = `${item.title} ${item.content}`.toLowerCase();
  
  let score = 0;
  
  // Score basé sur les correspondances de mots-clés
  searchTerms.forEach(term => {
    const matches = (content.match(new RegExp(term, 'g')) || []).length;
    score += matches * 2;
  });
  
  // Bonus pour les correspondances dans le titre
  if (item.title.toLowerCase().includes(keyword.toLowerCase())) {
    score += 10;
  }
  
  // Score plus élevé pour les questions
  if (item.isQuestion) {
    score += 15;
  }
  
  // Bonus pour la correspondance géographique française
  if (location && item.location === 'france') {
    score *= 2;
  }
  
  // Bonus pour la récence
  const date = new Date(item.pubDate);
  const daysOld = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysOld <= 7) { // Contenu de moins d'une semaine
    score *= 2;
  } else if (daysOld <= 30) { // Contenu de moins d'un mois
    score *= (30 - daysOld) / 30;
  } else { // Contenu plus ancien
    score *= 0.1;
  }
  
  return score;
}

export async function fetchRelevantFeeds(keyword: string, location: string = ''): Promise<FeedItem[]> {
  try {
    const feedPromises = FEED_SOURCES.map(source => fetchFeed(source, location));
    const feedsResults = await Promise.allSettled(feedPromises);
    
    let allItems: FeedItem[] = [];
    
    feedsResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const items = result.value
          .map(item => ({
            ...item,
            relevanceScore: calculateRelevanceScore(item, keyword, location)
          }))
          .filter(item => 
            item.relevanceScore > 0 && 
            item.isQuestion && 
            new Date(item.pubDate).getTime() > Date.now() - (90 * 24 * 60 * 60 * 1000) // Max 90 jours
          );
        
        allItems = [...allItems, ...items];
      }
    });
    
    // Tri par pertinence et récence
    return allItems
      .sort((a, b) => {
        const scoreA = (a.relevanceScore || 0) + (new Date(a.pubDate).getTime() / 1000000000);
        const scoreB = (b.relevanceScore || 0) + (new Date(b.pubDate).getTime() / 1000000000);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  } catch (error) {
    console.error('Erreur flux RSS:', error);
    return [];
  }
}