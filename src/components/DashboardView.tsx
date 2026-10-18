import React, { useState, useMemo } from 'react';
import { Recipe } from '../types';
import { RecipeIllustration } from './RecipeIllustration';

interface DashboardViewProps {
  recipes: Recipe[];
  onSelectRecipe: (id: string) => void;
  onAddRecipe: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onRestoreExamples: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  recipes,
  onSelectRecipe,
  onAddRecipe,
  onToggleFavorite,
  onRestoreExamples,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxTimeStr, setMaxTimeStr] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');

  const categories = [
    { id: 'all', label: 'Alle' },
    { id: 'Dinner', label: 'Middag' },
    { id: 'Breakfast', label: 'Frokost' },
    { id: 'Lunch', label: 'Lunsj' },
    { id: 'Dessert', label: 'Dessert' },
    { id: 'Vegan', label: 'Vegansk/Vegetar' },
    { id: 'favorites', label: 'Favoritter ❤️' },
  ];

  const filteredAndSortedRecipes = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const maxTime = maxTimeStr ? parseInt(maxTimeStr, 10) : Infinity;

    const filtered = recipes.filter((r) => {
      // Favorite filter
      if (selectedCategory === 'favorites' && !r.is_favorite) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && selectedCategory !== 'favorites') {
        const matchesCat = r.category === selectedCategory || (r.tags && r.tags.includes(selectedCategory));
        if (!matchesCat) return false;
      }

      // Max time filter
      const totalTime = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);
      if (totalTime > maxTime) {
        return false;
      }

      // Search term
      if (term) {
        const matchTitle = (r.title || '').toLowerCase().includes(term);
        const matchTags = r.tags && r.tags.some((t) => t.toLowerCase().includes(term));
        const matchIngredients =
          r.ingredients &&
          r.ingredients.some((ing) => ing.name.toLowerCase().includes(term));
        const matchDesc = (r.description || '').toLowerCase().includes(term);
        if (!matchTitle && !matchTags && !matchIngredients && !matchDesc) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'fastest') {
        const timeA = (a.prep_time_minutes || 0) + (a.cook_time_minutes || 0);
        const timeB = (b.prep_time_minutes || 0) + (b.cook_time_minutes || 0);
        return timeA - timeB;
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title, 'no');
      }
      if (sortBy === 'servings') {
        return (b.servings || 0) - (a.servings || 0);
      }
      return 0;
    });
  }, [recipes, searchTerm, selectedCategory, maxTimeStr, sortBy]);

  const favoritesCount = recipes.filter((r) => r.is_favorite).length;

  return (
    <section id="view-dashboard" className="view-section active">
      {/* Dashboard Top Header */}
      <div className="dashboard-hero">
        <div className="dashboard-title-area">
          <h2>Mine oppskrifter</h2>
          <p className="dashboard-subtitle">
            {recipes.length} {recipes.length === 1 ? 'oppskrift' : 'oppskrifter'} i samlingen din
            {favoritesCount > 0 && ` · ${favoritesCount} favoritter`}
          </p>
        </div>
        <div className="dashboard-top-actions">
          <button
            type="button"
            className="btn-outline small"
            onClick={onRestoreExamples}
            title="Last inn eller gjenopprett alle 8 gode norske eksempeloppskrifter"
          >
            ↺ Last inn eksempler
          </button>
        </div>
      </div>

      {/* Category Pills / Segmented Filter Tabs */}
      <div className="category-filter-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-tab-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search and Secondary Filter Bar */}
      <div className="dashboard-controls-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            id="search-input"
            className="search-input"
            placeholder="Søk i oppskrifter, råvarer eller tagger..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        <div className="filters-right">
          <div className="select-wrapper">
            <label htmlFor="filter-time">Tid:</label>
            <select
              id="filter-time"
              className="filter-select"
              value={maxTimeStr}
              onChange={(e) => setMaxTimeStr(e.target.value)}
            >
              <option value="">Alle tider</option>
              <option value="15">Under 15 min</option>
              <option value="30">Under 30 min</option>
              <option value="45">Under 45 min</option>
              <option value="60">Under 1 time</option>
              <option value="120">Under 2 timer</option>
            </select>
          </div>

          <div className="select-wrapper">
            <label htmlFor="filter-sort">Sorter:</label>
            <select
              id="filter-sort"
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Nyeste først</option>
              <option value="fastest">Raskest tilberedning</option>
              <option value="alphabetical">Alfabetisk (A–Å)</option>
              <option value="servings">Flest porsjoner</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipe Grid or Empty State */}
      {recipes.length === 0 ? (
        <div id="dashboard-empty" className="empty-state">
          <div className="empty-state-content">
            <span className="empty-icon">🍳</span>
            <h3>Ingen oppskrifter funnet</h3>
            <p>
              Kom raskt i gang ved å opprette din egen rett, eller last inn et sett med nydelige eksempeloppskrifter!
            </p>
            <div className="empty-state-buttons">
              <button
                type="button"
                className="btn-primary"
                onClick={onAddRecipe}
              >
                + Opprett ny oppskrift
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={onRestoreExamples}
              >
                ↺ Last inn eksempeloppskrifter
              </button>
            </div>
          </div>
        </div>
      ) : filteredAndSortedRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <span className="empty-icon">🔎</span>
            <h3>Ingen treff for søket ditt</h3>
            <p>Prøv å endre søkeord eller tilbakestille filtrene for å se flere oppskrifter.</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setMaxTimeStr('');
              }}
            >
              Nullstill søk og filtre
            </button>
          </div>
        </div>
      ) : (
        <div id="recipe-grid" className="recipe-grid">
          {filteredAndSortedRecipes.map((recipe) => {
            const totalTime =
              (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

            return (
              <div
                key={recipe.id}
                className="recipe-card"
                onClick={() => onSelectRecipe(recipe.id)}
                role="button"
                tabIndex={0}
              >
                <div className="card-media-wrapper">
                  {recipe.cover_image ? (
                    <img
                      src={recipe.cover_image}
                      alt={recipe.title}
                      className="card-image"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        const parent = (e.currentTarget as HTMLImageElement).parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.card-fallback');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}

                  <div
                    className="card-fallback"
                    style={{
                      display: recipe.cover_image ? 'none' : 'flex',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <RecipeIllustration
                      title={recipe.title}
                      category={recipe.category}
                      tags={recipe.tags}
                    />
                  </div>

                  {/* Favorite Toggle Button */}
                  <button
                    type="button"
                    className={`card-favorite-btn ${recipe.is_favorite ? 'is-favorited' : ''}`}
                    onClick={(e) => onToggleFavorite(recipe.id, e)}
                    aria-label={recipe.is_favorite ? 'Fjern favoritt' : 'Legg til favoritt'}
                  >
                    {recipe.is_favorite ? '❤️' : '🤍'}
                  </button>
                </div>

                <div className="card-content">
                  <h3 className="card-title">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="card-description-preview">
                      {recipe.description}
                    </p>
                  )}

                  {/* Clean unboxed metadata according to Zero-Pill rule */}
                  <div className="card-metadata-line text-muted">
                    <span>⏱ {totalTime} min</span>
                    <span aria-hidden="true">·</span>
                    <span>{recipe.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{recipe.servings} porsj.</span>
                  </div>

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="card-tags-list">
                      {recipe.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag-quiet">
                          {tag}
                        </span>
                      ))}
                      {recipe.tags.length > 3 && (
                        <span className="tag-quiet">+{recipe.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
