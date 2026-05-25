import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CsrfInterceptor } from './interceptors/csrf.interceptor';
import { CsrfService } from './services/csrf.service';

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
    // Singleton services
    CsrfService,
    // HTTP Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CsrfInterceptor,
      multi: true,
    },
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
