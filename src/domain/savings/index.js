// Pure savings functions — no React dependencies.
// All functions return new arrays/objects; none mutate in place.

export function addSavingsAccount(accounts, form) {
  if (!form.name.trim()) return accounts;
  return [...accounts, {
    id: Date.now(),
    name: form.name.trim(),
    currency: form.currency || 'ARS',
    transactions: [],
  }];
}

export function deleteSavingsAccount(accounts, id) {
  return accounts.filter(a => a.id !== id);
}

export function addSavingsTx(accounts, accId, txForm, dateStr) {
  const amt = parseFloat(txForm.amount);
  if (!amt || amt <= 0) return accounts;
  const finalAmt = txForm.type === 'sub' ? -amt : amt;
  return accounts.map(a => a.id !== accId ? a : {
    ...a,
    transactions: [...a.transactions, {
      id: Date.now(),
      amount: finalAmt,
      note: txForm.note || '',
      date: dateStr,
    }],
  });
}

export function deleteSavingsTx(accounts, accId, txId) {
  return accounts.map(a => a.id !== accId ? a : {
    ...a,
    transactions: a.transactions.filter(t => t.id !== txId),
  });
}

export function renameSavingsAccount(accounts, id, name) {
  if (!name.trim()) return accounts;
  return accounts.map(a => a.id !== id ? a : { ...a, name: name.trim() });
}

export function setSavingsAccountCurrency(accounts, id, currency) {
  return accounts.map(a => a.id !== id ? a : { ...a, currency });
}

export function getAccountBalance(acc) {
  return acc.transactions.reduce((sum, t) => sum + t.amount, 0);
}

/** Sum of ARS-denominated account balances. */
export function computeSavingsTotal(accounts) {
  return accounts
    .filter(a => a.currency === 'ARS')
    .reduce((sum, a) => sum + getAccountBalance(a), 0);
}

/** Total contributed to saving goals in a given month/year. */
export function computeSavingGoalsTot(savingGoals, month, year) {
  return savingGoals.reduce((sum, g) =>
    sum + g.contributions
      .filter(c => c.month === month && c.year === year)
      .reduce((a, c) => a + c.amount, 0),
    0
  );
}
