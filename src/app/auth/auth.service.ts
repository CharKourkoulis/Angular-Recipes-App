import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';
import { User } from './user.model';
import { environment } from '../../environments/environment'
import { Store } from '@ngrx/store';
import * as fromApp from '../store/app.reducer';
import * as AuthActions from './store/auth.actions';


export interface AuthResponseData {
  kind: string;
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}


@Injectable({providedIn: 'root'})
export class AuthService {

  user = new BehaviorSubject<User>(null);
  private tokenExpirationTimer: any;

  constructor(
    private http: HttpClient,
    private store: Store<fromApp.AppState>
    ){}

  signup(email: string, password: string) {
    return this.http
      .post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseAPIKey,
        {
          email: email,
          password: password,
          returnSecureToken: true
        }).pipe(
          tap(responseData => {
            this.handleAuthentication(responseData.email, responseData.localId, responseData.idToken, +responseData.expiresIn)
          }),
          catchError(this.handleError)
        );
  }


  login(email: string, password: string) {
    return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + environment.firebaseAPIKey,
      {
        email: email,
        password: password,
        returnSecureToken: true
      }).pipe(
        tap(responseData => {
          this.handleAuthentication(responseData.email, responseData.localId, responseData.idToken, +responseData.expiresIn)
        }),
        catchError(this.handleError)
      );
  }


  logout() {
    //this.user.next(null);
    this.store.dispatch(new AuthActions.Logout());

    localStorage.removeItem('userData');
    if(this.tokenExpirationTimer)
      clearTimeout(this.tokenExpirationTimer);
    this.tokenExpirationTimer = null;
  }

  setLogoutTimer(expDuration: number) {
    this.tokenExpirationTimer = setTimeout( () => {
      this.store.dispatch(new AuthActions.Logout());
    }, expDuration);
  }

  clearLogoutTimer() {
    if(this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  private handleAuthentication(email: string, userId: string, token: string, expiresIn: number) {
    const expDate = new Date(new Date().getTime() + expiresIn * 1000);
    const user = new User(email, userId, token, expDate);
    //this.user.next(user);
    this.store.dispatch(new AuthActions.AuthenticateSuccess({
      email: user.email,
      userId: user.id,
      token: user.token,
      expirationDate: expDate
    }));
    this.setLogoutTimer(expiresIn * 1000);

  }

  private handleError(errorResp: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (!errorResp.error || !errorResp.error.error) return throwError(errorMessage);
    switch (errorResp.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email already exists!'
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = 'This email do not exist!'
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'The email/password is not Correct!'
        break;
    }
    return throwError(errorMessage);
  }


}
