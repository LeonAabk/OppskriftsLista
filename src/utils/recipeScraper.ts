import { Recipe, RecipeDifficulty } from '../types';

/**
 * Converts ISO 8601 duration strings (e.g., "PT30M", "PT1H15M", "PT40M", "P0DT0H20M0S") to total minutes.
 */
export function parseIsoDuration(durationStr?: string): number {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const match = durationStr.match(/P(?:([0-9]+)D)?T?(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?/i);
  if (!match) {
    const rawNumber = parseInt(durationStr, 10);
    return isNaN(rawNumber) ? 0 : rawNumber;
  }
  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  return days * 24 * 60 + hours * 60 + minutes;
}

/**
 * Decodes common HTML entities.
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Recursively searches a JSON-LD data structure for a Recipe object.
 */
function findRecipeInJsonLd(node: any): any | null {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof node === 'object') {
    const type = node['@type'] || node.type;
    const isRecipe =
      type === 'Recipe' ||
      (Array.isArray(type) && type.includes('Recipe')) ||
      (typeof type === 'string' && type.toLowerCase().endsWith('recipe'));

    if (isRecipe) {
      return node;
    }

    if (node['@graph']) {
      const found = findRecipeInJsonLd(node['@graph']);
      if (found) return found;
    }

    for (const key of Object.keys(node)) {
      if (typeof node[key] === 'object' && node[key] !== null) {
        const found = findRecipeInJsonLd(node[key]);
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Extracts cover image from JSON-LD or falls back to HTML open-graph tags.
 */
function extractCoverImage(recipeNode: any, html?: string): string {
  if (typeof recipeNode.image === 'string' && recipeNode.image.trim()) {
    return recipeNode.image.trim();
  }
  if (Array.isArray(recipeNode.image) && recipeNode.image.length > 0) {
    const firstImg = recipeNode.image[0];
    const url = typeof firstImg === 'string' ? firstImg : firstImg?.url || firstImg?.contentUrl || '';
    if (url.trim()) return url.trim();
  }
  if (recipeNode.image && typeof recipeNode.image === 'object') {
    const url = recipeNode.image.url || recipeNode.image.contentUrl || '';
    if (url.trim()) return url.trim();
  }

  // Fallback to og:image or twitter:image in the raw HTML
  if (html) {
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    if (ogMatch && ogMatch[1].trim()) return ogMatch[1].trim();

    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i);
    if (twitterMatch && twitterMatch[1].trim()) return twitterMatch[1].trim();
  }

  return '';
}

/**
 * Extracts and normalizes Recipe data from a JSON-LD object.
 */
function parseRecipeJsonLd(recipeNode: any, sourceUrl: string, html?: string): Partial<Recipe> {
  const title = decodeHtmlEntities(recipeNode.name || recipeNode.headline || 'Uten navn');
  const description = decodeHtmlEntities(recipeNode.description || '');
  const cover_image = extractCoverImage(recipeNode, html);

  // Prep time & cook time
  let prep_time_minutes = parseIsoDuration(recipeNode.prepTime);
  let cook_time_minutes = parseIsoDuration(recipeNode.cookTime);
  const total_time_minutes = parseIsoDuration(recipeNode.totalTime);

  if (total_time_minutes > 0) {
    if (prep_time_minutes === 0 && cook_time_minutes === 0) {
      prep_time_minutes = Math.round(total_time_minutes * 0.3);
      cook_time_minutes = total_time_minutes - prep_time_minutes;
    } else if (cook_time_minutes === 0 && prep_time_minutes > 0) {
      cook_time_minutes = Math.max(0, total_time_minutes - prep_time_minutes);
    }
  }

  // Servings / yield
  let servings = 4;
  if (recipeNode.recipeYield) {
    if (typeof recipeNode.recipeYield === 'number') {
      servings = recipeNode.recipeYield;
    } else if (typeof recipeNode.recipeYield === 'string') {
      const match = recipeNode.recipeYield.match(/([0-9]+)/);
      if (match) servings = parseInt(match[1], 10);
    } else if (Array.isArray(recipeNode.recipeYield) && recipeNode.recipeYield.length > 0) {
      const match = String(recipeNode.recipeYield[0]).match(/([0-9]+)/);
      if (match) servings = parseInt(match[1], 10);
    }
  }

  // Ingredients
  const rawIngredients = recipeNode.recipeIngredient || recipeNode.ingredients || [];
  const ingredients: { name: string }[] = [];
  if (Array.isArray(rawIngredients)) {
    for (const ing of rawIngredients) {
      if (typeof ing === 'string' && ing.trim()) {
        ingredients.push({ name: decodeHtmlEntities(ing) });
      }
    }
  }

  // Instructions
  const rawInstructions = recipeNode.recipeInstructions || [];
  const instructions: string[] = [];
  if (typeof rawInstructions === 'string') {
    const split = rawInstructions
      .split(/\r?\n+/)
      .map((s: string) => decodeHtmlEntities(s).trim())
      .filter(Boolean);
    instructions.push(...split);
  } else if (Array.isArray(rawInstructions)) {
    for (const step of rawInstructions) {
      if (typeof step === 'string' && step.trim()) {
        instructions.push(decodeHtmlEntities(step));
      } else if (step && typeof step === 'object') {
        if (step['@type'] === 'HowToSection' && Array.isArray(step.itemListElement)) {
          for (const sub of step.itemListElement) {
            const text = sub.text || sub.name || '';
            if (text.trim()) instructions.push(decodeHtmlEntities(text));
          }
        } else {
          const text = step.text || step.name || '';
          if (text.trim()) instructions.push(decodeHtmlEntities(text));
        }
      }
    }
  }

  // Category & tags
  const tags: string[] = [];
  let category: Recipe['category'] = 'Dinner';

  if (recipeNode.recipeCategory) {
    const catStr = Array.isArray(recipeNode.recipeCategory)
      ? recipeNode.recipeCategory.join(', ')
      : String(recipeNode.recipeCategory);
    tags.push(...catStr.split(',').map((s: string) => decodeHtmlEntities(s).trim()).filter(Boolean));

    const lower = catStr.toLowerCase();
    if (lower.includes('frokost') || lower.includes('breakfast')) category = 'Breakfast';
    else if (lower.includes('lunsj') || lower.includes('lunch')) category = 'Lunch';
    else if (lower.includes('dessert') || lower.includes('søtt')) category = 'Dessert';
    else if (lower.includes('bakst') || lower.includes('baking') || lower.includes('kake')) category = 'Baking';
    else if (lower.includes('vegan') || lower.includes('vegansk')) category = 'Vegan';
    else if (lower.includes('vegetar')) category = 'Vegetarian';
  }

  if (recipeNode.keywords) {
    const kwStr = Array.isArray(recipeNode.keywords)
      ? recipeNode.keywords.join(', ')
      : String(recipeNode.keywords);
    const splitKws = kwStr.split(',').map((s: string) => decodeHtmlEntities(s).trim()).filter(Boolean);
    for (const kw of splitKws) {
      if (!tags.includes(kw)) tags.push(kw);
    }
  }

  if (recipeNode.recipeCuisine) {
    const cuisine = String(recipeNode.recipeCuisine);
    tags.push(...cuisine.split(' ').filter(Boolean));
  }

  // Difficulty deduction
  let difficulty: RecipeDifficulty = 'Medium';
  const totalMins = Math.max(0, prep_time_minutes) + Math.max(0, cook_time_minutes);
  if (totalMins > 0 && totalMins <= 25 && instructions.length <= 6) {
    difficulty = 'Easy';
  } else if (totalMins >= 60 || instructions.length >= 10) {
    difficulty = 'Hard';
  }

  return {
    title,
    description,
    cover_image: cover_image || undefined,
    prep_time_minutes: Math.max(0, prep_time_minutes) || 15,
    cook_time_minutes: Math.max(0, cook_time_minutes) || 20,
    servings: servings > 0 ? servings : 4,
    difficulty,
    category,
    tags: tags.slice(0, 8),
    ingredients: ingredients.length > 0 ? ingredients : [{ name: 'Ingredienser (se originaloppskrift)' }],
    instructions: instructions.length > 0 ? instructions : ['Følg trinnene fra kilden.'],
    source_url: sourceUrl
  };
}

/**
 * Fetches HTML using multiple reliable proxies in order of speed and stability.
 */
async function fetchPageWithFallbacks(url: string): Promise<string> {
  // Strategy 1: Jina AI Reader with HTML return format (fast, CORS-enabled, handles modern SPAs)
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        'x-return-format': 'html'
      }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 100) {
        return text;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 2: AllOrigins JSON API
  try {
    const aoUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(aoUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.contents === 'string' && data.contents.length > 100) {
        return data.contents;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 3: CodeTabs CORS Proxy
  try {
    const ctUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(ctUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 100) {
        return text;
      }
    }
  } catch (e) {
    // Continue to next strategy
  }

  // Strategy 4: Direct fetch (for CORS-enabled sites)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 100) {
        return text;
      }
    }
  } catch (e) {
    // Continue
  }

  return '';
}

