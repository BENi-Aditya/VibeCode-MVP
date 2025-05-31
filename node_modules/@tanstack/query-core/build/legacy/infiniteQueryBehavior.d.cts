import { b4 as QueryBehavior, a2 as InfiniteData, a8 as InfiniteQueryPageParamsOptions } from './hydration-DgVqMV9G.cjs';
import './removable.cjs';
import './subscribable.cjs';

declare function infiniteQueryBehavior<TQueryFnData, TError, TData, TPageParam>(pages?: number): QueryBehavior<TQueryFnData, TError, InfiniteData<TData, TPageParam>>;
/**
 * Checks if there is a next page.
 */
declare function hasNextPage(options: InfiniteQueryPageParamsOptions<any, any>, data?: InfiniteData<unknown>): boolean;
/**
 * Checks if there is a previous page.
 */
declare function hasPreviousPage(options: InfiniteQueryPageParamsOptions<any, any>, data?: InfiniteData<unknown>): boolean;

export { hasNextPage, hasPreviousPage, infiniteQueryBehavior };
