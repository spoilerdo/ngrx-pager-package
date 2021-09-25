import { Observable } from "rxjs";
import { PagerConfig } from "./pager.reducer";

/**
 * Abstract class to configure a pager state management instance.
 * Implement this class to make implementation for the load (pagination) and delete back-end calls.
 * You also need to add a Provider in the .module where the new state is being used.
 *
 * **Providing custom configuration example:**
 * ```ts
 * providers: [{ provide: PagerStateConfig, useExisting: PagerConfigImplementation }]
 * ```
 *
 * **Pager state config custom implementation:**
 * ```ts
 * Injectable({
 *   providedIn: 'root',
 * })
 * export class CustomPagerConfig implements PagerStateConfig {
 *
 *   constructor(private readonly cdnService: CdnService) {
 *     super('IMAGE_META');
 *   }
 *
 *   pagerLoadFunc(config: PagerConfig): Observable<PagerFunc> {
 *     return this.cdnService.getAllMetaData(config.currentPage, config.filters.limit).pipe(
 *       map(({ serviceableMetas, totalElements }) => ({ elements: serviceableMetas, totalElements }))
 *     );
 *   }
 *
 *   pagerSearchFunc(keyword: string, page: number, size: number): Observable<PagerFunc> {
 *     return this.cdnService.searchMetaDataByTag(keyword, page, size).pipe(
 *       map(({ serviceableMetas, totalElements }) => ({ elements: serviceableMetas, totalElements }))
 *     );
 *   }
 *
 *   pagerDeleteFunc(id: string): Observable<unknown> {
 *     return this.cdnService.deleteServiceable(id);
 *   }
 * }
 * ```
 */
export abstract class PagerStateConfig {
  pageSubject: string;
  totalElKey: string;

  constructor(pageSubject: string) {
    this.pageSubject = pageSubject;
    this.totalElKey = `${pageSubject}_TOTAL_EL`;
  }

  /**
   * Get the session storage key of an page using the current page, limit and subject.
   */
  pageKey(currentPage: number, limit: number) { return `${this.pageSubject}_${currentPage}_${limit}`; }

  /**
   * Used when loading elements into the pager.
   * It is important that the return is an observable of type PagerFunc.
   */
  abstract pagerLoadFunc(config: PagerConfig): Observable<PagerFunc>;
  /**
   * Used when searching for a specific element.
   * It is important that the return is an observable of type PagerFunc.
   */
  abstract pagerSearchFunc(keyword: string, page: number, size: number): Observable<PagerFunc>
  abstract pagerDeleteFunc(id: string, config?: PagerConfig): Observable<unknown>;
}

export type PagerFunc = {
  elements: unknown[],
  totalElements: number
}
