import { Injectable } from '@angular/core';
import { mockUser } from '../../mock-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  _isAuthenticated: boolean = false;
  constructor() { }
 
  login(username: string, password: string): boolean {
    if (username === mockUser.username && password === mockUser.password) {
      this._isAuthenticated = true;
      return true;
    } else {
      this._isAuthenticated = false;
      return false;
    }
  }
 
  logout(): void {
    this._isAuthenticated = false;
  }
 
  isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

}
