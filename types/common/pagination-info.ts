/**
 * Pagination metadata.
 * Describes the requested page and the total number of pages available for a result set.
 */
export interface PaginationInfo {
  /** Total number of records matching the query. */
  total: number;
  /** Current one-based page number. */
  page: number;
  /** Maximum number of records requested per page. */
  limit: number;
  /** Total number of pages available for the result set. */
  pages: number;
}
