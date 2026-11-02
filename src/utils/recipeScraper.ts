import { Recipe, RecipeDifficulty } from '../types';

/**
 * Converts ISO 8601 duration strings (e.g., "PT30M", "PT1H15M", "PT45S") to total minutes.
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
    const type = node['@type'];
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
 * Extracts and normalizes Recipe data from a JSON-LD object.
 */
function parseRecipeJsonLd(recipeNode: any, sourceUrl: string): Partial<Recipe> {
  const title = decodeHtmlEntities(recipeNode.name || recipeNode.headline || 'Uten navn');
  const description = decodeHtmlEntities(recipeNode.description || '');

  // Extract cover image
  let cover_image = '';
  if (typeof recipeNode.image === 'string') {
    cover_image = recipeNode.image;
  } else if (Array.isArray(recipeNode.image) && recipeNode.image.length > 0) {
    const firstImg = recipeNode.image[0];
    cover_image = typeof firstImg === 'string' ? firstImg : firstImg.url || '';
  } else if (recipeNode.image && typeof recipeNode.image === 'object') {
    cover_image = recipeNode.image.url || recipeNode.image.contentUrl || '';
  }

  // Prep time & cook time
  const prep_time_minutes = parseIsoDuration(recipeNode.prepTime);
  const cook_time_minutes =
    parseIsoDuration(recipeNode.cookTime) ||
    parseIsoDuration(recipeNode.totalTime) - prep_time_minutes;

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
      .map((s) => decodeHtmlEntities(s).trim())
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

  // Difficulty deduction based on time / steps
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
    ingredients: ingredients.length > 0 ? ingredients : [{ name: 'Se oppskrift' }],
    instructions: instructions.length > 0 ? instructions : ['Følg trinnene fra kilden.'],
    source_url: sourceUrl
  };
}

/**
 * Scrapes a recipe from any web URL that provides Schema.org Recipe JSON-LD.
 * Uses public CORS proxies to bypass browser CORS limitations on GitHub Pages.
 */
export async function scrapeRecipeFromUrl(rawUrl: string): Promise<Partial<Recipe>> {
  const url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Ugyldig URL. Husk å inkludere https://');
  }

  let html = '';
  let lastError: Error | null = null;

  // 1. Try AllOrigins proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      html = await res.text();
    }
  } catch (err: any) {
    lastError = err;
  }

  // 2. Fallback to corsproxy.io
  if (!html) {
    try {
      const fallbackUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(fallbackUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        html = await res.text();
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!html) {
    throw new Error(
      'Kunne ikke hente siden via web-proxy. Sjekk at nettsiden er offentlig tilgjengelig, eller lim inn teksten direkte i tekst-fanen.'
    );
  }

  // Extract JSON-LD scripts
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
      // Continue to next script tag if JSON parse fails
    }
  }

  if (recipeData) {
    return parseRecipeJsonLd(recipeData, url);
  }

  // Fallback: extract title and meta description if no structured JSON-LD was found
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);

  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).split(/[-|–]/)[0].trim() : 'Importert oppskrift';
  const description = metaDescMatch ? decodeHtmlEntities(metaDescMatch[1]).trim() : '';
  const cover_image = ogImgMatch ? ogImgMatch[1].trim() : '';

  return {
    title,
    description,
    cover_image: cover_image || undefined,
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 4,
    difficulty: 'Medium',
    category: 'Dinner',
    tags: ['Importert'],
    ingredients: [{ name: 'Ingredienser (se originaloppskrift)' }],
    instructions: ['Fremgangsmåte (se originaloppskrift)'],
    source_url: url
  };
}

/**
 * Smart plain-text parser: detects ingredients vs instructions from freeform text.
 */
export function parseRecipeFromRawText(rawText: string): Partial<Recipe> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('Tekstfeltet er tomt.');
  }

  let title = lines[0];
  if (title.length > 80) {
    title = title.substring(0, 80) + '...';
  }

  const ingredients: { name: string }[] = [];
  const instructions: string[] = [];

  let currentSection: 'unknown' | 'ingredients' | 'instructions' = 'unknown';

  const ingredientKeywords = /^(ingrediens|ingredienser|du trenger|dette trenger du):?$/i;
  const instructionKeywords = /^(fremgangsmåte|slik gjør du|instruksjoner|tilberedning|metode):?$/i;
  const ingredientMeasurementRegex = /\b(\d+([\.,]\d+)?|\d+\/\d+)\s*(g|kg|dl|cl|ml|l|ss|ts|knivsodd|klype|stk|boks|pk|pakke|fedd|neve)\b/i;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (ingredientKeywords.test(line)) {
      currentSection = 'ingredients';
      continue;
    }

    if (instructionKeywords.test(line)) {
      currentSection = 'instructions';
      continue;
    }

    // Heuristics for lines
    const isNumbered = /^\d+[\.\)]\s+/.test(line);
    const hasMeasurement = ingredientMeasurementRegex.test(line);

    if (currentSection === 'ingredients') {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim();
      if (cleaned) ingredients.push({ name: cleaned });
    } else if (currentSection === 'instructions') {
      const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim();
      if (cleaned) instructions.push(cleaned);
    } else {
      // Auto-detect based on formatting
      if (isNumbered || line.length > 80) {
        instructions.push(line.replace(/^\d+[\.\)]\s*/, '').trim());
      } else if (hasMeasurement || line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        ingredients.push({ name: line.replace(/^[-•*]\s*/, '').trim() });
      } else {
        // Fallback to instruction if medium-long, else ingredient
        if (line.length > 50) {
          instructions.push(line);
        } else {
          ingredients.push({ name: line });
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
    tags: ['Egen oppskrift'],
    ingredients: ingredients.length > 0 ? ingredients : [{ name: 'Ingredienser' }],
    instructions: instructions.length > 0 ? instructions : ['Steg 1: Tilbered ingrediensene.']
  };
}
