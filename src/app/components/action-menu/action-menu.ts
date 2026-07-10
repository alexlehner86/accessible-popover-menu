import {
	AfterContentInit,
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	NgModule,
	OnInit,
	ViewEncapsulation,
	contentChildren,
	inject,
	input,
	output,
	signal,
} from "@angular/core";

//#region Helpers
/**
 * Checks if the given element has the `aria-disabled="true"` attribute.
 */
const isAriaDisabledTrue = (item: HTMLElement | null | undefined): boolean => {
	return item?.matches("[aria-disabled='true']") ?? false;
};

/**
 * Checks if the given element is a submenu trigger (i.e., it opens a nested menu).
 */
const isSubmenuTrigger = (item: HTMLElement | null | undefined): boolean => {
	return item?.classList.contains("submenu-trigger") ?? false;
};
//#endregion

//#region Menu Trigger
/**
 * Turns the element into a menu trigger button that opens the connected menu panel via the `popovertarget` attribute.
 * You need to create a template reference on the menu component (e.g., `#menu="actionMenu"`) and pass this
 * reference as an input to this directive (e.g., `[actionMenuTriggerFor]="menu"`).
 */
@Directive({
	selector: "[actionMenuTriggerFor]",
	exportAs: "actionMenuTrigger",
	host: {
		"[id]": "actionMenuTriggerFor().menuTriggerId",
		"[attr.popovertarget]": "actionMenuTriggerFor().menuPanelId",
		"aria-haspopup": "menu",
		"[class.submenu-trigger]": "isSubmenuTrigger()",
		"(mouseover)": "openSubmenu($event)",
	},
})
export class ActionMenuTrigger implements OnInit {
	/**
	 * Reference to the action menu controlled by this trigger button.
	 */
	public actionMenuTriggerFor = input.required<ActionMenu>();
	/**
	 * Whether this trigger button is a submenu trigger (i.e., it opens a nested menu).
	 * Is set by the parent action menu component when the trigger button is nested within it.
	 */
	public isSubmenuTrigger = signal(false);

	private _menuTriggerEl = inject(ElementRef);

	public ngOnInit(): void {
		// Provide the trigger button element reference to the connected action menu component.
		this.actionMenuTriggerFor().provideMenuTriggerEl(this._menuTriggerEl);
	}

	/**
	 * If the trigger button is a submenu trigger and is not disabled, opens the linked menu panel.
	 */
	protected openSubmenu(event: Event): void {
		if (!this.isSubmenuTrigger() || isAriaDisabledTrue(event.target as HTMLElement)) return;

		const menuTriggerBtn = this._menuTriggerEl.nativeElement as HTMLButtonElement;
		const isPopoverOpen = menuTriggerBtn.popoverTargetElement?.matches(":popover-open") || false;

		if (!isPopoverOpen) {
			menuTriggerBtn.click();
		}
	}
}
//#endregion

//#region Menu Item
/**
 * Set the directive on a `<button>` tag and place it inside an `<app-action-menu>` component. The directive turns
 * the element into a menu item with the according ARIA role and makes it available to the menu component.
 * It's recommended to use the custom `activate` event to handle the menu item activation. The native `click` event
 * would also work for enabled menu items, but not for disabled ones. To disable a menu item:
 * - Set `aria-disabled="true"`, which will also prevent the custom `activate` event from being emitted.
 * - Don't use the `disabled` attribute as this would interfere with the arrow navigation inside the menu. 
 */
@Directive({
	selector: "[actionMenuItem]",
	host: {
		role: "menuitem",
		tabindex: "-1",
		"(click)": "onMenuItemClick($event)",
	},
})
export class ActionMenuItem {
	/**
	 * Event emitted when the menu item is activated (e.g., via click or enter key).
	 * Doesn't get emitted if the menu item is disabled (i.e., has `aria-disabled="true"`).
	 */
	public activate = output<void>();

	protected onMenuItemClick(event: Event): void {
		// If the menu item is disabled, ignore the click event and prevent it from bubbling up to parent menus.
		if (isAriaDisabledTrue(event.target as HTMLElement)) {
			event.stopPropagation();
			event.preventDefault();
		} else {
			this.activate.emit();
		}
	}
}
//#endregion

//#region Action Menu
/** 
 * Keys that are only handled by the closest action menu component and should not bubble up to parent menus.
 */
const ACTION_MENU_CONTAINED_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape"];

/**
 * Creates an action menu panel (used together with directives `actionMenuTrigger` and `actionMenuItem`):
 * - Applies ARIA attributes and keyboard interaction as described in https://www.w3.org/WAI/ARIA/apg/patterns/menubar/.
 * - Defines the host element as a `popover` that is opened by the menu trigger button provided as an input.
 * - Also ensures that the menu panel is closed when a menu item is activated (on click or enter).
 * - Supports nested menus: Use the `[actionMenuTriggerFor]` directive on the menu item that should open the submenu.
 * Place the nested `<app-action-menu>` right after its trigger button to create a meaningful sequence of content.
 */
@Component({
	selector: "app-action-menu",
	templateUrl: "./action-menu.html",
	styleUrl: "./action-menu.css",
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: "actionMenu",
	host: {
		"[attr.aria-labelledby]": "menuTriggerId",
		"[id]": "menuPanelId",
		popover: "auto",
		role: "menu",
		"(click)": "onMenuClick($event)",
		"(keydown)": "onMenuKeydown($event)",
		"(toggle)": "onMenuToggle($event)",
	},
})
export class ActionMenu implements AfterContentInit {
	/**
	 * Static counter to generate unique ids for multiple instances of this component.
	 */
	private static _idCounter = 1;

