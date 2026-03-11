import {
	ChangeDetectionStrategy,
	Component,
	Directive,
	ElementRef,
	NgModule,
	ViewEncapsulation,
	contentChildren,
	inject,
	input,
} from "@angular/core";

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
	},
})
export class ActionMenuTrigger {
	/**
	 * Reference to the action menu controlled by this trigger button.
	 */
	public actionMenuTriggerFor = input.required<ActionMenu>();
}

/**
 * Turns the element into a menu item with the according ARIA role and makes it available to the menu component.
 * The menu item must be a descendant of the `<app-action-menu>` component. Use `aria-disabled` to mark the
 * menu item as disabled if needed. You need to account for the disabled state in the click event handler of the menu item.
 */
@Directive({
	selector: "[actionMenuItem]",
	host: {
		role: "menuitem",
		tabindex: "-1",
	},
})
export class ActionMenuItem {}

/**
 * Creates an action menu panel (used together with directives `actionMenuTrigger` and `actionMenuItem`):
 * - Applies ARIA attributes and keyboard interaction as described in https://www.w3.org/WAI/ARIA/apg/patterns/menubar/.
 * - Defines the host element as a `popover` that is opened by the menu trigger button provided as an input.
 * - Also ensures that the menu panel is closed when a menu option is activated (on click or enter).
 */
@Component({
	selector: "app-action-menu",
	imports: [],
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
export class ActionMenu {
	/**
	 * Static counter to generate unique ids for multiple instances of this component.
	 */
	private static _idCounter = 1;

	/**
	 * All menu options inside the menu panel.
	 */
	private _menuOptions = contentChildren(ActionMenuItem, { read: ElementRef<HTMLElement> });
	private _menuPanelEl = inject(ElementRef);
	private _menuPanelId: string;
	private _menuTriggerId: string;
	private _selectedItem: HTMLElement | null = null;
	private _selectedItemIndex = 0;

	constructor() {
		this._menuPanelId = "custom-menu-panel-" + ActionMenu._idCounter;
		this._menuTriggerId = "custom-menu-btn-" + ActionMenu._idCounter;
		ActionMenu._idCounter++;
	}

	public get menuPanelId() {
		return this._menuPanelId;
	}

	public get menuTriggerId() {
		return this._menuTriggerId;
	}

	protected onMenuClick(event: Event): void {
		event.stopPropagation();
		(this._menuPanelEl.nativeElement as HTMLElement).hidePopover();
	}

	protected onMenuKeydown(event: KeyboardEvent): void {
		if (event.key === "ArrowDown") {
			this.selectNextMenuItem(event);
		} else if (event.key === "ArrowUp") {
			this.selectPreviousMenuItem(event);
		} else if (event.key === "Tab") {
			// On TAB or SHIFT+TAB, close panel after short delay.
			setTimeout(() => (this._menuPanelEl.nativeElement as HTMLElement).hidePopover(), 50);
		}
	}

	protected onMenuToggle(event: Event) {
		if ((event as ToggleEvent).newState === "open") {
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
}

@NgModule({
	imports: [ActionMenuTrigger, ActionMenuItem, ActionMenu],
	exports: [ActionMenuTrigger, ActionMenuItem, ActionMenu],
})
export class ActionMenuModule {}
