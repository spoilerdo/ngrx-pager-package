import { createFeatureSelector, createSelector, DefaultProjectorFn, MemoizedSelector } from '@ngrx/store';
import { PagerList } from './pager.reducer';

export class PagerSelector {
  //#region vars

  private FEATURE_KEY;

  // eslint-disable-next-line @typescript-eslint/ban-types
  private getPagerList: MemoizedSelector<object, PagerList, DefaultProjectorFn<PagerList>>;

  public getPagerConfig;
  public getElements;
  public getTotalElements;
  public isLoading;

  //#endregion

  constructor(featureKey: string) {
    this.FEATURE_KEY = featureKey;
    this.getPagerList = createFeatureSelector<PagerList>(this.FEATURE_KEY);

    this.getPagerConfig = createSelector(this.getPagerList, (state: PagerList) => state.config);

    this.getElements = createSelector(this.getPagerList, (state: PagerList) => {
      const filtered = state.pages.find(p => p.page === state.config.currentPage);
      return filtered ?
        filtered.elements :
        []
    });
    this.getTotalElements = createSelector(this.getPagerList, (state: PagerList) => state.totalElements);
    this.isLoading = createSelector(this.getPagerList, (state: PagerList) => state.loading);
  }
}