	/**
	 * Whether this action menu is a submenu (i.e., it is opened by a menu item in another action menu).
	 */
	public isSubmenu = signal(false);

	/**
	 * All menu items inside the menu panel.
	 */
	private _menuItems = contentChildren(ActionMenuItem, { read: ElementRef<HTMLElement> });
	private _menuPanelEl = inject(ElementRef);
	private _menuPanelId: string;
	private _menuTriggerId: string;
	private _menuTriggerEl = signal<ElementRef | null>(null);
	private _selectedItem: HTMLElement | null = null;
	private _selectedItemIndex = 0;
	/**
	 * The contained submenu triggers (i.e., menu items that open a nested menu).
	 */
	private _submenuTriggers = contentChildren(ActionMenuTrigger);
	/**
	 * The contained submenus (i.e., nested action menus).
	 */
	private _submenus = contentChildren(ActionMenu);

	constructor() {
		this._menuPanelId = "custom-menu-panel-" + ActionMenu._idCounter;
		this._menuTriggerId = "custom-menu-btn-" + ActionMenu._idCounter;
		ActionMenu._idCounter++;
	}

	public ngAfterContentInit(): void {
		this._submenuTriggers().forEach((trigger) => trigger.isSubmenuTrigger.set(true));
		this._submenus().forEach((submenu) => submenu.isSubmenu.set(true));
	}

	public get menuPanelId() {
		return this._menuPanelId;
	}

	public get menuTriggerId() {
		return this._menuTriggerId;
	}

	public provideMenuTriggerEl(triggerEl: ElementRef): void {
		this._menuTriggerEl.set(triggerEl);
	}

	protected onMenuClick(event: Event): void {
		// In case of submenus, we let the click bubble up to close all nested menus.
		// Only the outermost menu will stop propagation to prevent unintended actions outside of the menu.
		if (!this.isSubmenu()) {
			event.stopPropagation();
		}

		// Only close the menu if the clicked item is not a submenu trigger (i.e., it doesn't open a nested menu).
		if (!isSubmenuTrigger(event.target as HTMLElement)) {
			(this._menuPanelEl.nativeElement as HTMLElement).hidePopover();
		}
	}

	/**
	 * Keyboard interaction for the menu panel as defined in https://www.w3.org/WAI/ARIA/apg/patterns/menubar/.
	 */
	protected onMenuKeydown(event: KeyboardEvent): void {
		if (ACTION_MENU_CONTAINED_KEYS.includes(event.key)) {
			// Stop propagation of contained keys (e.g. arrow keys) to prevent parent menus from handling them as well.
			event.stopPropagation();
		}

		switch (event.key) {
			case "ArrowDown":
				this.selectNextMenuItem(event);
				break;
			case "ArrowUp":
				this.selectPreviousMenuItem(event);
				break;
			case "ArrowLeft":
			case "Escape":
				this.closeSubmenu(event);
				break;
			case "ArrowRight":
				this.openSubmenu(event);
				break;
			case "Tab":
				// On TAB or SHIFT+TAB, close panel after short delay.
				setTimeout(() => (this._menuPanelEl.nativeElement as HTMLElement).hidePopover(), 50);
		}
	}

	protected onMenuToggle(event: Event) {
		if ((event as ToggleEvent).newState === "open") {
			// Select first item when menu is opened
			this.selectAndFocusMenuItem(0);
		} 
	}

	/**
	 * Focus next menu item. If we're at the last item, then loop back to first.
	 */
	private selectNextMenuItem(event: KeyboardEvent) {
		event.preventDefault();
		if (this._selectedItemIndex < this._menuItems().length - 1) {
			this.selectAndFocusMenuItem(this._selectedItemIndex + 1);
		} else {
			this.selectAndFocusMenuItem(0);
		}
	}

	/**
	 * Focus previous menu item. If we're at the first item, then loop back to last.
	 */
	private selectPreviousMenuItem(event: KeyboardEvent) {
		event.preventDefault();
		if (this._selectedItemIndex > 0) {
			this.selectAndFocusMenuItem(this._selectedItemIndex - 1);
		} else {
			this.selectAndFocusMenuItem(this._menuItems().length - 1);
		}
	}

	private selectAndFocusMenuItem(index: number): void {
		this._selectedItemIndex = index;
		this._selectedItem = this._menuItems()[index].nativeElement as HTMLElement;
		this._selectedItem.focus();
	}

	/**
	 * Closes the innermost submenu and focuses its parent menu trigger button.
	 * If the current menu is not a submenu, does nothing as the native popover behavior is sufficient.
	 */
	private closeSubmenu(event: KeyboardEvent): void {
		if (this.isSubmenu()) {
			event.preventDefault();
			this._menuPanelEl.nativeElement.hidePopover();
			this._menuTriggerEl()?.nativeElement.focus();
		}
	}

	/**
	 * Opens the submenu if the currently selected menu item is a submenu trigger (i.e., it opens a nested menu).
	 */
	private openSubmenu(event: KeyboardEvent): void {
		event.preventDefault();
		if (isSubmenuTrigger(this._selectedItem)) {
			// Open the submenu if the currently selected item is a submenu trigger
			(this._selectedItem as HTMLButtonElement).click();
		}
	}
}
//#endregion

//#region Module
@NgModule({
	imports: [ActionMenuTrigger, ActionMenuItem, ActionMenu],
	exports: [ActionMenuTrigger, ActionMenuItem, ActionMenu],
})
export class ActionMenuModule {}
//#endregion
