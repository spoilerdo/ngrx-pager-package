import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';
import { PagerActions } from './pager.action';

import { PagerConfig, PagerList } from './pager.reducer';
import { PagerSelector } from './pager.selector';

/**
 * Needs to be provided in a module to retrieve information from the pager state.
 *
 * @param FEATURE_KEY pass to a new PagerAction **Important: needs to be the same for the corresponding reducer and effect**.
 * @param pagerStore default parameter for a NGRX facade
 *
 * **Provider code example:**
 * ```ts
 * {
 * provide: PagerFacade,
 * useFactory: (Store) => new PagerFacade(fromModule.MODULE_FEATURE_KEY, Store),
 * deps: [Store]
 * },
 * ```
 */
@Injectable()
export class PagerFacade {
  private selector: PagerSelector;
  private pagerActions: PagerActions;

  public elements$: Observable<any>;
  public pagerConfig$: Observable<any>;
  public pagerIsLoading$: Observable<any>;
  public totalElements$: Observable<any>;
  public totalPages$: Observable<any>

  constructor(
    private readonly FEATURE_KEY: string,
    private pagerStore: Store<PagerList>
  ) {
    this.selector = new PagerSelector(this.FEATURE_KEY);
    this.pagerActions = new PagerActions(this.FEATURE_KEY);

    this.elements$ = this.pagerStore.select(this.selector.getElements);
    this.pagerConfig$ = this.pagerStore.select(this.selector.getPagerConfig);
    this.pagerIsLoading$ = this.pagerStore.select(this.selector.isLoading);
    this.totalElements$ = this.pagerStore.select(this.selector.getTotalElements);
    this.totalPages$ = this.totalElements$.pipe(
      withLatestFrom(this.pagerConfig$),
      map(([ totalElements, config ]) =>
        Array.from(new Array(Math.ceil(totalElements / config.filters.limit)), (val, i) => i + 1))
    );
  }

  public setPage(page: number, id?: string) {
    this.pagerStore.dispatch(this.pagerActions.setPage({ page, id }));
  }

  public setPagerConfig(config: PagerConfig) {
    this.pagerStore.dispatch(this.pagerActions.setConfig({ config }));
  }

  public searchForElement(keyword: string) {
    this.pagerStore.dispatch(this.pagerActions.setSearchKeyword({ keyword }));
  }

  public addElement(element: unknown) {
    this.pagerStore.dispatch(this.pagerActions.addElement({ element }));
  }

  public deleteElement(element: unknown) {
    this.pagerStore.dispatch(this.pagerActions.deleteElement({ element }));
  }
}
