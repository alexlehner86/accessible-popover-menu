import { AfterContentInit, contentChildren, Directive, ElementRef, inject, input, signal } from "@angular/core";

/** todo describe. */
@Directive({
    selector: "[customMenuTrigger]",
    exportAs: "customMenuTrigger",
    host: {
        "[id]": "this.menuTriggerId()",
        "[attr.popovertarget]": "this.popoverTargetId()"
    },
})
export class CustomMenuTrigger {
    public menuTriggerId = signal<string>("");
    public popoverTargetId = signal<string>("");
}

/** todo describe. */
@Directive({
    selector: "[customMenuItem]",
    host: {
        "role": "menuitem",
        "tabindex": "-1",
    },
})
export class CustomMenuItem {}

/** todo describe. */
@Directive({
    selector: "[customMenu]",
    host: {
        "[attr.aria-labelledby]": "this.menuTriggerId",
        "class": "custom-menu",
        "[id]": "this.menuPanelId",
        "popover": "auto",
        "role": "menu"
    },
        // "(click)": "_handleClick($event)",
        // "(mousedown)": "_handleMousedown($event)",
        // "(keydown)": "_handleKeydown($event)",
})
export class CustomMenu implements AfterContentInit {
    /**
     * Reference to the trigger button that toggles the menu panel.
     */
    public customMenu = input.required<CustomMenuTrigger>();

    protected menuPanelId: string;
    protected menuTriggerId: string;

    private static _idCounter = 1;
 
    /** All menu options inside the menu panel */
    private _menuOptions = contentChildren(CustomMenuItem, { read: ElementRef<HTMLElement> });

    constructor() {
        this.menuPanelId = "custom-menu-panel-" + CustomMenu._idCounter;
        this.menuTriggerId = "custom-menu-btn-" + CustomMenu._idCounter;
        CustomMenu._idCounter++;
    }
    
    public ngAfterContentInit() {
        this.customMenu().menuTriggerId.set(this.menuTriggerId);
        this.customMenu().popoverTargetId.set(this.menuPanelId);
        console.log(this._menuOptions().length);
    }
}