import React, { useState } from 'react';
import { Recipe } from '../types';
import { RecipeIllustration } from './RecipeIllustration';
import { scaleIngredientText } from '../utils/portionCalculator';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
  onToggleFavorite: (id: string) => void;
  onStartCookingMode: (servings: number) => void;
  onAddAllToShoppingList: (ingredients: string[], recipeTitle: string) => void;
  onOpenTimer: () => void;
}

export const RecipeDetailView: React.FC<RecipeDetailViewProps> = ({
  recipe,
  onBack,
  onEdit,
  onDelete,
  onExport,
  onToggleFavorite,
  onStartCookingMode,
  onAddAllToShoppingList,
  onOpenTimer,
}) => {
  const [servings, setServings] = useState<number>(recipe.servings || 4);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [addedToList, setAddedToList] = useState(false);
  const [copiedRecipe, setCopiedRecipe] = useState(false);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleServingChange = (delta: number) => {
    setServings((prev) => Math.max(1, prev + delta));
  };

  const handleAddAllToShopping = () => {
    const scaledList = recipe.ingredients.map((ing) =>
      scaleIngredientText(ing.name, recipe.servings, servings)
    );
    onAddAllToShoppingList(scaledList, recipe.title);
    setAddedToList(true);
    setTimeout(() => setAddedToList(false), 2500);
  };

  const handleCopyRecipeText = () => {
    const ingredientsFormatted = recipe.ingredients
      .map(
        (ing) => `• ${scaleIngredientText(ing.name, recipe.servings, servings)}`
      )
      .join('\n');

    const stepsFormatted = recipe.instructions
      .map((step, idx) => `${idx + 1}. ${step}`)
      .join('\n\n');

    const fullText = `🍴 ${recipe.title} (${servings} porsjoner)\n${recipe.description || ''}\n\n🛒 Ingredienser:\n${ingredientsFormatted}\n\n👩‍🍳 Fremgangsmåte:\n${stepsFormatted}${recipe.notes ? `\n\n💡 Tips: ${recipe.notes}` : ''}`;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedRecipe(true);
      setTimeout(() => setCopiedRecipe(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section id="view-recipe-detail" className="view-section active print-container">
      {/* Top action bar */}
      <div className="detail-header no-print">
        <button
          type="button"
          id="btn-back-from-detail"
          className="btn-icon"
          onClick={onBack}
        >
          ← Tilbake
        </button>

        <div className="detail-actions">
          <button
            type="button"
            className="btn-outline small"
            onClick={onOpenTimer}
          >
            ⏱ Kjøkkentimer
          </button>
          <button
            type="button"
            className="btn-outline small"
            onClick={handleCopyRecipeText}
          >
            {copiedRecipe ? 'Kopiert! ✓' : 'Kopier tekst'}
          </button>
          <button
            type="button"
            className="btn-outline small"
            onClick={handlePrint}
          >
            🖨 Skriv ut
          </button>
          <button
            type="button"
            id="btn-export-recipe"
            className="btn-outline small"
            onClick={onExport}
          >
            Eksporter
          </button>
          <button
            type="button"
            id="btn-edit-recipe"
            className="btn-outline small"
            onClick={onEdit}
          >
            Rediger
          </button>
          <button
            type="button"
            id="btn-delete-recipe"
            className="btn-danger small"
            onClick={onDelete}
          >
            Slett
          </button>
        </div>
      </div>

      <article className="recipe-detail-card">
        {/* Hero Banner */}
        <div className="recipe-hero">
          {recipe.cover_image ? (
            <img
              id="detail-image"
              src={recipe.cover_image}
              alt={recipe.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const parent = (e.currentTarget as HTMLImageElement).parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.hero-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : null}

          <div
            className="hero-fallback"
            style={{
              display: recipe.cover_image ? 'none' : 'flex',
              width: '100%',
              minHeight: '260px',
            }}
          >
            <RecipeIllustration
              title={recipe.title}
              category={recipe.category}
              tags={recipe.tags}
            />
          </div>

          <div className="recipe-hero-content">
            <div className="hero-title-row">
              <h1 id="detail-title">{recipe.title}</h1>
              <button
                type="button"
                className={`favorite-toggle-btn no-print ${recipe.is_favorite ? 'is-fav' : ''}`}
                onClick={() => onToggleFavorite(recipe.id)}
                aria-label={recipe.is_favorite ? 'Fjern favoritt' : 'Legg til favoritt'}
              >
                {recipe.is_favorite ? '❤️ Favoritt' : '🤍 Lagre som favoritt'}
              </button>
            </div>

            {recipe.description && (
              <p id="detail-description">{recipe.description}</p>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="recipe-meta-tags text-muted" id="detail-tags">
                {recipe.tags.map((tag, idx) => (
                  <span key={idx} className="tag-quiet">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Meta Bar */}
        <div className="recipe-meta-bar">
          <div className="meta-item">
            <span className="meta-label">Forberedelse</span>
            <span className="meta-value tabular-nums" id="detail-prep">
              {recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : '--'}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Tilberedning</span>
            <span className="meta-value tabular-nums" id="detail-cook">
              {recipe.cook_time_minutes ? `${recipe.cook_time_minutes} min` : '--'}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Total tid</span>
            <span className="meta-value tabular-nums">
              {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Vanskelighetsgrad</span>
            <span className="meta-value" id="detail-difficulty">
              {recipe.difficulty}
            </span>
          </div>

          {/* Dynamic Servings Calculator Stepper */}
          <div className="meta-item servings-stepper-box no-print">
            <span className="meta-label">Porsjonskalkulator</span>
            <div className="stepper-controls">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleServingChange(-1)}
                aria-label="Reduser porsjoner"
              >
                −
              </button>
              <span className="stepper-value tabular-nums font-semibold">
                {servings} porsjoner
              </span>
              <button
                type="button"
                className="stepper-btn"
                onClick={() => handleServingChange(1)}
                aria-label="Øk porsjoner"
              >
                +
              </button>
            </div>
            {servings !== recipe.servings && (
              <span className="stepper-hint">
                Original: {recipe.servings} porsj.
              </span>
            )}
          </div>
        </div>

        {/* Main Content Grid: Ingredients & Steps */}
        <div className="recipe-content-grid">
          {/* Ingredients Column */}
          <div className="ingredients-section">
            <div className="ingredients-section-header">
              <h3>Ingredienser</h3>
              <button
                type="button"
                className="btn-outline small no-print"
                onClick={handleAddAllToShopping}
              >
                {addedToList ? 'Lagt i handleliste! ✓' : '+ Handleliste'}
              </button>
            </div>

            <p className="ingredients-servings-note text-muted">
              Beregnet for <strong>{servings} porsjoner</strong>. Merk av etter hvert som du måler opp:
            </p>

            <ul id="detail-ingredients-list" className="checklist">
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ing, idx) => {
                  const scaledText = scaleIngredientText(
                    ing.name,
                    recipe.servings,
                    servings
                  );
                  return (
                    <li key={idx}>
                      <label>
                        <input
                          type="checkbox"
                          checked={!!checkedIngredients[idx]}
                          onChange={() => toggleIngredient(idx)}
                        />
                        <span>{scaledText}</span>
                      </label>
                    </li>
                  );
                })
              ) : (
                <li>Ingen ingredienser oppgitt.</li>
              )}
            </ul>
          </div>

          {/* Instructions Column */}
          <div className="instructions-section">
            <div className="instructions-section-header">
              <h3>Fremgangsmåte</h3>
              <button
                type="button"
                className="btn-primary no-print"
                onClick={() => onStartCookingMode(servings)}
              >
                👨‍🍳 Start kokemodus
              </button>
            </div>

            <ol id="detail-instructions-list" className="step-list">
              {recipe.instructions && recipe.instructions.length > 0 ? (
                recipe.instructions.map((inst, idx) => (
                  <li key={idx}>
                    <p className="step-text">{inst}</p>
                  </li>
                ))
              ) : (
                <li>Ingen instruksjoner oppgitt.</li>
              )}
            </ol>

            {/* Chef Notes / Tips if present */}
            {recipe.notes && (
              <div className="chef-notes-card">
                <div className="chef-notes-header">
                  <span className="chef-icon">💡</span>
                  <h4>Kokkens tips & råd</h4>
                </div>
                <p>{recipe.notes}</p>
              </div>
            )}
          </div>
        </div>
      </article>
    </section>
  );
};
