// Pure movement functions — no React dependencies.
// All functions return new arrays/objects; none mutate in place.

export function filterExpensesByMonth(expenses, month, year) {
  return expenses.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

export function filterIncomesByMonth(incomes, month, year) {
  return incomes.filter(i => i.month === month && i.year === year);
}

export function addExpense(expenses, exp) {
  return [...expenses, exp];
}

export function editExpense(expenses, id, updates) {
  return expenses.map(e => e.id === id ? { ...e, ...updates } : e);
}

export function deleteExpense(expenses, id) {
  return expenses.filter(e => e.id !== id);
}

export function addIncome(incomes, form, selMonth, selYear) {
  return [...incomes, {
    ...form,
    id: Date.now(),
    amount: parseFloat(form.amount),
    month: selMonth,
    year: selYear,
  }];
}

export function editIncome(incomes, id, updates) {
  return incomes.map(i => i.id === id ? { ...i, ...updates } : i);
}

export function deleteIncome(incomes, id) {
  return incomes.filter(i => i.id !== id);
}

/**
 * Applies active recurring expenses that haven't been registered yet this month.
 * @param {Array} recurring - RecurringExpense[]
 * @param {Array} expenses  - Expense[]
 * @param {Date}  refDate   - Reference date (injectable for testing)
 * @returns {Array} New expenses to append (empty if nothing to add)
 */
export function applyRecurring(recurring, expenses, refDate) {
  const ref = refDate || new Date();
  const m = ref.getMonth(), y = ref.getFullYear(), d = ref.getDate();
  const toAdd = [];

  recurring.filter(r => r.active).forEach(r => {
    if ((r.dayOfMonth || 1) > d) return;
    const already = expenses.some(e => {
      const dt = new Date(e.date + 'T00:00:00');
      return e.description === r.description && dt.getMonth() === m && dt.getFullYear() === y;
    });
    if (!already) toAdd.push({
      ...r,
      id: Date.now() + Math.random(),
      date: `${y}-${String(m + 1).padStart(2, '0')}-${String(r.dayOfMonth || 1).padStart(2, '0')}`,
      tags: [],
      installments: 1,
    });
  });

  return toAdd;
}
