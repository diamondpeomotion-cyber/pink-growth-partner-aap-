import { MOCK_SERVICES, type Service, useCatalogQuery } from './catalogData';
export function useServices() { return useCatalogQuery<Service>({ table: 'services', fallback: MOCK_SERVICES }); }
export type { Service };
export default useServices;
