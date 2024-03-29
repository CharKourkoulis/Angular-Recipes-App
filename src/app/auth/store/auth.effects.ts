import { Actions, ofType, Effect } from '@ngrx/effects';
import * as AuthActions from './auth.actions';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
import { AuthResponseData, AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../user.model';


const handleAuthentication = (expiresIn: number, email: string, userId: string, token: string ) => {
  const expDate = new Date(new Date().getTime() + +expiresIn * 1000);
  const user = new User(email, userId, token, expDate);
  localStorage.setItem('userData', JSON.stringify(user));
  return new AuthActions.AuthenticateSuccess({ email: email, userId: userId, token: token, expirationDate: expDate, redirect: true });
};

const handleError = (errorResponse: any) => {
  let errorMessage = 'An error occurred';
            if (!errorResponse.error || !errorResponse.error.error) return of(new AuthActions.AuthenticateFail(errorMessage));
            switch (errorResponse.error.error.message) {
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
            return of(new AuthActions.AuthenticateFail(errorMessage));
};

@Injectable()
export class AuthEffects {

  @Effect()
  authSignup = this.actions$.pipe(
    ofType(AuthActions.SIGNUP_START),
    switchMap((signupAction: AuthActions.SignupStart) => {
      return this.http
        .post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseAPIKey,
          {
            email: signupAction.payload.email,
            password: signupAction.payload.password,
            returnSecureToken: true
          })
        .pipe(
          tap( resData => {
            this.authService.setLogoutTimer(+resData.expiresIn *1000);
          }),
          map(resData => {
            handleAuthentication(+resData.expiresIn, resData.email, resData.localId, resData.idToken);
          }),
          catchError(errorResponse => {
            return handleError(errorResponse);
          })
        );
    })
  );

  @Effect()
  authLogin = this.actions$.pipe(
    ofType(AuthActions.LOGIN_START),
    switchMap((authData: AuthActions.LoginStart) => {
      return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + environment.firebaseAPIKey,
      {
        email: authData.payload.email,
        password: authData.payload.password,
        returnSecureToken: true
      }).pipe(
        tap( resData => {
          this.authService.setLogoutTimer(+resData.expiresIn *1000);
        }),
        map(resData => {
          handleAuthentication(+resData.expiresIn, resData.email, resData.localId, resData.idToken);
        }),
          catchError(errorResponse => {
            return handleError(errorResponse);
          }));
    })
  );

  @Effect()
  autoLogin = this.actions$.pipe(
    ofType(AuthActions.AUTO_LOGIN),
    map(() => {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if(!userData)
        return {type: ''};

      const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate));

      if(loadedUser.token) {
        //this.user.next(loadedUser);
        const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
        this.authService.setLogoutTimer(expirationDuration);
        return new AuthActions.AuthenticateSuccess({
            email: loadedUser.email,
            userId: loadedUser.id,
            token: loadedUser.token,
            expirationDate: new Date(userData._tokenExpirationDate),
            redirect: false
          });

      }
      return {type: ''};
    })
  );

  @Effect({dispatch: false})
  authLogout = this.actions$.pipe(
    ofType(AuthActions.LOGOUT),
    tap(()=> {
      this.authService.clearLogoutTimer();
      localStorage.removeItem('userData');
      this.router.navigate(['/auth']);
    })
  )

  @Effect({dispatch: false})
  authRedirect = this.actions$
  .pipe(
    ofType(AuthActions.AUTHENTICATE_SUCCESS, AuthActions.LOGOUT),
    tap( (authSuccessAction: AuthActions.AuthenticateSuccess) => {
      if(authSuccessAction.payload.redirect) {
        this.router.navigate(['/']);
      }
    }));

  constructor(
    private actions$: Actions,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService) {}
}
