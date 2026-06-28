import { inject, Inject, Service } from '@angular/core';
import { TButtonLibrary, TButton, BUTTONS } from './config';

@Service()
export class NgxWigToolbarService { 
  private _buttonLibrary = inject(BUTTONS).reduce((acc: TButtonLibrary, val: TButtonLibrary) => ({ ...acc, ...val }), {});
  private _defaultButtonsList = Object.keys(this._buttonLibrary);

  public setButtons(buttons: string[]): void {
    if (!Array.isArray(buttons)) {
      throw new Error('Argument "buttons" should be an array');
    }

    this._defaultButtonsList = buttons;
  }

  public addStandardButton(
    name: string,
    title: string,
    command: string,
    styleClass: string,
    icon: string
  ) {
    if (!name || !title || !command) {
      throw new Error('Arguments "name", "title" and "command" are required');
    }

    styleClass = styleClass || '';
    this._buttonLibrary[name] = { title, command, styleClass, icon };
    this._defaultButtonsList.push(name);
  }

  public getToolbarButtons(buttonsList?: string): TButton[] {
    let buttons = this._defaultButtonsList;
    const toolbarButtons: TButton[] = [];

    if (typeof buttonsList !== 'undefined') {
      buttons = string2array(buttonsList);
    }

    buttons.forEach(buttonKey => {
      if (!buttonKey) {
        return;
      }

      if (!this._buttonLibrary[buttonKey]) {
        throw new Error(
          `There is no "${buttonKey}" in your library. Possible variants: ${Object.keys(this._buttonLibrary)}`
        );
      }

      const button = Object.assign({}, this._buttonLibrary[buttonKey]);
      // button.isActive = () => {return !!this.command && document.queryCommandState(this.command);}
      toolbarButtons.push(button);
    });

    return toolbarButtons;
  }
}

const string2array = (keysString: string) =>
  keysString
    .split(',')
    .map(Function.prototype.call, String.prototype.trim);
