import { CommonModule } from '@angular/common';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { NgxWigComponent } from './ngx-wig.component';
import { FormsModule } from '@angular/forms';
import { TButtonLibrary, DEFAULT_LIBRARY_BUTTONS, BUTTONS } from './config';

export const getWindowObject = () => window;

@NgModule({
  declarations: [
    NgxWigComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [NgxWigComponent],
  providers: [
    { provide: BUTTONS, multi: true, useValue: DEFAULT_LIBRARY_BUTTONS },
    { provide: 'WINDOW', useFactory: getWindowObject }
  ]
})
export class NgxWigModule {
  static forRoot(config?: { buttonsConfig: TButtonLibrary } ): ModuleWithProviders<NgxWigModule> {
    return {
      ngModule: NgxWigModule,
      providers: [
        {
          provide: BUTTONS,
          multi: true, useValue: ((!config || !config?.buttonsConfig) ? DEFAULT_LIBRARY_BUTTONS : config?.buttonsConfig)
        },
        { provide: 'WINDOW', useFactory: getWindowObject }
      ]
    };
  }

  static forChild(): ModuleWithProviders<NgxWigModule> {
    return { ngModule: NgxWigModule };
  }
}
