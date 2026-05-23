import { Component, signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { BUTTONS, CUSTOM_LIBRARY_BUTTONS, DEFAULT_LIBRARY_BUTTONS } from './config';
import { NgxWigToolbarService } from './ngx-wig-toolbar.service';
import { NgxWigComponent } from './ngx-wig.component';

const mockWindow = {};

@Component({
    template: `<ngx-wig
    [(ngModel)]="text">
  </ngx-wig>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
class TestNgModelHostComponent {
  @ViewChild(NgxWigComponent) ngxWigCmp: NgxWigComponent;

  text = 'Fake content (ngModel)';
}

@Component({
    template: `<ngx-wig
    [(content)]="text"
    placeholder="Enter some text"
    buttons="bold,italic"
    [disabled]="false">
  </ngx-wig>`,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
class TestHostComponent {
  @ViewChild(NgxWigComponent) ngxWigCmp: NgxWigComponent;

  text = signal('Fake content');

  getPromiseContent() {
    Promise.resolve().then(() => this.text.set('Promised content'));
  }
}

class Page {

  execCommandSpy: jasmine.Spy;
  promptSpy: jasmine.Spy;
  focusSpy: jasmine.Spy;

  constructor(public fixture: ComponentFixture<NgxWigComponent | TestHostComponent>) {
    this.execCommandSpy = spyOn(document, 'execCommand');
    this.promptSpy = spyOn(window, 'prompt');
    this.focusSpy = spyOn(this.editableDiv, 'focus').and.callThrough();
  }

  get buttons()  {
 return this.queryAll<HTMLButtonElement>('.nw-button');
}
  get unorderedListBtn() {
 return this.buttons[0];
}
  get editHTMLBtn() {
 return this.query<HTMLButtonElement>('.nw-button.nw-button--source');
}
  get editorDiv() {
 return this.query<HTMLElement>('.nw-editor');
}
  get editContainerDiv() {
 return this.query<HTMLElement>('.nw-editor-container');
}
  get editorSrcContainerDiv() {
 return this.query<HTMLElement>('.nw-editor__src-container');
}
  get editableDiv() {
 return this.query<HTMLElement>('.nw-editor__res');
}
  get toolbarItemsLi() {
 return this.queryAll<HTMLElement>('.nw-toolbar__item');
}
  get iconsEl() {
 return this.queryAll<HTMLElement>('.nwe-icon');
}
  get editHTMLTxt() {
 return this.query<HTMLTextAreaElement>('textarea');
}
  get placeholderEl() {
 return this.query<HTMLElement>('.nw-editor__placeholder');
}

  private query<T>(selector: string): T {
    return this.fixture.nativeElement.querySelector(selector);
  }

  private queryAll<T>(selector: string): T[] {
    return this.fixture.nativeElement.querySelectorAll(selector);
  }
}

const newEvent = (eventName: string, bubbles = false, cancelable = false) => {
  const evt = document.createEvent('CustomEvent');
  evt.initCustomEvent(eventName, bubbles, cancelable, null);
  return evt;
};

describe('NgxWigComponent', () => {
  describe('standalone', () => {
    let fixture: ComponentFixture<NgxWigComponent>;
    let page: Page;
    let component: NgxWigComponent;

    beforeEach(waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [FormsModule],
        declarations: [NgxWigComponent],
        providers: [
          NgxWigToolbarService,
          { provide: BUTTONS, multi: true, useValue: DEFAULT_LIBRARY_BUTTONS },
          { provide: BUTTONS, multi: true, useValue: CUSTOM_LIBRARY_BUTTONS },
          { provide: 'WINDOW', useValue: mockWindow }
        ]
      });

      fixture = TestBed.createComponent(NgxWigComponent);

      component = fixture.componentInstance;
      component.content.set('<p>Hello World</p>');

      page = new Page(fixture);

      fixture.detectChanges();
    }));

    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should have seven toolbar buttons', () => {
      expect(page.toolbarItemsLi.length).toBe(7);
    });

    it('should have a standard button', () => {
      expect(page.unorderedListBtn.classList.contains('nw-list-ul')).toBe(true);
      expect(page.unorderedListBtn.getAttribute('title')).toBe('Unordered List');
      expect(page.unorderedListBtn.tabIndex).toBe(0);
      expect(page.unorderedListBtn.getAttribute('aria-label')).toBe('Unordered List');
      expect(page.iconsEl[0].classList.contains('nwe-icon-list-ul')).toBe(true);
      expect(page.iconsEl[0].getAttribute('aria-hidden')).toBe('true');
      expect(page.iconsEl[0].getAttribute('focusable')).toBe('false');
    });

    it('should have a standard button without icon', () => {
      const [first, ...rest] = component.toolbarButtons();
      const modifiedButtons = [{...first, icon: undefined}, ...rest];
      
      spyOn(component['_ngWigToolbarService'], 'getToolbarButtons').and.returnValue(modifiedButtons)
      // trigger recalculation of toolbarButtons
      fixture.componentRef.setInput('buttons', ' ');
      
      fixture.detectChanges();
      expect(page.unorderedListBtn.textContent).toBe('UL');
      expect(page.iconsEl[0].classList.contains('nwe-icon-list-ul')).toBe(false);
    });

    it('should move focus with arrow keys', () => {
      const secondBtn = page.buttons[1];
      page.unorderedListBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      fixture.detectChanges();
      expect(page.unorderedListBtn.tabIndex).toBe(-1);
      expect(secondBtn.tabIndex).toBe(0);
      expect(document.activeElement).toBe(secondBtn);
    });

    it('should move focus with Tab key and exit at end', () => {
      const buttons = page.buttons;
      buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[1]);

      // move back with shift+Tab
      buttons[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[0]);

      // navigate to last button
      for (let i = 0; i < buttons.length - 1; i++) {
        buttons[i].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        fixture.detectChanges();
      }
      const lastBtn = buttons[buttons.length - 1];
      expect(document.activeElement).toBe(lastBtn);

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      const preventSpy = spyOn(tabEvent, 'preventDefault');
      lastBtn.dispatchEvent(tabEvent);
      fixture.detectChanges();
      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('should have an editor container', () => {
      expect(page.editContainerDiv.classList.contains('nw-editor-container--with-toolbar')).toBeDefined();
    });

    it('should toggle edit mode', () => {
      page.editHTMLBtn.click();
      fixture.detectChanges();
      expect(page.editHTMLTxt).toBeDefined();
      // expect(page.editHTMLBtn.classList.contains('nw-button--active')).toBe(true);
      expect(page.editorDiv.classList.contains('nw-invisible')).toBeDefined();
      expect(page.editorSrcContainerDiv).toBeDefined();
    });

    it('should have a content', () => {
      expect(page.editableDiv.innerHTML).toBe('<p>Hello World</p>');
    });

    it('should show a placeholder', () => {
      fixture.componentRef.setInput('placeholder', 'Insert text here')
      page.editableDiv.innerHTML = '';
      fixture.detectChanges();
      expect(page.placeholderEl.innerText).toBe('Insert text here');
    });

    describe('accessibility attributes', () => {
      it('should have role="textbox" on the editable div', () => {
        expect(page.editableDiv.getAttribute('role')).toBe('textbox');
      });

      it('should have aria-multiline="true" on the editable div', () => {
        expect(page.editableDiv.getAttribute('aria-multiline')).toBe('true');
      });
    });

    describe('focus', () => {
      it('when container click', () => {
        page.editContainerDiv.click();
        expect(page.focusSpy.calls.any()).toBe(true);
      });

      it('when button click', () => {
        page.unorderedListBtn.click();
        expect(page.focusSpy.calls.any()).toBe(true);
      });

      it('when execCommand', () => {
        component.execCommand('bold', '');
        expect(page.focusSpy.calls.any()).toBe(true);
      });

      it('lost', () => {
        const propagateSpy = spyOn(component, 'propagateTouched');
        page.editableDiv.dispatchEvent(newEvent('blur'));
        expect(component.hasFocus()).toBe(false);
        expect(propagateSpy.calls.any()).toBe(true);
      });
    });

    describe('disabled property', () => {
      it('should enable the editor', () => {
        expect(page.unorderedListBtn.disabled).toBe(false);
        expect(page.editorDiv.classList.contains('nw-disabled')).toBe(false);
        expect(page.editableDiv.classList.contains('disabled')).toBe(false);
        expect(page.editableDiv.getAttribute('contenteditable')).toBe('true');
      });

      it('should disable the editor', () => {
        component.setDisabledState(true);
        fixture.detectChanges();
        expect(page.unorderedListBtn.disabled).toBe(true);
        expect(page.editorDiv.classList.contains('nw-disabled')).toBe(true);
        expect(page.editableDiv.classList.contains('disabled')).toBe(true);
        expect(page.editableDiv.getAttribute('contenteditable')).toBe('false');
      });
    });

    describe('isLinkSelected method', () => {
      function mockGetSelection(
        selectionText: string,
        selection: Partial<Selection> | null = null
      ) {
        spyOn(window, 'getSelection').and.returnValue({
          toString: () => selectionText,
          ...selection,
        } as Selection);
      }
    
      it('should return false if there is no selection', () => {
        mockGetSelection('');
        expect(component.isLinkSelected()).toBe(false);
      });
    
      it('should return false if the selection is not within a link', () => {
        const selection = {
          focusNode: { parentNode: { nodeName: 'SPAN' } },
          anchorNode: { parentNode: { nodeName: 'SPAN' } },
        } as Partial<Selection>;
        mockGetSelection('text', selection);
    
        expect(component.isLinkSelected()).toBe(false);
      });
    
      it('should return true if the focusNode is within a link', () => {
        const selection = {
          focusNode: { parentNode: { nodeName: 'A' } },
          anchorNode: { parentNode: { nodeName: 'SPAN' } },
        } as Partial<Selection>;
        mockGetSelection('text', selection);
    
        expect(component.isLinkSelected()).toBe(true);
      });
    
      it('should return true if the anchorNode is within a link', () => {
        const selection = {
          focusNode: { parentNode: { nodeName: 'DIV' } },
          anchorNode: { parentNode: { nodeName: 'A' } },
        } as Partial<Selection>;
        mockGetSelection('text', selection);
    
        expect(component.isLinkSelected()).toBe(true);
      });
    
      it('should return false if selection is null', () => {
        mockGetSelection('text', null);
        expect(component.isLinkSelected()).toBe(false);
      });
    }); 

    describe('execCommand', () => {
      it('should call execCommand', () => {
        const spy = spyOn(component, 'execCommand');
        page.unorderedListBtn.click();
        const execArgs = spy.calls.first().args;
        expect(execArgs[0]).toBe('insertunorderedlist');
        expect(execArgs[1]).toBeUndefined();
      });

      it('should return false', () => {
        component.editMode.set(true);
        expect(component.execCommand('insertunorderedlist', '')).toBe(false);
      });

      it('should execute the BOLD command', () => {
        component.execCommand('bold', '');
        const documentArgs = page.execCommandSpy.calls.first().args;
        expect(documentArgs[0]).toBe('bold');
        expect(documentArgs[1]).toBe(false);
        expect(documentArgs[2]).toBe('');
      });

      it('should fail if command is unknown', () => {
        expect(() => {
          component.execCommand('fakeCmd', '');
        }).toThrow(new Error('The command "fakeCmd" is not supported'));
      });

      it('should show a prompt when the command name is createlink', () => {
        page.promptSpy.and.returnValue('http://fakeLink');
        component.execCommand('createlink', '');
        const promptArgs = page.promptSpy.calls.first().args;
        expect(promptArgs[0]).toBe('Please enter the URL');
        expect(promptArgs[1]).toBe('http://');
      });

      it('should show a prompt when the command name is insertImage', () => {
        page.promptSpy.and.returnValue('http://fakeImage');
        component.execCommand('insertImage', '');
        const promptArgs = page.promptSpy.calls.first().args;
        expect(promptArgs[0]).toBe('Please enter the URL');
        expect(promptArgs[1]).toBe('http://');
      });

      it('should not show a prompt when the command is not createlink or insertImage', () => {
        component.execCommand('bold', '');
        expect(page.promptSpy.calls.any()).toBe(false);
      });

      it('should not show a prompt when the command is createlink and selected text contains a link', () => {
        spyOn(component, 'isLinkSelected').and.returnValue(true)
        component.execCommand('createlink', '');
        expect(page.promptSpy.calls.any()).toBe(false);
      });

      it('should execute unlink command', () => {
        spyOn(component, 'isLinkSelected').and.returnValue(true)
        component.execCommand('createlink', '');
        expect(page.execCommandSpy).toHaveBeenCalledWith('unlink', false);
      });
      
      it('should return if the prompt is cancelled', () => {
        page.promptSpy.and.returnValue(undefined);
        component.execCommand('createlink', '');
        expect(page.execCommandSpy.calls.any()).toBe(false);
      });
    });

    it('should change the content (onContentChange)', (done) => {
      const newContent = 'New fake content';
      
      component.content.subscribe((v) => {
        expect(v).toBe(newContent);
        expect(component.content()).toBe(newContent);
        done();
      });

      component.onContentChange(newContent);
    });

    it('should emit empty string if content innerText is empty', (done) => {
      const newContent = '<br>';
      component.content.subscribe((v) => {
        expect(component.content()).toBe('');
        expect(v).toBe('');
        done();
      });

      component.onContentChange(newContent);
    });

    it('should change the content (onTextareaChange)', () => {
      const newText = '<p>New fake text</p>';
      const spy = spyOn(component, 'onContentChange');
      component.editMode.set(true);
      fixture.detectChanges();
      page.editHTMLTxt.value = newText;
      page.editHTMLTxt.dispatchEvent(newEvent('input'));
      expect(page.editableDiv.innerHTML).toBe(newText);
      expect(spy.calls.first().args[0]).toBe(newText);
    });

    describe('writeValue', () => {
      it('should set content to empty string', () => {
        component.writeValue(undefined);
        expect(page.editableDiv.innerHTML).toBe('');
      });

      it('should set content to non empty string', () => {
        const fakeValue = 'Fake value';
        component.writeValue(fakeValue);
        expect(page.editableDiv.innerHTML).toBe(fakeValue);
      });
    });
  });

  describe('with host', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let component: TestHostComponent;
    let page: Page;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [FormsModule],
        declarations: [
          NgxWigComponent,
          TestHostComponent
        ],
        providers: [
          NgxWigToolbarService,
          { provide: BUTTONS, multi: true, useValue: DEFAULT_LIBRARY_BUTTONS },
          { provide: 'WINDOW', useValue: mockWindow }
        ]
      });
      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.componentInstance;
      page = new Page(fixture);

      fixture.detectChanges();
    });

    it('should set the content', () => {
      expect(component.ngxWigCmp.content()).toBe(component.text());
    });

    it('should set the placeholder', () => {
      expect(component.ngxWigCmp.placeholder()).toBe('Enter some text');
    });

    it('should set the toolbar buttons', () => {
      expect(component.ngxWigCmp.toolbarButtons()).toEqual([
        { label: 'B', title: 'Bold', command: 'bold', styleClass: 'nw-bold', icon: 'nwe-icon-bold' },
        { label: 'I', title: 'Italic', command: 'italic', styleClass: 'nw-italic', icon: 'nwe-icon-italic' }
      ]);
    });

    it('should set the disabled property', () => {
      expect(component.ngxWigCmp.disabled()).toBe(false);
    });

    it('should emit content', () => {
      component.ngxWigCmp.content.set('New fake content');
      expect(component.text()).toBe('New fake content');
    });

    it('should focus the editor', () => {
      component.text.set('Fake text');
      fixture.detectChanges();

      expect(page.focusSpy.calls.any()).toBe(true);
    });

    it('should change the content from a promise', fakeAsync(() => {
      component.getPromiseContent();
      tick();
      fixture.detectChanges();
      expect(page.editableDiv.innerHTML).toBe('Promised content');
    }));
  });

  describe('with host (ngModel)', () => {
    let fixture: ComponentFixture<TestNgModelHostComponent>;
    let component: TestNgModelHostComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [FormsModule],
        declarations: [
          NgxWigComponent,
          TestNgModelHostComponent
        ],
        providers: [
          NgxWigToolbarService,
          { provide: BUTTONS, multi: true, useValue: DEFAULT_LIBRARY_BUTTONS },
          { provide: 'WINDOW', useValue: mockWindow }
        ]
      });
      fixture = TestBed.createComponent(TestNgModelHostComponent);
      component = fixture.componentInstance;

      fixture.detectChanges();
    });

    it('should set the content', waitForAsync(() => {
      fixture.whenStable().then(() => {
        expect(component.ngxWigCmp.content()).toBe(component.text);
      });
    }));

    it('should change the text', () => {
      const editor = document.querySelector('.nw-editor__res');
      if (editor) {
        editor.textContent = 'New fake content';
        editor.dispatchEvent(newEvent('input'));
        fixture.detectChanges();

        expect(component.text).toBe('New fake content');
      }
    });
  });
});
