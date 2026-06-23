import { DOCUMENT } from "@angular/common";
import {
  Component,
  ElementRef,
  Inject,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  SimpleChanges,
  ViewEncapsulation,
  computed,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
  ChangeDetectionStrategy
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { CommandFunction, TButton } from "./config";
import { NgxWigFilterService } from "./ngx-wig-filter.service";
import { NgxWigToolbarService } from "./ngx-wig-toolbar.service";

/** @dynamic */
@Component({
  selector: "ngx-wig",
  templateUrl: "./ngx-wig-component.html",
  styleUrls: ["./ngx-wig-component.css"],
  providers: [
    NgxWigToolbarService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgxWigComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class NgxWigComponent
  implements OnInit, OnChanges, ControlValueAccessor
{
  public readonly content = model<string>();

  public readonly placeholder = input<string>();

  public readonly buttons = input<string>();

  public readonly disabled = model(false);

  public readonly ngxWigEditable = viewChild.required("ngWigEditable", {
    read: ElementRef,
  });

  public readonly editMode = signal(false);

  public readonly container = computed<HTMLElement>(
    () => this.ngxWigEditable().nativeElement,
  );
  public readonly toolbarButtons = computed<TButton[]>(() => {
    const buttons = this.buttons();
    const toolbarButtons = this._ngWigToolbarService.getToolbarButtons(buttons);
    toolbarButtons.forEach((b) => {
      if (!b.children?.length) return;
      b.dropdownButtonIndex = 0;
    });

    return toolbarButtons;
  });
  public readonly hasFocus = signal(false);
  public readonly toolbarButtonIndex = signal<number>(0);

  private readonly toolbarButtonElems = viewChildren("toolbarButton", {
    read: ElementRef,
  });

  public constructor(
    private readonly _ngWigToolbarService: NgxWigToolbarService,
    @Optional() private readonly _filterService: NgxWigFilterService,
    // cannot set Document here - Angular issue - https://github.com/angular/angular/issues/20351
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject("WINDOW") private readonly window: Window,
  ) {}

  private executeCommand(command: string, value: string = ""): boolean {
    try {
      if (this.container().contentEditable !== "true") {
        return false;
      }

      // For now, use execCommand for backward compatibility
      // TODO: Replace with modern APIs when execCommand is fully deprecated
      if (command === "unlink") {
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

  public execCommand(
    command: string | CommandFunction | undefined,
    options?: string,
  ): boolean {
    if (typeof command === "function") {
      command(this);
      return true;
    }

    if (this.editMode()) {
      return false;
    }

    if (typeof command !== "string" || !command) {
      return false;
    }

    if (!this.isSupportedCommand(command)) {
      throw new Error(`The command "${command}" is not supported`);
    }

    if (
      (command === "createlink" && !this.isLinkSelected()) ||
      command === "insertImage"
    ) {
      options = window.prompt("Please enter the URL", "http://") ?? "";
      if (!options) {
        return false;
      }
    }

    this.container().focus();

    let success = false;
    if (command === "createlink" && this.isLinkSelected()) {
      success = this.executeCommand("unlink");
    } else {
      success = this.executeCommand(command, options ?? "");
    }

    if (success) {
      this.onContentChange(this.container().innerHTML);
    }

    return success;
  }

  public ngOnInit(): void {
    const content = this.content();
    if (content) {
      this.container().innerHTML = content;
    }
  }

  public onContentChange(newContent: string): void {
    this.content.set(this.isInnerTextEmpty(newContent) ? "" : newContent);

    this.propagateChange(this.content());
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const container = this.container();
    if (container && changes["content"]) {
      // we need to focus the container before pasting at the caret
      container.focus();

      // clear the previous content
      container.innerHTML = "";

      // add the new content
      if (this._filterService) {
        this.pasteHtmlAtCaret(
          this._filterService.filter(changes["content"].currentValue),
        );
      } else {
        this.pasteHtmlAtCaret(changes["content"].currentValue);
      }
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const text =
      event.clipboardData?.getData("text/html") ||
      event.clipboardData?.getData("text/plain") ||
      "";

    if (this._filterService) {
      this.pasteHtmlAtCaret(this._filterService.filter(text));
    } else {
      this.pasteHtmlAtCaret(text);
    }

    this.onContentChange(this.container().innerHTML);
  }

  public onTextareaChange(newContent: string): void {
    // model -> view
    this.container().innerHTML = newContent;
    this.onContentChange(newContent);
  }

  public writeValue(value: any): void {
    value = value ?? "";
    this.container().innerHTML = value;
    this.content.set(value);
  }

  public shouldShowPlaceholder(): boolean {
    return !!this.placeholder() && !this.container().innerText;
  }

  public registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }

  public propagateTouched = () => {};

  public onBlur() {
    this.hasFocus.set(false);
    this.propagateTouched();
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  public isInnerTextEmpty(content: string): boolean {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(content, "text/html");

    return htmlDoc.documentElement?.innerText === "";
  }

  public isLinkSelected(): boolean {
    if (window.getSelection()?.toString() === "") return false;

    const selection = window.getSelection();
    if (!selection) return false;

    return (
      selection.focusNode?.parentNode?.nodeName === "A" ||
      selection.anchorNode?.parentNode?.nodeName === "A"
    );
  }

  public onDropdownButtonSelected(button: TButton, event?: Event): void {
    event?.preventDefault();

    if (button.isOpenOnMouseOver) return;
    if (button.visibleDropdown) {
      this.closeDropdown(button);
      return;
    }
    button.visibleDropdown = true;
    button.dropdownButtonIndex = 0;
    const dropdown = (event?.currentTarget as HTMLElement)?.querySelector(
      ".nwe-dropdown-content",
    );
    const buttons = Array.from(
      dropdown?.querySelectorAll("button") ?? [],
    ) as HTMLElement[];
    buttons[0]?.focus();
  }

  public onDropdownKeydown(event: KeyboardEvent, button: TButton): void {
    const dropdown = (event.currentTarget as HTMLElement).closest(
      ".nwe-dropdown-content",
    );
    const buttons = Array.from(
      dropdown?.querySelectorAll("button") ?? [],
    ) as HTMLElement[];
    const index = buttons.indexOf(event.currentTarget as HTMLElement);
    if (index === -1) {
      return;
    }
    const lastIndex = buttons.length - 1;
    let newIndex = index;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        newIndex = (index + 1) % buttons.length;
        break;
      case "ArrowUp":
        event.preventDefault();
        newIndex = (index - 1 + buttons.length) % buttons.length;
        break;
      case "Tab":
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
      case "Escape":
        event.preventDefault();
        this.closeDropdown(button);
        return;
      default:
        return;
    }
    button.dropdownButtonIndex = newIndex;
    buttons[newIndex].focus();
  }

  public closeDropdown(button: TButton): void {
    button.visibleDropdown = false;
    this.focusToolbarButton(button);
  }

  private focusToolbarButton(button: TButton): void {
    const index = this.toolbarButtons().indexOf(button);
    if (index === -1) {
      return;
    }
    this.toolbarButtonIndex.set(index);
    const buttons = this.toolbarButtonElems();
    buttons?.[index]?.nativeElement.focus();
  }

  public onToolbarKeydown(event: KeyboardEvent, index: number): void {
    const buttons = this.toolbarButtonElems();
    if (!buttons || buttons.length === 0) {
      return;
    }
    const lastIndex = buttons.length - 1;

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        this.toolbarButtonIndex.set((index + 1) % buttons.length);
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.toolbarButtonIndex.set(
          (index - 1 + buttons.length) % buttons.length,
        );
        break;
      case "Tab":
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
        const el = this.document.createElement("div");
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

  private isSupportedCommand(command: string): boolean {
    // List of commonly supported commands across modern browsers
    const supportedCommands = [
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "subscript",
      "superscript",
      "justifycenter",
      "justifyfull",
      "justifyleft",
      "justifyright",
      "indent",
      "outdent",
      "insertorderedlist",
      "insertunorderedlist",
      "createlink",
      "unlink",
      "inserthtml",
      "insertimage",
      "formatblock",
      "removeformat",
    ];

    return supportedCommands.includes(command.toLowerCase());
  }

  private propagateChange: any = (_: any) => {};
}
