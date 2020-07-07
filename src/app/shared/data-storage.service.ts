import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RecipeService } from '../recipes/recipe.service';
import { Recipe } from '../recipes/recipe.model';
import {map, tap, take, exhaustMap} from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Store } from '@ngrx/store';
import * as fromApp from '../store/app.reducer';
import * as RecipesActions from '../recipes/store/recipe.actions';

@Injectable({
  providedIn: 'root'
})
export class DataStorageService {
   siteUrl = 'https://recipes-86df5.firebaseio.com/recipes.json';

  constructor(
    private http: HttpClient,
    private recipeService: RecipeService,
    private authService: AuthService,
    private store: Store<fromApp.AppState>
    ) { }


  storeRecipes() {
    const recipes = this.recipeService.getRecipes();
    return this.http.put(this.siteUrl, recipes)
                     .subscribe(response => {
                       console.log(response);
                     });
  }


  fetchRecipes() {
    return this.http.get<Recipe[]>(this.siteUrl).pipe(

      map(recipes => {
        return recipes.map(r => {
          return { ...r, ingredients: r.ingredients ? r.ingredients : [] };
        });
      }),
      tap(recipes => {
        //this.recipeService.setRecipes(recipes);
        this.store.dispatch(new RecipesActions.SetRecipes(recipes));
      })
    );

  }

}
