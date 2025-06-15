import { Component, ViewEncapsulation } from '@angular/core';
import { UserMenu } from './components/user-menu/user-menu';

@Component({
  selector: 'app-root',
  imports: [UserMenu],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class App {
}
