import { DOCUMENT } from '@angular/common';
import {
  Component,
  ElementRef,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommandFunction, TButton } from './config';
import { NgxWigFilterService } from './ngx-wig-filter.service';
import { NgxWigToolbarService } from './ngx-wig-toolbar.service';

@Component({
  selector: 'ngx-wig',
  templateUrl: './ngx-wig-component.html',
  styleUrls: ['./ngx-wig-component.css'],
  providers: [
    NgxWigToolbarService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxWigComponent),
      multi: true
    },
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class NgxWigComponent implements OnInit, OnChanges, ControlValueAccessor{
  private ngWigToolbarService = inject(NgxWigToolbarService);
  private filterService = inject(NgxWigFilterService, { optional: true });
  private document = inject(DOCUMENT);
  private readonly toolbarButtonElems = viewChildren('toolbarButton', { read: ElementRef});

  readonly content = model<string>();
  readonly placeholder = input<string>();
  readonly buttons = input<string>();
  readonly disabled = model(false);
  readonly ngxWigEditable = viewChild.required('ngWigEditable', { read: ElementRef });
  readonly editMode = signal(false);
  readonly container = computed<HTMLElement>(() => this.ngxWigEditable().nativeElement);
  readonly toolbarButtons = computed(() => {
    const buttons = this.buttons();
    const toolbarButtons = this.ngWigToolbarService.getToolbarButtons(buttons);
    toolbarButtons.forEach(b => {
      if (!b.children?.length) return;
      b.dropdownButtonIndex = 0;
    });

    return toolbarButtons;
  });
  readonly hasFocus = signal(false);
  readonly toolbarButtonIndex = signal(0);

  private executeCommand(command: string, value: string = '') {
    try {
      if (this.container().contentEditable !== 'true') {
        return false;
      }

      // For now, use execCommand for backward compatibility
      // TODO: Replace with modern APIs when execCommand is fully deprecated
      if (command === 'unlink') {
        this.document.execCommand(command, false);
      } else {
        this.document.execCommand(command, false, value);
      }
      return true;
    } catch (error) {
      console.warn(`Command execution failed: ${command}`, error);
      return false;
    }
  }

  execCommand(command: string | CommandFunction | undefined, options?: string,) {
    if (typeof command === 'function') {
      command(this);
      return true;
    }

    if (this.editMode()) {
      return false;
    }

    if (typeof command !== 'string' || !command) {
      return false;
    }

    if (!this.isSupportedCommand(command)) {
      throw new Error(`The command "${command}" is not supported`);
    }

    if ((command === 'createlink' && !this.isLinkSelected()) || command === 'insertImage') {
      options = window.prompt('Please enter the URL', 'http://') ?? '';
      if (!options) {
        return false;
      }
    }

    this.container().focus();

    let success = false;
    if (command === 'createlink' && this.isLinkSelected()) {
      success = this.executeCommand('unlink');
    } else {
      success = this.executeCommand(command, options ?? '');
    }

    if (success) {
      this.onContentChange(this.container().innerHTML);
    }

    return success;
  }

  ngOnInit() {
    const content = this.content();
    if (content) {
      this.container().innerHTML = content;
    }
  }

  onContentChange(newContent: string) {
    this.content.set(this.isInnerTextEmpty(newContent) ? '' : newContent);

    this.propagateChange(this.content());
  }

  ngOnChanges(changes: SimpleChanges) {
    const container = this.container();
    if (container && changes['content']) {
      // we need to focus the container before pasting at the caret
      container.focus();

      // clear the previous content
      container.innerHTML = '';

      // add the new content
      if (this.filterService) {
        this.pasteHtmlAtCaret(this.filterService.filter(changes['content'].currentValue));
      } else {
        this.pasteHtmlAtCaret(changes['content'].currentValue);
      }
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const text =
      event.clipboardData?.getData('text/html') ||
      event.clipboardData?.getData('text/plain') ||
      '';

    if (this.filterService) {
      this.pasteHtmlAtCaret(this.filterService.filter(text));
    } else {
      this.pasteHtmlAtCaret(text);
    }

    this.onContentChange(this.container().innerHTML);
  }

  onTextareaChange(newContent: string) {
    this.container().innerHTML = newContent;
    this.onContentChange(newContent);
  }

  writeValue(value: any) {
    value = value ?? '';
    this.container().innerHTML = value;
    this.content.set(value);
  }

  shouldShowPlaceholder() {
    return !!this.placeholder() && !this.container().innerText;
  }

  registerOnChange(fn: any) {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.propagateTouched = fn;
  }

  propagateTouched = () => {};

  onBlur() {
    this.hasFocus.set(false);
    this.propagateTouched();
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled.set(isDisabled);
  }

  isInnerTextEmpty(content: string) {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(content, 'text/html');

    return htmlDoc.documentElement?.innerText === '';
  }

  isLinkSelected() {
    if (window.getSelection()?.toString() === '') return false;

    const selection = window.getSelection();
    if (!selection) return false;

    return (
      selection.focusNode?.parentNode?.nodeName === 'A' ||
      selection.anchorNode?.parentNode?.nodeName === 'A'
    );
  }

  onDropdownButtonSelected(button: TButton, event?: Event) {
    event?.preventDefault();

    if (button.isOpenOnMouseOver) return;
    if (button.visibleDropdown) {
      this.closeDropdown(button);
      return;
    }
    button.visibleDropdown = true;
    button.dropdownButtonIndex = 0;
    const dropdown = (event?.currentTarget as HTMLElement)?.querySelector('.nwe-dropdown-content',);
    const buttons = Array.from(dropdown?.querySelectorAll('button') ?? []);
    buttons[0]?.focus();
  }

  onDropdownKeydown(event: KeyboardEvent, button: TButton) {
    const dropdown = (event.currentTarget as HTMLElement).closest('.nwe-dropdown-content');
    const buttons = Array.from(dropdown?.querySelectorAll('button') ?? []);
    const index = buttons.indexOf(event.currentTarget as HTMLButtonElement);
    if (index === -1) {
      return;
    }
    const lastIndex = buttons.length - 1;
    let newIndex = index;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (index + 1) % buttons.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = (index - 1 + buttons.length) % buttons.length;
        break;
      case 'Tab':
        if (event.shiftKey) {
          if (index === 0) {
            return;
          }
          event.preventDefault();
          newIndex = index - 1;
        } else {
          if (index === lastIndex) {
            return;
          }
          event.preventDefault();
          newIndex = index + 1;
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeDropdown(button);
        return;
      default:
        return;
    }
    button.dropdownButtonIndex = newIndex;
    buttons[newIndex].focus();
  }

  closeDropdown(button: TButton) {
    button.visibleDropdown = false;
    this.focusToolbarButton(button);
  }

  private focusToolbarButton(button: TButton) {
    const index = this.toolbarButtons().indexOf(button);
    if (index === -1) {
      return;
    }
    this.toolbarButtonIndex.set(index);
    const buttons = this.toolbarButtonElems();
    buttons?.[index]?.nativeElement.focus();
  }

  onToolbarKeydown(event: KeyboardEvent, index: number) {
    const buttons = this.toolbarButtonElems();
    if (!buttons || buttons.length === 0) {
      return;
    }
    const lastIndex = buttons.length - 1;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        this.toolbarButtonIndex.set((index + 1) % buttons.length);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.toolbarButtonIndex.set(
          (index - 1 + buttons.length) % buttons.length,
        );
        break;
      case 'Tab':
        if (event.shiftKey) {
          if (index === 0) {
            return;
          }
          event.preventDefault();
          this.toolbarButtonIndex.set(index - 1);
        } else {
          if (index === lastIndex) {
            return; // Allow Tab to move focus out of the toolbar
          }
          event.preventDefault();
          this.toolbarButtonIndex.set(index + 1);
        }
        break;
      default:
        return;
    }

    const target = buttons[this.toolbarButtonIndex()];
    target?.nativeElement.focus();
  }

  private pasteHtmlAtCaret(html: string) {
    let range;

    if (window.getSelection) {
      const sel = window.getSelection()!;
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        // append the content in a temporary div
        const el = this.document.createElement('div');
        el.innerHTML = html;

        const frag = this.document.createDocumentFragment();
        let node;
        let lastNode;

        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);

        // Preserve the selection
        if (lastNode) {
          range = range.cloneRange();
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }

  private isSupportedCommand(command: string) {
    // List of commonly supported commands across modern browsers
    const supportedCommands = [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'subscript',
      'superscript',
      'justifycenter',
      'justifyfull',
      'justifyleft',
      'justifyright',
      'indent',
      'outdent',
      'insertorderedlist',
      'insertunorderedlist',
      'createlink',
      'unlink',
      'inserthtml',
      'insertimage',
      'formatblock',
      'removeformat',
    ];

    return supportedCommands.includes(command.toLowerCase());
  }

  private propagateChange: any = (_: any) => {};
}