/**
 * Scrapes a recipe from any web URL.
 * Automatically tries JSON-LD schema first; falls back to Jina markdown parsing if needed.
 */
export async function scrapeRecipeFromUrl(rawUrl: string): Promise<Partial<Recipe>> {
  const url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Ugyldig URL. Husk å inkludere https:// (f.eks. https://www.matprat.no/oppskrifter/...)');
  }

  // 1. Fetch HTML using multi-tier proxy
  const html = await fetchPageWithFallbacks(url);

  if (html) {
    // Look for JSON-LD schema
    const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    let recipeData: any = null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      const scriptContent = match[1].trim();
      if (!scriptContent) continue;
      try {
        const parsed = JSON.parse(scriptContent);
        const found = findRecipeInJsonLd(parsed);
        if (found) {
          recipeData = found;
          break;
        }
      } catch {
        // Skip malformed script tags
      }
    }

    if (recipeData) {
      return parseRecipeJsonLd(recipeData, url, html);
    }
  }

  // 2. Fallback: Fetch plain markdown via Jina AI reader and use smart text parser
  try {
    const jinaMarkdownUrl = `https://r.jina.ai/${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(jinaMarkdownUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const markdown = await res.text();
      if (markdown && markdown.length > 100) {
        const parsed = parseRecipeFromRawText(markdown);
        parsed.source_url = url;
        return parsed;
      }
    }
  } catch (e) {
    // Fallback failed
  }

  throw new Error(
    'Kunne ikke hente oppskriften automatisk fra denne nettsiden. Prøv å åpne oppskriften på siden, kopiere teksten, og lime den inn i «Lim inn tekst»-fanen!'
  );
}

/**
 * Smart plain-text parser: detects ingredients vs instructions from freeform text or markdown.
 */
export function parseRecipeFromRawText(rawText: string): Partial<Recipe> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('Tekstfeltet er tomt.');
  }

  let title = '';
  // Check for Title: in Jina markdown or first header line
  for (const line of lines.slice(0, 10)) {
    if (line.toLowerCase().startsWith('title:')) {
      title = line.replace(/^title:\s*/i, '').trim();
      break;
    }
    if (line.startsWith('# ') || line.startsWith('## ')) {
      title = line.replace(/^#+\s*/, '').trim();
      break;
    }
  }

  if (!title) {
    title = lines[0];
  }

  if (title.length > 80) {
    title = title.substring(0, 80) + '...';
  }

  const ingredients: { name: string }[] = [];
  const instructions: string[] = [];

  let currentSection: 'unknown' | 'ingredients' | 'instructions' = 'unknown';

  const ingredientKeywords = /^(ingrediens|ingredienser|du trenger|dette trenger du|ingredients):?$/i;
  const instructionKeywords = /^(fremgangsmåte|slik gjør du|instruksjoner|tilberedning|metode|instructions|directions):?$/i;
  const ingredientMeasurementRegex = /\b(\d+([\.,]\d+)?|\d+\/\d+)\s*(g|kg|dl|cl|ml|l|ss|ts|båter|fedd|knivsodd|klype|stk|boks|pk|pakke|neve|skiver)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Strip markdown formatting like ###, **, [ ]
    const line = rawLine
      .replace(/^#+\s*/, '')
      .replace(/^\*\*(.*?)\*\*$/, '$1')
      .replace(/^-\s*\[[ x]\]\s*/i, '')
      .trim();

    if (ingredientKeywords.test(line)) {
      currentSection = 'ingredients';
      continue;
    }

    if (instructionKeywords.test(line)) {
      currentSection = 'instructions';
      continue;
    }

    // Stop ingredients if we encounter a new header or comments
    if (currentSection === 'ingredients' && (line.startsWith('##') || /^(kommentarer|vurdering|næring|tips)/i.test(line))) {
      currentSection = 'unknown';
      continue;
    }

    // Heuristics for lines
    const isNumbered = /^\d+[\.\)]\s+/.test(line);
    const hasMeasurement = ingredientMeasurementRegex.test(line);

    if (currentSection === 'ingredients') {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim();
      if (cleaned && cleaned.length > 1 && !cleaned.startsWith('http') && !cleaned.startsWith('![')) {
        ingredients.push({ name: cleaned });
      }
    } else if (currentSection === 'instructions') {
      const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
      if (cleaned && cleaned.length > 8 && !cleaned.startsWith('![')) {
        instructions.push(cleaned);
      }
    } else {
      // Auto-detect based on formatting
      if (isNumbered || (line.length > 70 && !line.startsWith('!['))) {
        instructions.push(line.replace(/^\d+[\.\)]\s*/, '').trim());
      } else if (hasMeasurement || line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
        const cleaned = line.replace(/^[-•*]\s*/, '').trim();
        if (cleaned && !cleaned.startsWith('![')) {
          ingredients.push({ name: cleaned });
        }
      }
    }
  }

  return {
    title,
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 4,
    difficulty: 'Medium',
    category: 'Dinner',
    tags: ['Importert'],
    ingredients: ingredients.length > 0 ? ingredients : [{ name: 'Ingredienser (se originaloppskrift)' }],
    instructions: instructions.length > 0 ? instructions : ['Steg 1: Tilbered ingrediensene etter oppskriften.']
  };
}
