import { Actions, Effect, ofType, EffectsModule } from '@ngrx/effects';
import * as RecipesActions from './recipe.actions';
import { switchMap, map, withLatestFrom } from 'rxjs/operators';
import { Recipe } from '../recipe.model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromApp from '../../store/app.reducer';

@Injectable()
export class RecipeEffects {
  siteUrl = 'https://recipes-86df5.firebaseio.com/recipes.json';

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private store: Store<fromApp.AppState> ) {}

  @Effect()
  fetchRecipes = this.actions$.pipe(
    ofType(RecipesActions.FETCH_RECIPES),
    switchMap(() => {
      return this.http.get<Recipe[]>(this.siteUrl)
    }),
    map(recipes => {
      return recipes.map(r => {
        return { ...r, ingredients: r.ingredients ? r.ingredients : [] };
      });
    }),
    map(recipes => {
      return new RecipesActions.SetRecipes(recipes);
    })
  );

  @Effect({dispatch: false})
  storeRecipes = this.actions$.pipe(
    ofType(RecipesActions.STORE_RECIPES),
    withLatestFrom(this.store.select('recipes')),
    switchMap(([actionData, recipesState]) => {
      return this.http.put(this.siteUrl, recipesState.recipes);
    })
  );
}
