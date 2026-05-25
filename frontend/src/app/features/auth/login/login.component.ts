import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';
  returnUrl = '/dashboard';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private sessionService: SessionService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // Initialize form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate([this.returnUrl]);
    }
  }

  /**
   * Convenience getter for form controls
   */
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Reset error
    this.error = '';

    // Stop if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const credentials = {
      email: this.f['email'].value,
      password: this.f['password'].value,
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        // Start session tracking
        this.sessionService.startSession(response.user.id);

        // Navigate to return URL
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.loading = false;

        // Handle different error types
        if (error.status === 401) {
          this.error = 'Invalid email or password';
        } else if (error.status === 400) {
          this.error = error.error?.message || 'Invalid input';
        } else if (error.status === 0) {
          this.error = 'Unable to connect to server';
        } else {
          this.error = 'An error occurred. Please try again.';
        }
      },
    });
  }
}

// Made with Bob
