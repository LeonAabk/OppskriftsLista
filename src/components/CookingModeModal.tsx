import React, { useState } from 'react';
import { Recipe } from '../types';
import { scaleIngredientText } from '../utils/portionCalculator';

interface CookingModeModalProps {
  recipe: Recipe;
  servings: number;
  onClose: () => void;
  onOpenTimer: () => void;
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({
  recipe,
  servings,
  onClose,
  onOpenTimer,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);

  const steps = recipe.instructions || [];
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="cooking-mode-overlay" role="dialog" aria-modal="true">
      <div className="cooking-mode-container">
        {/* Header */}
        <div className="cooking-mode-header">
          <div>
            <span className="cooking-badge">Kokemodus</span>
            <h2 className="cooking-recipe-title">{recipe.title}</h2>
          </div>
          <div className="cooking-header-actions">
            <button
              type="button"
              className="btn-outline small"
              onClick={onOpenTimer}
            >
              ⏱ Timer
            </button>
            <button
              type="button"
              className="btn-outline small"
              onClick={() => setShowIngredients((prev) => !prev)}
            >
              🥗 {showIngredients ? 'Skjul ingredienser' : 'Vis ingredienser'}
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              aria-label="Avslutt kokemodus"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="cooking-progress-container">
          <div
            className="cooking-progress-bar"
            style={{
              width: totalSteps > 0 ? `${((currentStepIndex + 1) / totalSteps) * 100}%` : '0%',
            }}
          />
        </div>

        <div className="cooking-mode-body">
          {/* Main step content */}
          <div className="cooking-step-card">
            <div className="step-counter">
              Steg {currentStepIndex + 1} av {totalSteps}
            </div>
            <div className="step-instruction-text">
              {steps[currentStepIndex] || 'Ingen instruksjon for dette steget.'}
            </div>

            <div className="cooking-nav-controls">
              <button
                type="button"
                className="btn-outline large"
                disabled={currentStepIndex === 0}
                onClick={handlePrev}
              >
                ← Forrige steg
              </button>
              {currentStepIndex < totalSteps - 1 ? (
                <button
                  type="button"
                  className="btn-primary large"
                  onClick={handleNext}
                >
                  Neste steg →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary large"
                  onClick={onClose}
                >
                  Ferdig med oppskriften! 🎉
                </button>
              )}
            </div>
          </div>

          {/* Quick ingredients side panel */}
          {showIngredients && (
            <aside className="cooking-ingredients-sidebar">
              <h3>Ingredienser ({servings} porsjoner)</h3>
              <ul className="cooking-ingredients-list">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx}>
                    {scaleIngredientText(ing.name, recipe.servings, servings)}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
