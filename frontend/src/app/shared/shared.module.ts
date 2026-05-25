import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionWarningDialogComponent } from './components/session-warning-dialog/session-warning-dialog.component';

/**
 * SharedModule contains reusable components, directives, and pipes
 * that can be imported by feature modules.
 */
@NgModule({
  declarations: [
    SessionWarningDialogComponent,
    // Additional shared components will be declared here:
    // - LoadingSpinnerComponent
    // Shared directives will be declared here
  ],
  imports: [
    CommonModule
    // Angular Material modules will be imported here
  ],
  exports: [
    SessionWarningDialogComponent,
    // Export shared components, directives, and pipes
    // Export commonly used Angular Material modules
  ]
})
export class SharedModule { }

// Made with Bob
