import { Component } from '@angular/core';
import { AuthService } from '../../Services/Authentication/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  email: string = '';
 
  constructor(private authService: AuthService,private router: Router) {}
 
 
  login(): void {
    if (this.authService.login(this.username, this.password)) {
      // Navigate to dashboard or desired route on successful login
      this.router.navigate(['/dashboard']);
      console.log('Login successful');
    } else {
      this.errorMessage = 'Invalid credentials';
    }
  }

}
