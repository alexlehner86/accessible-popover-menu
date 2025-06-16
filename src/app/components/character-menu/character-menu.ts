import { Component, ViewEncapsulation } from '@angular/core';
import { CustomMenu, CustomMenuItem, CustomMenuTrigger } from '../../directives/custom-menu';

@Component({
  selector: 'app-character-menu',
  imports: [CustomMenu, CustomMenuItem, CustomMenuTrigger],
  templateUrl: './character-menu.html',
  styleUrl: './character-menu.css',
  encapsulation: ViewEncapsulation.None
})
export class CharacterMenu {}
