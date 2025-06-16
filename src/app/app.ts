import { Component, ViewEncapsulation } from '@angular/core';
import { UserMenu } from './components/user-menu/user-menu';
import { CharacterMenu } from './components/character-menu/character-menu';

@Component({
  selector: 'app-root',
  imports: [CharacterMenu, UserMenu],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class App {
    protected marvelCharacters: string[] = ["Deadpool", "Thor", "Captain Marvel", "Hulk", "Black Widow", "Captain America", "Ant-Man"];
}
