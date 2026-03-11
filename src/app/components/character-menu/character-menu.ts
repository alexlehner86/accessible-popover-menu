import { Component, ViewEncapsulation } from '@angular/core';
import { ActionMenuModule } from '../action-menu/action-menu';

@Component({
  selector: 'app-character-menu',
  imports: [ActionMenuModule],
  templateUrl: './character-menu.html',
  styleUrl: './character-menu.css',
  encapsulation: ViewEncapsulation.None
})
export class CharacterMenu {}
