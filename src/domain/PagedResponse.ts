// Shared paged response envelope — mirrors OpenAPI SessionResponsePagedResponse.
// Generic so it can be reused for other paged resources in the future.
export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
