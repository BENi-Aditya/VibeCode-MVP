import { b9 as QueryBehavior, a7 as InfiniteData, ad as InfiniteQueryPageParamsOptions } from './hydration-YFGUKxMa.cjs';
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
