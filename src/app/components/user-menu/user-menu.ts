import { Component, ViewEncapsulation } from '@angular/core';
import { ActionMenuModule } from '../action-menu/action-menu';

@Component({
  selector: 'app-user-menu',
  imports: [ActionMenuModule],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
  encapsulation: ViewEncapsulation.None
})
export class UserMenu {}
