import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CoreModule contains singleton services and should only be imported once in AppModule.
 * Services for authentication, session management, and HTTP interceptors will be added here.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    // Singleton services will be added here:
    // - AuthService
    // - SessionService
    // - CsrfService
    // - StorageService
    // - BroadcastService
    // HTTP Interceptors will be provided here
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only.');
    }
  }
}

// Made with Bob
