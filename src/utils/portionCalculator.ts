/**
 * Helper to calculate adjusted ingredient quantities based on servings ratio
 */

// Format numbers nicely: 1.5 -> "1,5", 1.333 -> "1 1/3" or "1,3"
function formatNumber(num: number): string {
  if (Number.isInteger(num)) return num.toString();
  // Round to 1 decimal place or convert to nice fractions if close
  const rounded = Math.round(num * 10) / 10;
  return rounded.toString().replace('.', ',');
}

export function scaleIngredientText(
  ingredientText: string,
  baseServings: number,
  targetServings: number
): string {
  if (!baseServings || !targetServings || baseServings === targetServings) {
    return ingredientText;
  }

  const factor = targetServings / baseServings;

  // Regex to match numbers at start or with fractions e.g. "400 g", "1.5 dl", "1/2 ts", "2-3 stk"
  // 1) Match fraction like 1/2 or 1/4
  const fractionRegex = /^(\d+)\/(\d+)\s*(.*)/;
  const fractionMatch = ingredientText.trim().match(fractionRegex);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    const rest = fractionMatch[3];
    const newQty = (num / den) * factor;
    return `${formatNumber(newQty)} ${rest}`.trim();
  }

  // 2) Match range like "2-3 stk"
  const rangeRegex = /^(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(.*)/;
  const rangeMatch = ingredientText.trim().match(rangeRegex);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(',', '.')) * factor;
    const high = parseFloat(rangeMatch[2].replace(',', '.')) * factor;
    const rest = rangeMatch[3];
    return `${formatNumber(low)}–${formatNumber(high)} ${rest}`.trim();
  }

  // 3) Match standard number at start like "400 g", "2 ss", "1.5 dl", "3 egg"
  const numRegex = /^(\d+(?:[.,]\d+)?)\s*(.*)/;
  const match = ingredientText.trim().match(numRegex);
  if (match) {
    const val = parseFloat(match[1].replace(',', '.'));
    const rest = match[2];
    const scaled = val * factor;
    return `${formatNumber(scaled)} ${rest}`.trim();
  }

  return ingredientText;
}
