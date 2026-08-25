import { MOCK_CATEGORIES, type Category, useCatalogQuery } from './catalogData';
export function useCategories() { return useCatalogQuery<Category>({ table: 'categories', fallback: MOCK_CATEGORIES }); }
export type { Category };
export default useCategories;
