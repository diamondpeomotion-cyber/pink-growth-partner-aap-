import { MOCK_PROFESSIONALS, type Professional, useCatalogQuery } from './catalogData';
export function useProfessionals() { return useCatalogQuery<Professional>({ table: 'professionals', fallback: MOCK_PROFESSIONALS }); }
export type { Professional };
export default useProfessionals;
