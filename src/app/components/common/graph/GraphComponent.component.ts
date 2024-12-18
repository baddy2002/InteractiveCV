import {Component, Input} from '@angular/core';
import {GraphEntryComponent} from '../graphEntry/GraphEntryComponent.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [
    GraphEntryComponent, CommonModule
  ],
  templateUrl: './GraphComponent.component.html',
  styleUrls: ['./GraphComponent.component.css']
})
export class GraphComponent {

  @Input() projects: { link: string, name: string, description: string }[] = [];


  addProject(link: string, name: string, description: string) {
    this.projects.push({ link, name, description });
  }

}
