import React, { useState, useEffect } from 'react';
import { Recipe, ViewMode, ShoppingItem } from './types';
import { INITIAL_RECIPES } from './data/sampleRecipes';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RecipeFormView } from './components/RecipeFormView';
import { RecipeDetailView } from './components/RecipeDetailView';
import { ShoppingListView } from './components/ShoppingListView';
import { CookingModeModal } from './components/CookingModeModal';
import { KitchenTimer } from './components/KitchenTimer';

const STORAGE_KEY = 'recipebox_recipes';
const SHOPPING_STORAGE_KEY = 'recipebox_shopping_list';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('view-dashboard');
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null);

  // Modals & Cooking Mode State
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isCookingModeOpen, setIsCookingModeOpen] = useState(false);
  const [cookingServings, setCookingServings] = useState(4);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme =
      savedTheme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Initialize recipes from localStorage or load curated example recipes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed: Recipe[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setRecipes(parsed);
        } else {
          setRecipes(INITIAL_RECIPES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECIPES));
        }
      } else {
        // First visit: populate rich starter recipes
        setRecipes(INITIAL_RECIPES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECIPES));
      }
    } catch (e) {
      console.error('Failed to load recipes from localStorage:', e);
      setRecipes(INITIAL_RECIPES);
    }
  }, []);

  // Initialize shopping list from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SHOPPING_STORAGE_KEY);
      if (stored) {
        setShoppingList(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load shopping list:', e);
    }
  }, []);

  const persistRecipes = (updated: Recipe[]) => {
    setRecipes(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save recipes to localStorage:', err);
    }
  };

  const persistShoppingList = (updated: ShoppingItem[]) => {
    setShoppingList(updated);
    try {
      localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save shopping list:', err);
    }
  };

  // Restore or reload example recipes
  const handleRestoreExamples = () => {
    const confirmReset = window.confirm(
      'Vil du laste inn de 8 originale eksempeloppskriftene? Dette vil tilbakestille eller oppdatere oppskriftssamlingen din.'
    );
    if (!confirmReset) return;

    persistRecipes(INITIAL_RECIPES);
    setCurrentView('view-dashboard');
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = recipes.map((r) =>
      r.id === id ? { ...r, is_favorite: !r.is_favorite } : r
    );
    persistRecipes(updated);
  };

  // Navigation handlers
  const handleSelectRecipe = (id: string) => {
    setCurrentRecipeId(id);
    setCurrentView('view-recipe-detail');
  };

  const handleOpenAdd = () => {
    setCurrentRecipeId(null);
    setCurrentView('view-recipe-form');
  };

  const handleOpenEdit = () => {
    if (currentRecipeId) {
      setCurrentView('view-recipe-form');
    }
  };

  // Save recipe
  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id' | 'created_at'> & { id?: string }) => {
    if (recipeData.id) {
      // Update existing
      const updated = recipes.map((r) => {
        if (r.id === recipeData.id) {
          return {
            ...r,
            ...recipeData,
            id: r.id,
            created_at: r.created_at,
          };
        }
        return r;
      });
      persistRecipes(updated);
    } else {
      // Insert new
      const newRecipe: Recipe = {
        ...recipeData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      persistRecipes([newRecipe, ...recipes]);
    }
    setCurrentView('view-dashboard');
  };

  // Delete recipe
  const handleDeleteRecipe = () => {
    if (!currentRecipeId) return;
    const ok = window.confirm('Er du sikker på at du vil slette denne oppskriften?');
    if (!ok) return;

    const filtered = recipes.filter((r) => r.id !== currentRecipeId);
    persistRecipes(filtered);
    setCurrentRecipeId(null);
    setCurrentView('view-dashboard');
  };

  // Export JSON
  const handleExportRecipe = () => {
    const recipe = recipes.find((r) => r.id === currentRecipeId);
    if (!recipe) return;

    try {
      const recipeJson = JSON.stringify(recipe, null, 2);
      const blob = new Blob([recipeJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const filename = recipe.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      a.download = `${filename || 'oppskrift'}.json`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Error exporting recipe:', err);
      alert('Feil ved eksport av oppskrift.');
    }
  };

  // Import JSON
  const handleImportRecipe = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedRecipe = JSON.parse(event.target?.result as string);
        importedRecipe.id = Date.now().toString();
        importedRecipe.created_at = new Date().toISOString();

        const updated = [importedRecipe, ...recipes];
        persistRecipes(updated);
        setCurrentView('view-dashboard');
        alert(`Oppskrift "${importedRecipe.title || 'Uten tittel'}" importert!`);
      } catch (err) {
        console.error('Error importing recipe:', err);
        alert('Kunne ikke importere oppskriften. Er du sikker på at filen er en gyldig oppskrift?');
      }
    };
    reader.readAsText(file);
  };

  // Shopping List handlers
  const handleAddAllToShoppingList = (ingredients: string[], recipeTitle: string) => {
    const newItems: ShoppingItem[] = ingredients.map((text) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      checked: false,
      recipeTitle,
    }));
    persistShoppingList([...shoppingList, ...newItems]);
  };

  const handleToggleShoppingItem = (id: string) => {
    const updated = shoppingList.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    persistShoppingList(updated);
  };

  const handleDeleteShoppingItem = (id: string) => {
    const updated = shoppingList.filter((item) => item.id !== id);
    persistShoppingList(updated);
  };

  const handleAddCustomShoppingItem = (text: string) => {
    const item: ShoppingItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      checked: false,
    };
    persistShoppingList([item, ...shoppingList]);
  };

  const handleClearCompletedShopping = () => {
    const updated = shoppingList.filter((item) => !item.checked);
    persistShoppingList(updated);
  };

  const handleClearAllShopping = () => {
    persistShoppingList([]);
  };

  // Cooking mode trigger
  const handleStartCookingMode = (servings: number) => {
    setCookingServings(servings);
    setIsCookingModeOpen(true);
  };

  const selectedRecipe = recipes.find((r) => r.id === currentRecipeId) || null;
  const uncheckedShoppingCount = shoppingList.filter((i) => !i.checked).length;

  return (
    <>
      <Header
        currentView={currentView}
        shoppingItemCount={uncheckedShoppingCount}
        onNavigate={(v) => setCurrentView(v)}
        onAddRecipe={handleOpenAdd}
        onImportRecipe={handleImportRecipe}
        onOpenTimer={() => setIsTimerOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="app-container">
        {currentView === 'view-dashboard' && (
          <DashboardView
            recipes={recipes}
            onSelectRecipe={handleSelectRecipe}
            onAddRecipe={handleOpenAdd}
            onToggleFavorite={handleToggleFavorite}
            onRestoreExamples={handleRestoreExamples}
          />
        )}

        {currentView === 'view-recipe-form' && (
          <RecipeFormView
            recipeToEdit={selectedRecipe}
            onSave={handleSaveRecipe}
            onCancel={() =>
              setCurrentView(
                currentRecipeId ? 'view-recipe-detail' : 'view-dashboard'
              )
            }
          />
        )}

        {currentView === 'view-recipe-detail' && selectedRecipe && (
          <RecipeDetailView
            recipe={selectedRecipe}
            onBack={() => setCurrentView('view-dashboard')}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteRecipe}
            onExport={handleExportRecipe}
            onToggleFavorite={handleToggleFavorite}
            onStartCookingMode={handleStartCookingMode}
            onAddAllToShoppingList={handleAddAllToShoppingList}
            onOpenTimer={() => setIsTimerOpen(true)}
          />
        )}

        {currentView === 'view-shopping-list' && (
          <ShoppingListView
            items={shoppingList}
            onToggleItem={handleToggleShoppingItem}
            onDeleteItem={handleDeleteShoppingItem}
            onAddItem={handleAddCustomShoppingItem}
            onClearCompleted={handleClearCompletedShopping}
            onClearAll={handleClearAllShopping}
            onBackToDashboard={() => setCurrentView('view-dashboard')}
          />
        )}
      </main>

      {/* Persistent Kitchen Timer */}
      <KitchenTimer
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />

      {/* Step-by-Step Cooking Focus Mode */}
      {isCookingModeOpen && selectedRecipe && (
        <CookingModeModal
          recipe={selectedRecipe}
          servings={cookingServings}
          onClose={() => setIsCookingModeOpen(false)}
          onOpenTimer={() => setIsTimerOpen(true)}
        />
      )}
    </>
  );
};

export default App;
