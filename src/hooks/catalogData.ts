import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Salon { id: string; name: string; city: string; area: string; image_url: string; rating: number; review_count: number; }
export interface Service { id: string; name: string; description: string; price: number; duration_minutes: number; salon_id?: string; category_id?: string; }
export interface Category { id: string; name: string; slug: string; image_url: string; }
export interface Professional { id: string; name: string; title: string; image_url: string; salon_id?: string; rating: number; }

export const MOCK_CATEGORIES: Category[] = [
  { id: 'mock-hair', name: 'Hair', slug: 'hair', image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80' },
  { id: 'mock-nails', name: 'Nails', slug: 'nails', image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80' },
  { id: 'mock-spa', name: 'Spa & Wellness', slug: 'spa-wellness', image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
  { id: 'mock-makeup', name: 'Makeup', slug: 'makeup', image_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80' },
];
export const MOCK_SALONS: Salon[] = [
  { id: 'mock-salon-1', name: 'The Pink Chair', city: 'Mumbai', area: 'Bandra West', image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&q=80', rating: 4.8, review_count: 124 },
  { id: 'mock-salon-2', name: 'Glow Studio', city: 'Mumbai', area: 'Andheri West', image_url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=80', rating: 4.7, review_count: 89 },
  { id: 'mock-salon-3', name: 'Serene Beauty', city: 'Pune', area: 'Koregaon Park', image_url: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=900&q=80', rating: 4.9, review_count: 156 },
];
export const MOCK_SERVICES: Service[] = [
  { id: 'mock-service-1', name: 'Women’s Haircut', description: 'Consultation, wash, cut and finish.', price: 800, duration_minutes: 60, category_id: 'mock-hair' },
  { id: 'mock-service-2', name: 'Classic Manicure', description: 'Shape, cuticle care and polish.', price: 600, duration_minutes: 45, category_id: 'mock-nails' },
  { id: 'mock-service-3', name: 'Relaxation Facial', description: 'A restorative facial for healthy-looking skin.', price: 1200, duration_minutes: 75, category_id: 'mock-spa' },
];
export const MOCK_PROFESSIONALS: Professional[] = [
  { id: 'mock-pro-1', name: 'Ananya Sharma', title: 'Senior Stylist', image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&q=80', rating: 4.9 },
  { id: 'mock-pro-2', name: 'Meera Kapoor', title: 'Beauty Therapist', image_url: 'https://images.unsplash.com/photo-1595959183082-7bce3b7b8f4a?w=400&q=80', rating: 4.8 },
  { id: 'mock-pro-3', name: 'Riya Patel', title: 'Nail Artist', image_url: 'https://images.unsplash.com/photo-1569919047027-7d9c5f5f4b8e?w=400&q=80', rating: 4.7 },
];

type CatalogSource = 'loading' | 'supabase' | 'mock';
export interface CatalogResult<T> { data: T[]; loading: boolean; isLoading: boolean; source: CatalogSource; error: unknown | null; refetch: () => Promise<void>; }
interface QueryOptions<T> { table: string; fallback: T[]; client?: SupabaseClient | null; }

/** Database-first catalogue query with a non-empty mock fallback. */
export function useCatalogQuery<T>({ table, fallback, client = supabase }: QueryOptions<T>): CatalogResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<CatalogSource>('loading');
  const [error, setError] = useState<unknown | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      if (!client) throw new Error('Supabase is not configured');
      const result = await client.from(table).select('*');
      if (result.error) throw result.error;
      const rows = Array.isArray(result.data) ? result.data : [];
      if (rows.length > 0) {
        setData(rows as T[]);
        setSource('supabase');
        setError(null);
      } else {
        setData(fallback);
        setSource('mock');
        setError(null);
      }
    } catch (queryError) {
      setData(fallback);
      setSource('mock');
      setError(queryError);
    } finally {
      setLoading(false);
    }
  }, [client, fallback, table]);

  // Queue the initial request so the effect only schedules external I/O; the
  // loading state remains true until that request resolves.
  useEffect(() => { void Promise.resolve().then(refetch); }, [refetch]);
  useEffect(() => {
    if (!client || typeof window === 'undefined') return;
    const channel = client.channel(`customer-catalog-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => { void refetch(); })
      .subscribe();
    // Some Supabase projects do not have Realtime enabled, so retain a quiet
    // polling safety net for new rows published after the initial request.
    const timer = window.setInterval(() => { void refetch(); }, 30_000);
    return () => { window.clearInterval(timer); void client.removeChannel(channel); };
  }, [client, refetch, table]);

  return { data, loading, isLoading: loading, source, error, refetch };
}
