import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgxWigComponent, NgxWigModule } from 'ngx-wig';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export const DEFAULT_LIBRARY_BUTTONS = {
  bold: {
    label: 'B',
    title: 'Bold',
    command: 'bold',
    styleClass: 'bold',
    icon: 'nwe-icon-bold'
  },
  italic: {
    label: 'I',
    title: 'Italic',
    command: 'italic',
    styleClass: 'italic',
    icon: 'nwe-icon-italic'
  },
  fontName: {
    label: 'F',
    title: 'Font name',
    children: [
      {
        label: 'Arial',
        title: 'Arial',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('fontName', 'Arial')
        },
        styleClass: 'font-arial'
      },
      {
        label: 'Courier',
        title: 'Courier',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('fontName', 'Courier')
        },
        styleClass: 'font-courier'
      },
      {
        label: 'Times',
        title: 'Times',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('fontName', 'Times')
        },
        styleClass: 'font-times'
      }
    ],
    styleClass: ''
  },
  specialChar: {
    label: 'à',
    title: 'Accented Characters',
    children: [
      {
        label: 'à',
        title: 'à',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('insertText', 'à')
        },
        styleClass: ''
      },
      {
        label: 'è',
        title: 'è',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('insertText', 'è')
        },
        styleClass: ''
      },
      {
        label: 'é',
        title: 'é',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('insertText', 'é')
        },
        styleClass: ''
      },
      {
        label: 'ì',
        title: 'ì',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('insertText', 'ì')
        },
        styleClass: ''
      },
      {
        label: 'ò',
        title: 'ò',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('insertText', 'ò')
        },
        styleClass: ''
      },
      {
        label: 'ù',
        title: 'ù',
        command: (ctx: NgxWigComponent) => {
          ctx.execCommand('insertText', 'ù')
        },
        styleClass: ''
      },
    ],
    styleClass: '',
    visibleDropdown: false,
    isOpenOnMouseOver: true
  },
  removeFormatting: {
    label: 'R',
    title: 'Remove formatting',
    command: 'removeFormat',
    styleClass: '',
  }
};

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    NgxWigModule.forRoot({ buttonsConfig: DEFAULT_LIBRARY_BUTTONS } ),
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
