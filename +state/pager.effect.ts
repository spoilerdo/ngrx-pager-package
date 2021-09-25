import { Injectable } from '@angular/core';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';

import { ToasterService } from '../../toaster/services/toaster.service';
import { PagerStateConfig } from './pager.config';
import { PagerFacade } from './pager.facade';
import { PagerActions } from './pager.action';

/**
 * When using the paginator state you want to extend this class into a new service.
 * The service needs to contain a constructor with a super().
 * The new service then needs to be imported into the corresponding module with EffectsModule.
 *
 * @param actions$ default parameter for a NGRX effect service.
 * @param toasterService used to display information to the user about API calls.
 * @param FEATURE_KEY pass to a new PagerAction **Important: needs to be the same for the corresponding reducer and facade**.
 * @param config the pager state config made for the pager state (same as for the reducer).
 * @param facade the pager facade provided by the module this state will be used in.
 */

@Injectable()
export class PagerEffects {
  private pagerActions;

  setPage$: unknown;
  addElement$: unknown;
  deleteElement$: unknown;
  deleteElementSuccess$: unknown;
  setSearchKeyword$: unknown;
  searchForElement$: unknown;
  loadPage$: unknown;

  constructor(
    protected readonly actions$: Actions,
    protected readonly toasterService: ToasterService,
    protected readonly FEATURE_KEY: string,
    protected readonly config: PagerStateConfig,
    protected readonly facade: PagerFacade,
  ) {
    this.pagerActions = new PagerActions(this.FEATURE_KEY);

    this.setPage$ = createEffect(() =>
      this.actions$.pipe(
        ofType(this.pagerActions.setPage),
        withLatestFrom(this.facade.pagerConfig$),
        map(([ _, { filters: { keyword } } ]) => {
          return keyword && keyword !== '' ?
          this.pagerActions.searchForElement({ keyword }) :
          this.pagerActions.loadPage()
        })
      )
    );

    this.addElement$ = createEffect(() =>
      this.actions$.pipe(
        ofType(this.pagerActions.addElement),
        map(() => this.pagerActions.loadPage())
      )
    );

    this.deleteElement$ = createEffect(() =>
      this.actions$.pipe(
        ofType(this.pagerActions.deleteElement),
        withLatestFrom(this.facade.pagerConfig$),
        concatMap(([{ element }, config]) => {
          return this.config.pagerDeleteFunc(element.id, config).pipe(
            map(() => {
              this.toasterService.showToast('Bye', 'Deleted successfully!', 'info');
              return this.pagerActions.deleteElementSuccess({ element })
            }),
            catchError((error) => of(this.pagerActions.deleteElementFail({ error })))
          )
        })
      )
    );

    this.deleteElementSuccess$ = createEffect(() =>
      this.actions$.pipe(
        ofType(this.pagerActions.deleteElementSuccess),
        map(() => this.pagerActions.loadPage())
      )
    );

    this.setSearchKeyword$ = createEffect(() =>
      this.actions$.pipe(
        ofType(this.pagerActions.setSearchKeyword),
        map(({ keyword }) => this.pagerActions.searchForElement({ keyword }))
      )
    );

    this.searchForElement$ = createEffect(() =>
      this.actions$.pipe(
        ofType(this.pagerActions.searchForElement),
        withLatestFrom(this.facade.pagerConfig$),
        concatMap(([{ keyword }, config]) => {
          return this.config.pagerSearchFunc(keyword, config.currentPage, config.filters.limit).pipe(
            map(({ elements, totalElements }) => {
              return this.pagerActions.searchForElementSuccess({
                elements: [{ elements, page: config.currentPage }], totalElements
              })
            }),
            catchError((error) => of(this.pagerActions.searchForElementFail({ error })))
          )
        })
      )
    );

    this.loadPage$ = createEffect(() =>
      this.actions$.pipe(
        ofType(this.pagerActions.loadPage),
        withLatestFrom(this.facade.pagerConfig$),
        concatMap(([_, config]) => {
          const { totalElKey } = this.config;
          const metaKey = this.config.pageKey(config.currentPage, config.filters.limit);
          const localElement: unknown[] | null = JSON.parse(sessionStorage.getItem(metaKey));
          const localTotalElements: number | null = JSON.parse(sessionStorage.getItem(totalElKey));

          if (!localElement) {
            return this.config.pagerLoadFunc(config).pipe(
              map(({ elements, totalElements }) => {
                sessionStorage.setItem(metaKey, JSON.stringify(elements));
                if (localTotalElements != totalElements) {
                  sessionStorage.setItem(totalElKey, JSON.stringify(totalElements));
                }

                return this.pagerActions.loadPageSuccess({
                  elements: [{ elements, page: config.currentPage }], totalElements
                })
              }),
              catchError((error) => of(this.pagerActions.loadPageFail({ error })))
            )
          }

          return of(this.pagerActions.loadPageSuccess({
            elements: [{ elements: localElement, page: config.currentPage }],
            totalElements: localTotalElements
          }));
        })
      )
    );
  }
}
