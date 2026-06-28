import { InjectionToken } from '@angular/core';
import { NgxWigComponent } from './ngx-wig.component';

export type CommandFunction = (ctx: NgxWigComponent) => void;

export interface TButton {
  label?: string;
  icon?: string;
  title?: string;
  ariaLabel?: string;
  children?: TButton[];
  command?: string | CommandFunction;
  styleClass?: string;
  visibleDropdown?: boolean;
  isOpenOnMouseOver?: boolean;
  /**
   * Tracks the currently focusable child button when the toolbar button has a dropdown.
   * Implements a roving tabindex pattern for dropdown items.
   */
  dropdownButtonIndex?: number;
}

export interface TButtonLibrary {
  [name: string]: TButton;
}

export const DEFAULT_LIBRARY_BUTTONS: TButtonLibrary = {
  list1: {
    label: 'UL',
    title: 'Unordered List',
    command: 'insertunorderedlist',
    styleClass: 'nw-list-ul',
    icon: 'nwe-icon-list-ul'
  },
  list2: {
    label: 'OL',
    title: 'Ordered List',
    command: 'insertorderedlist',
    styleClass: 'nw-list-ol',
    icon: 'nwe-icon-list-ol'
  },
  bold: {
    label: 'B',
    title: 'Bold',
    command: 'bold',
    styleClass: 'nw-bold',
    icon: 'nwe-icon-bold'
  },
  italic: {
    label: 'I',
    title: 'Italic',
    command: 'italic',
    styleClass: 'nw-italic',
    icon: 'nwe-icon-italic'
  },
  link: {
    label: 'Link',
    title: 'Add or remove link',
    command: 'createlink',
    styleClass: 'nw-link',
    icon: 'nwe-icon-link'
  },
  underline: {
    label: 'U',
    title: 'Underline',
    command: 'underline',
    styleClass: 'nw-format-underlined',
    icon: 'nwe-icon-underline'
  }
};

export const CUSTOM_LIBRARY_BUTTONS: TButtonLibrary = {
  edithtml: {
    label: 'Edit HTML',
    title: 'Edit HTML',
    command: (ctx: NgxWigComponent) => {
      ctx.editMode.update(e => !e);
    },
    styleClass: 'nw-button--source',
    icon: ''
  }
};

export const BUTTONS = new InjectionToken<TButtonLibrary[]>('BUTTONS');
