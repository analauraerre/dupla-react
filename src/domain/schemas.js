import { z } from 'zod';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  SEED,
} from '../utils/constants.js';

export const CURRENT_SCHEMA_VERSION = 1;

const numberValue = z.coerce.number().finite().catch(0);
const positiveNumber = z.coerce.number().finite().nonnegative().catch(0);
const stringValue = z.coerce.string().catch('');
const nullableString = z.string().nullable().optional();

const safeArray = (schema) =>
  z.array(schema.catch(null)).catch([]).transform(items => items.filter(Boolean));

const CategorySchema = z.object({
  name: stringValue,
  icon: stringValue,
  color: stringValue,
  bg: stringValue,
}).passthrough();

const ExpenseSchema = z.object({
  id: z.union([z.number(), z.string()]).catch(() => Date.now()),
  description: stringValue,
  amount: numberValue,
  category: stringValue,
  user: stringValue,
  date: stringValue,
  tags: z.array(z.unknown()).catch([]),
  paymentMethod: stringValue.optional(),
  installments: positiveNumber.optional(),
}).passthrough();

const IncomeSchema = z.object({
  id: z.union([z.number(), z.string()]).catch(() => Date.now()),
  description: stringValue,
  amount: numberValue,
  user: stringValue,
  incomeCategory: stringValue.optional(),
  month: z.coerce.number().int().min(0).max(11).catch(0),
  year: z.coerce.number().int().catch(new Date().getFullYear()),
}).passthrough();

const SavingGoalSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: stringValue.optional(),
  target: numberValue.optional(),
  contributions: safeArray(z.object({
    id: z.union([z.number(), z.string()]).optional(),
    amount: numberValue,
    month: z.coerce.number().int().min(0).max(11).catch(0),
    year: z.coerce.number().int().catch(new Date().getFullYear()),
  }).passthrough()),
}).passthrough();

const RecurringExpenseSchema = ExpenseSchema.extend({
  active: z.coerce.boolean().catch(true),
  dayOfMonth: z.coerce.number().int().min(1).max(31).catch(1),
}).passthrough();

const CreditCardSchema = z.object({
  id: z.union([z.number(), z.string()]).catch(() => Date.now()),
  name: stringValue,
  limit: numberValue.catch(0),
}).passthrough();

const SavingsTransactionSchema = z.object({
  id: z.union([z.number(), z.string()]).catch(() => Date.now()),
  amount: numberValue,
  note: stringValue.optional(),
  date: stringValue,
}).passthrough();

const SavingsAccountSchema = z.object({
  id: z.union([z.number(), z.string()]).catch(() => Date.now()),
  name: stringValue,
  currency: z.enum(['ARS', 'USD', 'EUR']).catch('ARS'),
  transactions: safeArray(SavingsTransactionSchema),
}).passthrough();

export const AppDataSchema = z.object({
  categories: safeArray(CategorySchema).default(DEFAULT_CATEGORIES),
  incomeCategories: safeArray(CategorySchema).default(DEFAULT_INCOME_CATEGORIES),
  expenses: safeArray(ExpenseSchema),
  incomes: safeArray(IncomeSchema),
  savingGoals: safeArray(SavingGoalSchema),
  baseBudgets: z.record(z.string(), numberValue).catch(SEED.baseBudgets),
  budgetOverrides: z.record(z.string(), numberValue).catch({}),
  incomeBaseBudgets: z.record(z.string(), numberValue).catch(SEED.incomeBaseBudgets),
  incomeBudgetOverrides: z.record(z.string(), numberValue).catch({}),
  recurringExpenses: safeArray(RecurringExpenseSchema),
  monthNotes: z.record(z.string(), z.unknown()).catch({}),
  creditCards: safeArray(CreditCardSchema),
  splits: z.array(z.unknown()).catch([]),
  savingsAccounts: safeArray(SavingsAccountSchema),
}).passthrough();

export const VersionedAppDataSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  data: AppDataSchema,
  savedAt: nullableString,
}).passthrough();

export function createDefaultAppData() {
  return AppDataSchema.parse(SEED);
}
