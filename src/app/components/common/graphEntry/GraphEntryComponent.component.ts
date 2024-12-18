import { Component, Input } from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'graph-entry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './GraphEntryComponent.component.html',
})
export class GraphEntryComponent {
  @Input() link: string = '';
  @Input() name: string = '';
  @Input() description: string = '';
  @Input() customClass: string = '';
}
