import { Recipe, RecipeDifficulty } from '../types';

interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string;
  strYoutube?: string;
  [key: string]: any;
}

/**
 * Normalizes a meal from TheMealDB into our Recipe format.
 */
function normalizeMealDbMeal(meal: MealDbMeal): Recipe {
  const ingredients: { name: string }[] = [];

  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && typeof ing === 'string' && ing.trim()) {
      const measureText = measure && typeof measure === 'string' && measure.trim() ? `${measure.trim()} ` : '';
      ingredients.push({ name: `${measureText}${ing.trim()}` });
    }
  }

  // Parse instructions into steps
  const rawInstructions = meal.strInstructions || '';
  const instructions = rawInstructions
    .split(/\r?\n+/)
    .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter((s) => s.length > 5);

  const tags: string[] = ['TheMealDB'];
  if (meal.strArea) tags.push(meal.strArea);
  if (meal.strCategory) tags.push(meal.strCategory);
  if (meal.strTags) {
    tags.push(...meal.strTags.split(',').map((t) => t.trim()).filter(Boolean));
  }

  // Category mapping
  let category: Recipe['category'] = 'Dinner';
  const catLower = (meal.strCategory || '').toLowerCase();
  if (catLower.includes('breakfast')) category = 'Breakfast';
  else if (catLower.includes('dessert')) category = 'Dessert';
  else if (catLower.includes('vegan')) category = 'Vegan';
  else if (catLower.includes('vegetarian')) category = 'Vegetarian';

  // Difficulty deduction
  const difficulty: RecipeDifficulty = instructions.length <= 5 ? 'Easy' : instructions.length >= 9 ? 'Hard' : 'Medium';

  return {
    id: `mealdb-${meal.idMeal}`,
    title: meal.strMeal,
    description: `${meal.strArea || ''} ${meal.strCategory || 'rett'}. Hentet fra den åpne oppskriftsdatabasen TheMealDB.`,
    cover_image: meal.strMealThumb || undefined,
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 4,
    difficulty,
    category,
    tags: tags.slice(0, 6),
    ingredients: ingredients.length > 0 ? ingredients : [{ name: 'Se tilberedning' }],
    instructions: instructions.length > 0 ? instructions : ['Følg instruksjonene for retten.'],
    created_at: new Date().toISOString(),
    source_url: `https://www.themealdb.com/meal/${meal.idMeal}`
  };
}

/**
 * Searches TheMealDB for recipes matching a search term.
 */
export async function searchTheMealDb(query: string): Promise<Recipe[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(trimmed)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.meals || !Array.isArray(data.meals)) return [];
    return data.meals.map(normalizeMealDbMeal);
  } catch (err) {
    console.error('Failed to search TheMealDB:', err);
    return [];
  }
}

/**
 * Fetches popular/sample recipes from TheMealDB for inspiration.
 */
export async function fetchPopularMealDbRecipes(): Promise<Recipe[]> {
  try {
    // Search for common staples to get a broad range of high-quality recipes
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=pasta');
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.meals || !Array.isArray(data.meals)) return [];
    return data.meals.slice(0, 8).map(normalizeMealDbMeal);
  } catch (err) {
    console.error('Failed to fetch popular TheMealDB recipes:', err);
    return [];
  }
}
