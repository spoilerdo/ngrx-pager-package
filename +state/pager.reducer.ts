import { createReducer, on, Action } from "@ngrx/store";

import { PagerActions } from "./pager.action";
import { PagerStateConfig } from "./pager.config";

export interface PagerList {
  pages: ElementsPage[];
  totalElements: number;
  loading: boolean;
  loaded: boolean;
  config: PagerConfig;
}

export interface ElementsPage {
  elements: unknown[];
  page: number;
}

export interface PagerConfig {
  currentPage: number;
  filters: Filters;
}

export interface Filters {
  keyword?: string;
  limit?: number;
  type?: string;
  id?: string;
}

export const pagerListInitialState: PagerList = {
  config: {
    currentPage: 0,
    filters: {
      keyword: null,
      limit: 12,
      type: null,
      id: null,
    },
  },
  pages: [],
  totalElements: 0,
  loaded: false,
  loading: false,
};

/**
 * BC of the addition/ subtraction of one item all the following pages are not in sync anymore so remove them from storage.
 * No way to be sure to see how many sessions need to be removed so just take the whole length,
 * and start from the page the element was deleted from.
 * To be clear the previous pages will not be removed because they are still in sync.
 * @param stateConfig the pager global state configuration
 * @param currentPage to start deleting from
 */
 const clearSessionStorage = (stateConfig: PagerStateConfig, currentPage: number) => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key.includes(stateConfig.pageSubject)) {
      const keyInfo = key.split('_');
      const pageNumber: number = +keyInfo[keyInfo.length - 2];
      if (pageNumber > currentPage) {
        keysToRemove.push(key);
      }
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key))
}

/**
 * split an array back into pages given the original pages as reference
 * @param arr array to be split back into pages
 * @param pages the original pages
 * @param limit of the page
 * @returns the new pages
 */
const splitArrayIntoPages = (arr: unknown[], pages: ElementsPage[], limit: number): ElementsPage[] => {
  const newPages: ElementsPage[] = [];
  const oldPages = [...pages];
  oldPages.sort((a: ElementsPage, b: ElementsPage) => {
    if(a.page < b.page) return -1;
    if(a.page > b.page) return 1;
    return 0;
  });
  oldPages.forEach(pageElement => {
    newPages.push({
      elements: arr.splice(0, limit),
      page: pageElement.page
    });
  });

  return newPages;
}

/**
 * Imported into a new reducer class to create a pager reducer.
 * Pass a FEATURE_KEY so that the pager is unique to other pager used in the project.
 *
 * **Usage example:**
 * ```ts
 * const allInjector = Injector.create({ providers: [{provide: ModuleAllPagerConfig, deps: []}]});
 * export function moduleAllReducer(state: PagerList | undefined, action: Action) {
 *   const stateConfig: ModuleAllPagerConfig = allInjector.get(ModuleAllPagerConfig);
 *   return createPagerReducer(stateConfig, ALL_MODULE_FEATURE_KEY, state, action);
 * }
 * export const ALL_MODULE_FEATURE_KEY = 'allModulePagerList';
 * ````
 *
 * @param stateConfig the pager state config made for the pager state (same as for the effect).
 * @param FEATURE_KEY pass to a new PagerAction **Important: needs to be the same for the corresponding effect and facade**.
 * @param state default parameter for NGRX reducer
 * @param action default parameter for NGRX reducer
 */
export function createPagerReducer(stateConfig: PagerStateConfig, FEATURE_KEY: string, state: PagerList | undefined, action: Action) {
  const pagerActions = new PagerActions(FEATURE_KEY);
  const pagerReducer = createReducer(
    pagerListInitialState,
    on(
      pagerActions.setPage,
      (state, action) => {
        const filters = {
          ...state.config.filters,
          id: action.id,
        };
        const config = {
          ...state.config,
          currentPage: action.page,
          filters,
        };
        return { ...state, config };
      }
    ),
    on(pagerActions.setConfig, (state, action) => ({
      ...state,
      config: action.config
    })),
    on(pagerActions.loadPage, (state) => ({
      ...state,
      loading: true
    })),
    on(pagerActions.loadPageSuccess, (state, action) => {
      const pageExists = state.pages.find(p => p.page === state.config.currentPage);
      if (pageExists) {
        return {
          ...state,
          loading: false,
          loaded: true
        }
      }

      return {
        ...state,
        pages: [...state.pages, ...action.elements],
        totalElements: action.totalElements,
        loading: false,
        loaded: true,
      }
    }),
    on(pagerActions.loadPageFail, (state) => ({
      ...state,
      config: {
        ...state.config,
        currentPage: state.config.currentPage <= 0 ? 0 : state.config.currentPage - 1,
      },
      loading: false,
      loaded: true,
    })),
    on(pagerActions.setSearchKeyword, (state, action) => ({
      ...state,
      pages: [],
      config: {
        ...state.config,
        currentPage: 0,
        filters: {
          ...state.config.filters,
          keyword: action.keyword
        }
      }
    })),
    on(pagerActions.searchForElement, (state) => ({
      ...state,
      loading: true
    })),
    on(pagerActions.searchForElementSuccess, (state, action) => ({
      ...state,
      pages: [...state.pages, ...action.elements],
      totalElements: action.totalElements,
      loading: false,
      loaded: true,
    })),
    on(pagerActions.searchForElementFail, (state) => ({
      ...state,
      loading: false,
      loaded: true
    })),
    on(pagerActions.addElement, (state, action) => {
      // Flatten pages to one single array of elements.
      const arr = ([] as unknown[]).concat(...state.pages.map(p => [...p.elements]));

      // Add the new element to the large array and sort it.
      arr.push(action.element);
      arr.sort((a: any, b: any) => {
        if(a.tag < b.tag) return -1;
        if(a.tag > b.tag) return 1;
        return 0;
      })

      // Then separate the array back to the original pages.
      const newPages: ElementsPage[] = splitArrayIntoPages(arr, state.pages, state.config.filters.limit);
      clearSessionStorage(stateConfig, state.config.currentPage);

      return {
        ...state,
        pages: newPages,
        totalElements: state.totalElements + 1
      }
    }),
    on(pagerActions.deleteElement, (state) => ({
      ...state,
      loading: true,
    })),
    on(pagerActions.deleteElementSuccess, (state, action) => {
      const arr = ([] as unknown[]).concat(...state.pages.map(p => [...p.elements]));
      arr.splice(arr.findIndex((a: any) => a.id === (action.element as any).id), 1);

      const newPages: ElementsPage[] = splitArrayIntoPages(arr, state.pages, state.config.filters.limit);
      clearSessionStorage(stateConfig, state.config.currentPage);

      return {
        ...state,
        pages: newPages,
        totalElements: state.totalElements - 1,
        loading: false,
      }
    }),
    on(pagerActions.deleteElementFail, (state) => ({
      ...state,
      loading: false,
    }))
  );

  return pagerReducer(state, action);
}
