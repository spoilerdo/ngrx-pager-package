import { createAction, props } from '@ngrx/store';
import { ElementsPage } from './pager.reducer';

export class PagerActions {
  //#region vars

  public loadPage;
  public loadPageSuccess;
  public loadPageFail;

  public addElement;

  public deleteElement;
  public deleteElementSuccess;
  public deleteElementFail;

  public setSearchKeyword;
  public searchForElement;
  public searchForElementSuccess;
  public searchForElementFail;

  public setPage;
  public setConfig;

  //#endregion

  constructor(keyword: string) {
    this.loadPage = createAction(`[${keyword}] Load Pager`);
    this.loadPageSuccess = createAction(
      `[${keyword}] Load Page Success`,
      props<{ elements: ElementsPage[], totalElements: number }>()
    );
    this.loadPageFail = createAction(`[${keyword}] Load Page Fail`, props<{ error: Error }>());

    this.addElement = createAction(`[${keyword}] Add Element`, props<{ element: unknown }>());

    this.deleteElement = createAction(`[${keyword}] Delete Element`, props<{ element: unknown }>());
    this.deleteElementSuccess = createAction(
      `[${keyword}] Delete Element Success`,
      props<{ element: unknown }>()
    );
    this.deleteElementFail = createAction(`[${keyword}] Delete Element Fail`, props<{ error: Error }>());

    this.setSearchKeyword = createAction(`[${keyword}] Set Search Keyword`, props<{ keyword: string }>());
    this.searchForElement = createAction(`[${keyword}] Search For Element`, props<{ keyword: string }>());
    this.searchForElementSuccess = createAction(
      `[${keyword}] Search For Element Success`,
      props<{ elements: ElementsPage[], totalElements: number }>()
    );
    this.searchForElementFail = createAction(`[${keyword}] Search For Element Fail`, props<{ error: Error }>());

    this.setPage = createAction(`[${keyword}] Set Page`, props<{ page: number, id?: string }>());
    this.setConfig = createAction(`[${keyword}] Set Config`, props<{ config: any }>());
  }
}
