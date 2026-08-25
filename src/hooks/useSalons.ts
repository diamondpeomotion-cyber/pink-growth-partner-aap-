import { MOCK_SALONS, type Salon, useCatalogQuery } from './catalogData';
export function useSalons() { return useCatalogQuery<Salon>({ table: 'salons', fallback: MOCK_SALONS }); }
export type { Salon };
export default useSalons;
