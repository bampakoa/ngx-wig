import { inject, Inject, Service } from '@angular/core';
import { TButtonLibrary, TButton, BUTTONS } from './config';

@Service()
export class NgxWigToolbarService { 
  private buttonLibrary = inject(BUTTONS).reduce((acc, val) => ({ ...acc, ...val }), {});
  private defaultButtonsList = Object.keys(this.buttonLibrary);

  setButtons(buttons: string[]) {
    if (!Array.isArray(buttons)) {
      throw new Error('Argument "buttons" should be an array');
    }

    this.defaultButtonsList = buttons;
  }

  addStandardButton(
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
    this.buttonLibrary[name] = { title, command, styleClass, icon };
    this.defaultButtonsList.push(name);
  }

  getToolbarButtons(buttonsList?: string) {
    let buttons = this.defaultButtonsList;
    const toolbarButtons: TButton[] = [];

    if (typeof buttonsList !== 'undefined') {
      buttons = string2array(buttonsList);
    }

    buttons.forEach(buttonKey => {
      if (!buttonKey) {
        return;
      }

      if (!this.buttonLibrary[buttonKey]) {
        throw new Error(
          `There is no "${buttonKey}" in your library. Possible variants: ${Object.keys(this.buttonLibrary)}`
        );
      }

      const button = Object.assign({}, this.buttonLibrary[buttonKey]);
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
