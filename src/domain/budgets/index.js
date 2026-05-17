// Pure budget functions — no React dependencies.
// Re-exports utils/budgets and adds higher-level helpers.

export { bKey, effectiveBudget } from '../../utils/budgets.js';
import { bKey, effectiveBudget } from '../../utils/budgets.js';

/**
 * Computes effective budgets for every category in a given month/year.
 * Returns a plain { [categoryName]: number } map.
 */
export function computeEffBudgets(categories, selMonth, selYear, base, overrides) {
  const result = {};
  categories.forEach(c => {
    result[c.name] = effectiveBudget(c.name, selMonth, selYear, base, overrides);
  });
  return result;
}

/**
 * Returns a new overrides map with the budget for (year, month, cat) updated.
 */
export function applyBudgetOverride(overrides, selYear, selMonth, cat, val) {
  return { ...overrides, [bKey(selYear, selMonth, cat)]: parseFloat(val) || 0 };
}
