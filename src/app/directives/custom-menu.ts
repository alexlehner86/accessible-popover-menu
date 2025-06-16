import { AfterContentInit, contentChildren, Directive, ElementRef, inject, input, signal } from "@angular/core";

/**
 * Turns the element into a menu trigger button that opens the connected menu panel via the `popovertarget` attribute.
 * You need to also create a template reference on the element (e.g., `#trigger="customMenuTrigger"`) and pass this
 * reference as an input to the `customMenu` directive (e.g., `[customMenu]="trigger"`).
 */
@Directive({
    selector: "[customMenuTrigger]",
    exportAs: "customMenuTrigger",
    host: {
        "[id]": "menuTriggerId()",
        "[attr.popovertarget]": "popoverTargetId()"
    },
})
export class CustomMenuTrigger {
    public menuTriggerBtnEl = inject(ElementRef);
    public menuTriggerId = signal<string>("");
    public popoverTargetId = signal<string>("");
}

/**
 * Turns the element into a menu item with the according ARIA role and makes it available to the `customMenu` directive.
 * The menu item must be a descendant of the HTML element with the `customMenu` directive.
 */
@Directive({
    selector: "[customMenuItem]",
    host: {
        "role": "menuitem",
        "tabindex": "-1",
    },
})
export class CustomMenuItem {}

/**
 * Turns an element into a custom menu panel (together with directives `customMenuTrigger` and `customMenuItem`):
 * - Applies ARIA attributes and keyboard interaction as described in https://www.w3.org/WAI/ARIA/apg/patterns/menubar/.
 * - Defines the host element as a `popover` that is opened by the menu trigger button provided as an input.
 * - Also ensures that the menu panel is closed when a menu option is activated (on click or enter).
 */
@Directive({
    selector: "[customMenu]",
    host: {
        "[attr.aria-labelledby]": "menuTriggerId",
        "class": "custom-menu-panel",
        "[id]": "menuPanelId",
        "popover": "auto",
        "role": "menu",
        "[style.--transform-origin]": "transformOrigin()",
        "(click)": "onMenuClick($event)",
        "(keydown)": "onMenuKeydown($event)",
        "(toggle)": "onMenuToggle($event)"
    },
})
export class CustomMenu implements AfterContentInit {
    /**
     * Reference to the trigger button that toggles the menu panel.
     */
    public menuTriggerBtn = input.required<CustomMenuTrigger>({ alias: 'customMenu' });

    protected menuPanelId: string;
    protected menuTriggerId: string;
    protected transformOrigin = signal<string>("top left");

    private static _idCounter = 1;
 
    /** All menu options inside the menu panel */
    private _menuOptions = contentChildren(CustomMenuItem, { read: ElementRef<HTMLElement> });
    private _menuPanelEl = inject(ElementRef);
    private _selectedItem: HTMLElement | null = null;
    private _selectedItemIndex = 0;

    constructor() {
        this.menuPanelId = "custom-menu-panel-" + CustomMenu._idCounter;
        this.menuTriggerId = "custom-menu-btn-" + CustomMenu._idCounter;
        CustomMenu._idCounter++;
    }
    
    public ngAfterContentInit(): void {
        this.menuTriggerBtn().menuTriggerId.set(this.menuTriggerId);
        this.menuTriggerBtn().popoverTargetId.set(this.menuPanelId);
    }

    protected onMenuClick(event: Event): void {
        (this._menuPanelEl.nativeElement as HTMLElement).hidePopover();
    }

    protected onMenuKeydown(event: KeyboardEvent): void {
        if (event.key === 'ArrowDown') {
            this.selectNextMenuItem(event);
        } else if (event.key === 'ArrowUp') {
            this.selectPreviousMenuItem(event);
        }
    }

    protected onMenuToggle(event: Event) {
        if ((event as ToggleEvent).newState === 'open') {
            // Adapt transform animation according to placement of panel
            this.setTransformOriginOnMenuPanel();
            // Select first item when menu is opened
            this.selectAndFocusMenuItem(0);
        } else {
            // Cleanup when menu is closed
            this._selectedItem!.tabIndex = -1;
        }
    }

    private selectNextMenuItem(event: KeyboardEvent) {
        // Remove currently selected menu item from tab order
        this._selectedItem!.tabIndex = -1;
        // Focus next menu item. If we're at the last item, then loop back to first.
        if (this._selectedItemIndex < this._menuOptions().length - 1) {
            this.selectAndFocusMenuItem(this._selectedItemIndex + 1);
        } else {
            this.selectAndFocusMenuItem(0);
        }
        event.preventDefault();
    }

    private selectPreviousMenuItem(event: KeyboardEvent) {
        // Remove currently selected menu item from tab order
        this._selectedItem!.tabIndex = -1;
        // Focus previous menu item. If we're at the first item, then loop back to last.
        if (this._selectedItemIndex > 0) {
            this.selectAndFocusMenuItem(this._selectedItemIndex - 1);
        } else {
            this.selectAndFocusMenuItem(this._menuOptions().length - 1);
        }
        event.preventDefault();
    }

    private selectAndFocusMenuItem(index: number): void {
        this._selectedItemIndex = index;
        this._selectedItem = this._menuOptions()[index].nativeElement as HTMLElement;
        this._selectedItem.tabIndex = 0;
        this._selectedItem.focus();
    }

    /**
     * We need to manually set transform-origin, because @position-try doesn't allow setting this CSS property.
     * See: https://www.w3.org/TR/css-anchor-position-1/#fallback-rule
     * In the future, we should be able to achieve the same result without JavaScript, only using CSS container style queries:
     * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries#container_style_queries
     */
    private setTransformOriginOnMenuPanel(): void {
        const menuPanel = this._menuPanelEl.nativeElement;
        const menuTriggerBtn = this.menuTriggerBtn().menuTriggerBtnEl.nativeElement;
        let originY = menuTriggerBtn.offsetTop > menuPanel.offsetTop ? "bottom" : "top";
        let originX = menuTriggerBtn.offsetLeft > menuPanel.offsetLeft ? "right" : "left";
        this.transformOrigin.set(`${originY} ${originX}`);
    }
}