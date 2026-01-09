import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedQueryInput {
  table: string;
  select: string;
  organizationId?: string;
  options: PaginationOptions;
  queryKey: (string | number | object | undefined)[];
}

export function usePaginatedQuery<T>({
  table,
  select,
  organizationId,
  options,
  queryKey,
}: PaginatedQueryInput) {
  return useQuery<PaginatedResult<T>>({
    queryKey,
    queryFn: async () => {
      if (!organizationId) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: options.page,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }

      let query = supabase
        .from(table)
        .select(select, { count: 'exact' })
        .eq('organization_id', organizationId);

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return;
          if (Array.isArray(value)) {
            query = query.in(key, value as any);
          } else {
            query = query.eq(key, value as any);
          }
        });
      }

      if (options.sortBy) {
        query = query.order(options.sortBy, { ascending: options.sortOrder !== 'desc' });
      }

      const start = (options.page - 1) * options.pageSize;
      const end = start + options.pageSize - 1;

      const { data, count, error } = await query.range(start, end);

      if (error) {
        throw error;
      }

      const totalCount = count ?? 0;
      const totalPages = Math.ceil(totalCount / options.pageSize) || 1;

      return {
        data: (data || []) as T[],
        totalCount,
        totalPages,
        currentPage: options.page,
        hasNextPage: options.page < totalPages,
        hasPreviousPage: options.page > 1,
      };
    },
  });
}
