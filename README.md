# Pager State management
This can be used in an Angular project for a pager state management.
Paste this code in a shared or central folder because the state code can be reused for every pager in your project.
These state files do not use the conventional method of creating a state with NGRX (following the docs).
Instead it uses classes and interfaces to make it reusable and thus a better way for writing NGRX states.

## How to implement
### Step 1 create a config
First step is to create a pager config for the new subject, the subject needs to implement the PagerStateConfig class.
Example:
``` ts
@Injectable({
  providedIn: 'root',
})
export class ExamplePagerConfig extends PagerStateConfig {

  constructor(private readonly moduleService: ModuleService) {
    super('EXAMPLE'); //this is the subject identifier and needs to be unique
  }

  pagerLoadFunc(config: PagerConfig): Observable<PagerFunc> {
    return this.exampleService.getLatest(config.currentPage, config.filters.limit).pipe(
      map(({ examples, totalElements }) => ({ elements: examples, totalElements }))
    );
  }

  pagerSearchFunc(keyword: string, page: number, size: number): Observable<PagerFunc> {
    return this.exampleService.searchMetaDataByTag(keyword, page, size).pipe(
      map(({ examples, totalElements }) => ({ elements: examples, totalElements }))
    );
  }

  pagerDeleteFunc(id: string): Observable<unknown> {
    return this.exampleService.delete(id);
  }
}
```
The exampleService is a service with some back-end calls.

### Step 2 Implementing the reducer
Next up you need to implement the reducer this will be done by an injector.
Example:
``` ts
const allInjector = Injector.create({ providers: [{provide: ExamplePagerConfig, deps: []}]});
export function exampleReducer(state: PagerList | undefined, action: Action) {
  const stateConfig: ExamplePagerConfig = allInjector.get(ExamplePagerConfig);
  return createPagerReducer(stateConfig, EXAMPLE_FEATURE_KEY, state, action);
}
export const EXAMPLE_FEATURE_KEY = 'examplePagerList';
```

the createPagerReducer is a function from the pager.reducer.ts file. This will inject the config we made in Step 1 and also a unique state key.

### Step 3 implement the effect
The same trick needs to be done with the effect only this time you can use a class.
```ts
@Injectable()
export class ExampleEffects extends PagerEffects {
  constructor(
    protected actions: Actions,
    protected toasterService: ToasterService,
    protected config: PagerStateConfig,
    protected facade: PagerFacade,
  ) {
    super(actions, toasterService, EXAMPLE_FEATURE_KEY, config, facade);
  }
}
```
The toasterService can also be deleted inside the pager state but here it is used to give the user information. Also pay attention to the state key, it is the same as the reducer.

### Step 4 Import everything
The final step is to import and provide everything inside the desired Angular module.
```ts
import * as fromExample from './+state/example.reducer';
import { ExamplePagerConfig } from './+state/examplePager.config';
import { ExampleEffects } from './+state/example.effect';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(fromExample.EXAMPLE_FEATURE_KEY, fromExample.exampleReducer),
    EffectsModule.forFeature([ModuleEffects]),
  ],
  providers: [
    { provide: PagerStateConfig, useExisting: ExamplePagerConfig },
    {
      provide: PagerFacade,
      useFactory: (Store) => new PagerFacade(fromExample.EXAMPLE_FEATURE_KEY, Store),
      deps: [Store]
    },
  ]
})
export class ExampleModule {}
```