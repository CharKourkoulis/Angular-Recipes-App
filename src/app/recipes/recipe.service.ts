import { Recipe } from './recipe.model';
import { Injectable } from '@angular/core';
import { Ingredient } from '../shared/ingredient.model';
import { ShoppingListService } from '../shopping-list/shopping-list.service';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import * as ShoppingListActions from '../shopping-list/store/shopping-list.actions';
import * as fromApp from '../store/app.reducer';

@Injectable({providedIn:'root'})
export class RecipeService {

  recipesChanged = new Subject<Recipe[]>();
/*
  private recipes: Recipe[] = [
    new Recipe(
      'Test Recipe',
      'this is a test',
      'https://img.hellofresh.com/f_auto,fl_lossy,q_auto,w_610/hellofresh_s3/image/5dcc139c96d0db43857c2eb3-a12c2ae7.jpg',
       [
         new Ingredient('Meat', 1),
         new Ingredient('French Fries', 23)
       ]),

    new Recipe(
      'Another Recipe',
      'this is another test',
      'https://images.immediate.co.uk/production/volatile/sites/2/2017/08/squashcurry-d44e1fe.jpg?quality=90&crop=8px%2C1610px%2C3228px%2C1389px&resize=960%2C408',
      [
        new Ingredient('Buns',6),
        new Ingredient('Meat', 3)
      ])
  ];
*/

  private recipes: Recipe[] = [];
  constructor(
    private slService: ShoppingListService,
    private store: Store<fromApp.AppState>
    ) {}

  getRecipes() {
    return this.recipes.slice();
  }

  getRecipe(index: number){
    return this.recipes.slice()[index];
  }

  addIngredientsToShoppingList(ingredients: Ingredient[]) {
    //this.slService.addIngredients(ingredients);
    this.store.dispatch(new ShoppingListActions.AddIngredients(ingredients));
  }

  addRecipe(recipe: Recipe) {
    this.recipes.push(recipe);
    this.recipesChanged.next(this.recipes.slice());
  }

  updateRecipe(index: number, newRecipe: Recipe) {
    this.recipes[index] = newRecipe;
    this.recipesChanged.next(this.recipes.slice());
  }

  deleteRecipe(index: number) {
    this.recipes.splice(index, 1);
    this.recipesChanged.next(this.recipes.slice());
  }

  setRecipes(recipes: Recipe[]) {
    this.recipes = recipes;
    this.recipesChanged.next(this.recipes.slice());
  }

}
