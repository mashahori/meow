// English names double as translation keys; see language-context.tsx.
const categoryGroupNames: Record<string, string> = {
  food: 'Food',
  'eating-out': 'Cafes and restaurants',
  rent: 'Rent',
  mortgage: 'Mortgage',
  utilities: 'Utilities',
  communication: 'Phone and internet',
  home: 'Home and household',
  transport: 'Transport',
  health: 'Health',
  clothing: 'Clothing and footwear',
  beauty: 'Beauty and care',
  children: 'Children',
  pets: 'Pets',
  education: 'Education',
  sport: 'Sport',
  entertainment: 'Entertainment',
  travel: 'Travel',
  gifts: 'Gifts',
  loan: 'Loan',
  taxes: 'Taxes and fees',
};

// A group added on the server before the client knows its name is shown by its slug.
export function getCategoryGroupName(slug: string): string {
  return categoryGroupNames[slug] ?? slug;
}
