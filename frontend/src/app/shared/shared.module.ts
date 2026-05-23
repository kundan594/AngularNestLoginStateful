import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SharedModule contains reusable components, directives, and pipes
 * that can be imported by feature modules.
 */
@NgModule({
  declarations: [
    // Shared components will be declared here:
    // - SessionWarningDialogComponent
    // - LoadingSpinnerComponent
    // Shared directives will be declared here
  ],
  imports: [
    CommonModule
    // Angular Material modules will be imported here
  ],
  exports: [
    // Export shared components, directives, and pipes
    // Export commonly used Angular Material modules
  ]
})
export class SharedModule { }

// Made with Bob
