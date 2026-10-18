import React from 'react';

interface RecipeIllustrationProps {
  title: string;
  category?: string;
  tags?: string[];
  className?: string;
}

export const RecipeIllustration: React.FC<RecipeIllustrationProps> = ({
  title,
  category = '',
  tags = [],
  className = '',
}) => {
  const allText = `${title} ${category} ${tags.join(' ')}`.toLowerCase();

  // Pick theme & icon based on content
  let bgGradient = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
  let accentColor = '#d97706';
  let iconType = 'dish';

  if (allText.includes('pasta') || allText.includes('spaghetti') || allText.includes('bolognese')) {
    bgGradient = 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)';
    accentColor = '#ea580c';
    iconType = 'pasta';
  } else if (allText.includes('pannekake') || allText.includes('kake') || allText.includes('dessert') || allText.includes('eple')) {
    bgGradient = 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)';
    accentColor = '#ca8a04';
    iconType = 'baking';
  } else if (allText.includes('laks') || allText.includes('fisk') || allText.includes('salmon')) {
    bgGradient = 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)';
    accentColor = '#0284c7';
    iconType = 'fish';
  } else if (allText.includes('suppe') || allText.includes('sopp') || allText.includes('gryte')) {
    bgGradient = 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)';
    accentColor = '#9333ea';
    iconType = 'soup';
  } else if (allText.includes('vegan') || allText.includes('salat') || allText.includes('falafel') || allText.includes('vegetar')) {
    bgGradient = 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)';
    accentColor = '#16a34a';
    iconType = 'veggie';
  } else if (allText.includes('kjøtt') || allText.includes('biff') || allText.includes('burger')) {
    bgGradient = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
    accentColor = '#dc2626';
    iconType = 'meat';
  }

  return (
    <div
      className={`recipe-illustration-box ${className}`}
      style={{
        background: bgGradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '180px',
        width: '100%',
        color: accentColor,
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.9, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))' }}
      >
        {iconType === 'pasta' && (
          <>
            <path d="M12 2v20" />
            <path d="M17 5v14" />
            <path d="M7 5v14" />
            <path d="M3 12h18" />
            <circle cx="12" cy="12" r="9" />
          </>
        )}
        {iconType === 'baking' && (
          <>
            <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
            <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
            <path d="M2 21h20" />
            <path d="M7 8v2" />
            <path d="M12 8v2" />
            <path d="M17 8v2" />
            <path d="M7 4h.01" />
            <path d="M12 4h.01" />
            <path d="M17 4h.01" />
          </>
        )}
        {iconType === 'fish' && (
          <>
            <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6s-7.56-2.54-8.5-6Z" />
            <path d="M18 12h.01" />
            <path d="M2 16l4.5-4L2 8" />
          </>
        )}
        {iconType === 'soup' && (
          <>
            <path d="M3 11h18a1 1 0 0 1 1 1v2a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7v-2a1 1 0 0 1 1-1Z" />
            <path d="M6 3c1 1.5 1 3.5 0 5" />
            <path d="M12 3c1 1.5 1 3.5 0 5" />
            <path d="M18 3c1 1.5 1 3.5 0 5" />
          </>
        )}
        {iconType === 'veggie' && (
          <>
            <path d="M12 2a9 9 0 0 0-9 9c0 4.97 4.03 9 9 9 2.12 0 4.07-.74 5.61-1.97" />
            <path d="M12 2c5 0 9 4 9 9 0 2.12-.74 4.07-1.97 5.61" />
            <path d="M12 2v20" />
            <path d="M12 12l5-5" />
            <path d="M12 16l-4-4" />
          </>
        )}
        {iconType === 'meat' && (
          <>
            <path d="M19 8c0-3.3-2.7-6-6-6-2.5 0-4.6 1.5-5.5 3.7C6.6 5.3 5.8 5 5 5 2.2 5 0 7.2 0 10c0 2.2 1.4 4 3.3 4.7C3.1 15.4 3 16.2 3 17c0 3.3 2.7 6 6 6 2.5 0 4.6-1.5 5.5-3.7.9.4 1.7.7 2.5.7 2.8 0 5-2.2 5-5 0-2.2-1.4-4-3.3-4.7.2-.7.3-1.5.3-2.3Z" />
            <circle cx="10" cy="11" r="2" />
          </>
        )}
        {iconType === 'dish' && (
          <>
            <ellipse cx="12" cy="14" rx="9" ry="5" />
            <path d="M3 14c0 3 4 5 9 5s9-2 9-5" />
            <path d="M8 7c1 1 1 2 0 3" />
            <path d="M12 5c1 1.5 1 3 0 4.5" />
            <path d="M16 7c1 1 1 2 0 3" />
          </>
        )}
      </svg>
      <span
        style={{
          marginTop: '0.5rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          opacity: 0.85,
        }}
      >
        {category || 'Oppskrift'}
      </span>
    </div>
  );
};
