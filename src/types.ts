export type RecipeDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Ingredient {
  name: string;
  amount?: number;
  unit?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  difficulty: RecipeDifficulty;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  cover_image?: string;
  category?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Vegan' | 'Vegetarian' | 'Baking';
  tags: string[];
  instructions: string[];
  ingredients: Ingredient[];
  notes?: string;
  is_favorite?: boolean;
  created_at: string;
  source_url?: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  checked: boolean;
  recipeTitle?: string;
}

export interface MealPlanDay {
  dayName: 'Mandag' | 'Tirsdag' | 'Onsdag' | 'Torsdag' | 'Fredag' | 'Lørdag' | 'Søndag';
  recipeId?: string | null;
  recipeTitle?: string | null;
  note?: string;
}

export type MealPlan = Record<string, MealPlanDay>;

export type ViewMode =
  | 'view-dashboard'
  | 'view-explore'
  | 'view-meal-planner'
  | 'view-recipe-form'
  | 'view-recipe-detail'
  | 'view-shopping-list';
