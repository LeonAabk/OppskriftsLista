import React, { useState, useMemo, useEffect } from 'react';
import { Recipe } from '../types';
import { ALL_CURATED_CATALOG } from '../data/curatedLibrary';
import { RecipeIllustration } from './RecipeIllustration';
import { searchTheMealDb, fetchPopularMealDbRecipes } from '../utils/mealDbApi';

interface ExploreViewProps {
  savedRecipes: Recipe[];
  onAddRecipeToCookbook: (recipe: Recipe) => void;
  onViewRecipeDetail: (recipe: Recipe) => void;
  onOpenImporter: () => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  savedRecipes,
  onAddRecipeToCookbook,
  onViewRecipeDetail,
  onOpenImporter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mealDbResults, setMealDbResults] = useState<Recipe[]>([]);
  const [isSearchingMealDb, setIsSearchingMealDb] = useState(false);

  const savedTitles = useMemo(() => {
    return new Set(savedRecipes.map((r) => r.title.toLowerCase().trim()));
  }, [savedRecipes]);

  const categories = [
    { id: 'all', label: 'Alle eksempler' },
    { id: 'quick', label: '⚡ Hurtig (<20 min)' },
    { id: 'tradition', label: '🇳🇴 Norsk tradisjon' },
    { id: 'pasta', label: '🍝 Pasta & Italia' },
    { id: 'asian', label: '🥢 Asiatisk & Bowls' },
    { id: 'healthy', label: '🥑 Vegetar & Sunn' },
    { id: 'baking', label: '🥐 Bakst & Frokost' },
    { id: 'mealdb', label: '🌍 TheMealDB (Åpen database)' },
  ];

  // Fetch initial MealDB recipes if user clicks the MealDB tab
  useEffect(() => {
    if (selectedCategory === 'mealdb' && mealDbResults.length === 0) {
      setIsSearchingMealDb(true);
      fetchPopularMealDbRecipes()
        .then((res) => setMealDbResults(res))
        .finally(() => setIsSearchingMealDb(false));
    }
  }, [selectedCategory, mealDbResults.length]);

  const handleMealDbSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearchingMealDb(true);
    try {
      const res = await searchTheMealDb(searchTerm);
      setMealDbResults(res);
    } finally {
      setIsSearchingMealDb(false);
    }
  };

  const filteredCuratedRecipes = useMemo(() => {
    if (selectedCategory === 'mealdb') return [];

    const term = searchTerm.toLowerCase().trim();

    return ALL_CURATED_CATALOG.filter((recipe) => {
      // Category filter
      if (selectedCategory === 'quick') {
        const isQuick =
          recipe.tags.some((t) => t.toLowerCase().includes('hurtig') || t.includes('<20')) ||
          (recipe.prep_time_minutes + recipe.cook_time_minutes <= 20);
        if (!isQuick) return false;
      } else if (selectedCategory === 'tradition') {
        const isTradition =
          recipe.tags.some((t) => t.toLowerCase().includes('tradisjon') || t.toLowerCase().includes('husmann'));
        if (!isTradition) return false;
      } else if (selectedCategory === 'pasta') {
        const isPasta =
          recipe.tags.some((t) => t.toLowerCase().includes('pasta') || t.toLowerCase().includes('italiensk') || t.toLowerCase().includes('pizza'));
        if (!isPasta) return false;
      } else if (selectedCategory === 'asian') {
        const isAsian =
          recipe.tags.some((t) => t.toLowerCase().includes('asiatisk') || t.toLowerCase().includes('indisk') || t.toLowerCase().includes('wok') || t.toLowerCase().includes('bowl'));
        if (!isAsian) return false;
      } else if (selectedCategory === 'healthy') {
        const isHealthy =
          recipe.category === 'Vegan' ||
          recipe.category === 'Vegetarian' ||
          recipe.tags.some((t) => t.toLowerCase().includes('vegetar') || t.toLowerCase().includes('vegansk') || t.toLowerCase().includes('sunn'));
        if (!isHealthy) return false;
      } else if (selectedCategory === 'baking') {
        const isBaking =
          recipe.category === 'Baking' ||
          recipe.category === 'Breakfast' ||
          recipe.category === 'Dessert' ||
          recipe.tags.some((t) => t.toLowerCase().includes('bakst') || t.toLowerCase().includes('frokost') || t.toLowerCase().includes('brød'));
        if (!isBaking) return false;
      }

      // Search term
      if (term) {
        const matchTitle = recipe.title.toLowerCase().includes(term);
        const matchDesc = (recipe.description || '').toLowerCase().includes(term);
        const matchTags = recipe.tags.some((t) => t.toLowerCase().includes(term));
        const matchIngs = recipe.ingredients.some((i) => i.name.toLowerCase().includes(term));
        if (!matchTitle && !matchDesc && !matchTags && !matchIngs) return false;
      }

      return true;
    });
  }, [selectedCategory, searchTerm]);

  const activeRecipes = selectedCategory === 'mealdb' ? mealDbResults : filteredCuratedRecipes;

  return (
    <section id="view-explore" className="view-section active">
      {/* Hero header */}
      <div className="dashboard-hero">
        <div className="dashboard-title-area">
          <h2>Utforsk oppskriftsbanken</h2>
          <p className="hero-subtitle">
            Hent inspirasjon fra kuraterte matoppskrifter eller søk i millioner av retter på nett.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenImporter}
          >
            🌐 Importer fra lenke / tekst
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="category-scroll-container">
        <div className="category-chips">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="dashboard-toolbar">
        {selectedCategory === 'mealdb' ? (
          <form onSubmit={handleMealDbSearch} className="search-form-full">
            <input
              type="text"
              placeholder="Søk i TheMealDB (f.eks. chicken, curry, pasta, salmon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-primary" disabled={isSearchingMealDb}>
              {isSearchingMealDb ? 'Søker...' : 'Søk i TheMealDB'}
            </button>
          </form>
        ) : (
          <div className="search-box-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Søk blant oppskrifter, ingredienser eller stikkord..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="explore-results-meta">
        <span>
          Viser {activeRecipes.length}{' '}
          {selectedCategory === 'mealdb' ? 'retter fra TheMealDB' : 'eksempeloppskrifter'}
        </span>
      </div>

      {/* Recipe Grid */}
      {isSearchingMealDb ? (
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p>Søker i åpen oppskriftsdatabase...</p>
        </div>
      ) : activeRecipes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🍳</span>
          <h3>Ingen oppskrifter funnet</h3>
          <p>Prøv et annet søkeord eller velg en annen kategori.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {activeRecipes.map((recipe) => {
            const isSaved = savedTitles.has(recipe.title.toLowerCase().trim());
            const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

            return (
              <article key={recipe.id} className="recipe-card explore-card">
                <div
                  className="card-media-wrapper"
                  onClick={() => onViewRecipeDetail(recipe)}
                  role="button"
                  tabIndex={0}
                >
                  {recipe.cover_image ? (
                    <img
                      src={recipe.cover_image}
                      alt={recipe.title}
                      className="card-img"
                      loading="lazy"
                    />
                  ) : (
                    <RecipeIllustration
                      title={recipe.title}
                      tags={recipe.tags}
                      category={recipe.category}
                    />
                  )}
                  <span className="card-badge difficulty-badge">
                    {recipe.difficulty === 'Easy' ? 'Enkel' : recipe.difficulty === 'Medium' ? 'Middels' : 'Avansert'}
                  </span>
                  {totalTime > 0 && (
                    <span className="card-badge time-badge">
                      ⏱ {totalTime} min
                    </span>
                  )}
                </div>

                <div className="card-content">
                  <div className="card-tags">
                    {recipe.tags.slice(0, 3).map((t, i) => (
                      <span key={i} className="card-tag">
                        {t}
                      </span>
                    ))}
                  </div>

                  <h3
                    className="card-title"
                    onClick={() => onViewRecipeDetail(recipe)}
                  >
                    {recipe.title}
                  </h3>

                  <p className="card-desc">
                    {recipe.description || 'Deilig oppskrift med gode smaker og enkle trinn.'}
                  </p>

                  <div className="explore-card-footer">
                    <button
                      type="button"
                      className="btn-text-action"
                      onClick={() => onViewRecipeDetail(recipe)}
                    >
                      Vis oppskrift
                    </button>

                    {isSaved ? (
                      <span className="saved-badge-indicator">
                        ✓ I kokeboken
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn-add-to-book"
                        onClick={() => onAddRecipeToCookbook(recipe)}
                      >
                        + Legg til i min kokebok
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
