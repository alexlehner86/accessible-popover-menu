import { Component, ViewEncapsulation } from '@angular/core';
import { CustomMenu, CustomMenuItem, CustomMenuTrigger } from '../../directives/custom-menu';

@Component({
  selector: 'app-user-menu',
  imports: [CustomMenu, CustomMenuItem, CustomMenuTrigger],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
  encapsulation: ViewEncapsulation.None
})
export class UserMenu {

}
