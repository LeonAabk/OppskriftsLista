import React, { useState } from 'react';
import { Recipe, MealPlan, ShoppingItem } from '../types';
import { RecipeIllustration } from './RecipeIllustration';

interface MealPlannerViewProps {
  recipes: Recipe[];
  mealPlan: MealPlan;
  onUpdateMealPlan: (updatedPlan: MealPlan) => void;
  onAddIngredientsToShoppingList: (items: ShoppingItem[]) => void;
  onViewRecipeDetail: (recipeId: string) => void;
  onNavigateToShoppingList: () => void;
}

const DAYS_OF_WEEK: ('Mandag' | 'Tirsdag' | 'Onsdag' | 'Torsdag' | 'Fredag' | 'Lørdag' | 'Søndag')[] = [
  'Mandag',
  'Tirsdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lørdag',
  'Søndag'
];

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  recipes,
  mealPlan,
  onUpdateMealPlan,
  onAddIngredientsToShoppingList,
  onViewRecipeDetail,
  onNavigateToShoppingList,
}) => {
  const [activePickerDay, setActivePickerDay] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const recipeMap = new Map<string, Recipe>();
  recipes.forEach((r) => recipeMap.set(r.id, r));

  const handleSelectRecipeForDay = (day: string, recipeId: string) => {
    const selected = recipeMap.get(recipeId);
    const updated: MealPlan = {
      ...mealPlan,
      [day]: {
        dayName: day as any,
        recipeId: recipeId,
        recipeTitle: selected ? selected.title : null
      }
    };
    onUpdateMealPlan(updated);
    setActivePickerDay(null);
  };

  const handleRemoveRecipeForDay = (day: string) => {
    const updated: MealPlan = {
      ...mealPlan,
      [day]: {
        dayName: day as any,
        recipeId: null,
        recipeTitle: null
      }
    };
    onUpdateMealPlan(updated);
  };

  const handleClearWeek = () => {
    const empty: MealPlan = {};
    DAYS_OF_WEEK.forEach((day) => {
      empty[day] = { dayName: day, recipeId: null, recipeTitle: null };
    });
    onUpdateMealPlan(empty);
    setFeedbackMessage('Ukemenyen er nullstilt.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleRandomizeWeek = () => {
    if (recipes.length === 0) return;
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    const newPlan: MealPlan = {};

    DAYS_OF_WEEK.forEach((day, index) => {
      const chosen = shuffled[index % shuffled.length];
      newPlan[day] = {
        dayName: day,
        recipeId: chosen.id,
        recipeTitle: chosen.title
      };
    });

    onUpdateMealPlan(newPlan);
    setFeedbackMessage('🎲 Laget en ny tilfeldig og variert ukemeny for deg!');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleGenerateShoppingList = () => {
    const newItems: ShoppingItem[] = [];

    DAYS_OF_WEEK.forEach((day) => {
      const planDay = mealPlan[day];
      if (planDay && planDay.recipeId) {
        const recipe = recipeMap.get(planDay.recipeId);
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach((ing) => {
            newItems.push({
              id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              text: ing.name,
              checked: false,
              recipeTitle: `${day}: ${recipe.title}`
            });
          });
        }
      }
    });

    if (newItems.length === 0) {
      setFeedbackMessage('Ingen oppskrifter er lagt til i ukemenyen ennå.');
      setTimeout(() => setFeedbackMessage(null), 3500);
      return;
    }

    onAddIngredientsToShoppingList(newItems);
    setFeedbackMessage(
      `✓ La til ${newItems.length} ingredienser i handlelisten fra ukemenyen din!`
    );
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Count planned dinners
  const plannedCount = DAYS_OF_WEEK.filter((d) => mealPlan[d]?.recipeId).length;

  return (
    <section id="view-meal-planner" className="view-section active">
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="dashboard-title-area">
          <h2>Ukemeny & Måltidsplanlegger</h2>
          <p className="hero-subtitle">
            Planlegg ukens middager og overfør alle ingredienser direkte til handlelisten med ett klikk.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRandomizeWeek}
            disabled={recipes.length === 0}
            title="Generer en automatisk ukemeny med oppskriftene dine"
          >
            🎲 Tilfeldig ukemeny
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerateShoppingList}
            disabled={plannedCount === 0}
          >
            🛒 Legg {plannedCount > 0 ? `${plannedCount} middager` : 'ukemeny'} til handleliste
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="alert-banner alert-success">
          <span>{feedbackMessage}</span>
          {feedbackMessage.includes('handlelisten') && (
            <button
              type="button"
              className="btn-text-link"
              onClick={onNavigateToShoppingList}
              style={{ marginLeft: '1rem', fontWeight: 600 }}
            >
              Gå til handleliste ↗
            </button>
          )}
        </div>
      )}

      {/* Week Grid */}
      <div className="meal-planner-grid">
        {DAYS_OF_WEEK.map((day) => {
          const planEntry = mealPlan[day];
          const recipe = planEntry?.recipeId ? recipeMap.get(planEntry.recipeId) : null;

          return (
            <div key={day} className="meal-day-card">
              <div className="meal-day-header">
                <span className="meal-day-name">{day}</span>
                {recipe && (
                  <button
                    type="button"
                    className="btn-icon-subtle"
                    onClick={() => handleRemoveRecipeForDay(day)}
                    title="Fjern fra denne dagen"
                  >
                    ✕
                  </button>
                )}
              </div>

              {recipe ? (
                <div className="meal-day-body">
                  <div
                    className="meal-day-media"
                    onClick={() => onViewRecipeDetail(recipe.id)}
                    role="button"
                    tabIndex={0}
                  >
                    {recipe.cover_image ? (
                      <img
                        src={recipe.cover_image}
                        alt={recipe.title}
                        className="meal-day-img"
                      />
                    ) : (
                      <RecipeIllustration
                        title={recipe.title}
                        tags={recipe.tags}
                        category={recipe.category}
                      />
                    )}
                    <span className="meal-day-time">
                      ⏱ {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                    </span>
                  </div>

                  <h4
                    className="meal-day-title"
                    onClick={() => onViewRecipeDetail(recipe.id)}
                  >
                    {recipe.title}
                  </h4>

                  <div className="meal-day-actions">
                    <button
                      type="button"
                      className="btn-sm-text"
                      onClick={() => onViewRecipeDetail(recipe.id)}
                    >
                      Se oppskrift
                    </button>
                    <button
                      type="button"
                      className="btn-sm-text"
                      onClick={() => setActivePickerDay(day)}
                    >
                      Bytt rett
                    </button>
                  </div>
                </div>
              ) : (
                <div className="meal-day-empty">
                  <span className="empty-fork-icon">🍽️</span>
                  <p>Ingen middag valgt</p>
                  <button
                    type="button"
                    className="btn-add-meal"
                    onClick={() => setActivePickerDay(day)}
                  >
                    + Velg middag
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Week Actions Footer */}
      <div className="meal-planner-footer">
        <button
          type="button"
          className="btn-text-danger"
          onClick={handleClearWeek}
        >
          Nullstill ukemeny
        </button>
      </div>

      {/* Recipe Picker Modal */}
      {activePickerDay && (
        <div className="modal-backdrop" onClick={() => setActivePickerDay(null)}>
          <div
            className="modal-container picker-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>Velg middag for {activePickerDay}</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setActivePickerDay(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body picker-body">
              {recipes.length === 0 ? (
                <p>Du har ingen oppskrifter i kokeboken ennå.</p>
              ) : (
                <div className="picker-recipe-list">
                  {recipes.map((r) => (
                    <div
                      key={r.id}
                      className="picker-recipe-item"
                      onClick={() => handleSelectRecipeForDay(activePickerDay, r.id)}
                    >
                      <div className="picker-thumb">
                        {r.cover_image ? (
                          <img src={r.cover_image} alt={r.title} />
                        ) : (
                          <span className="picker-icon">🍲</span>
                        )}
                      </div>
                      <div className="picker-info">
                        <strong>{r.title}</strong>
                        <span>
                          ⏱ {(r.prep_time_minutes || 0) + (r.cook_time_minutes || 0)} min · {r.difficulty === 'Easy' ? 'Enkel' : r.difficulty === 'Medium' ? 'Middels' : 'Avansert'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRecipeForDay(activePickerDay, r.id);
                        }}
                      >
                        Velg
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
