import { Component } from "@angular/core";
import { Router } from '@angular/router';
import { HeaderComponent } from "../../common/header/header.component";
import { FooterComponent } from "../../common/footer/footer.component";
import {GraphComponent} from '../../common/graph/GraphComponent.component';

@Component({
  selector: 'app-video-analyzer',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, GraphComponent],
  templateUrl: './ProjectsComponent.component.html',
})
export class ProjectsComponent {
  projects = [
    { link: 'https://github.com/baddy2002/videoAnalyzer-link', name: 'VideoAnalyzer', description: "A web application with a system for detect anomaly movements" },
    { link: 'https://github.com/progetto2', name: 'Progetto 2', description: "Progetto 2" },
    { link: 'https://github.com/progetto3', name: 'Progetto 3', description: "Progetto 3" },
  ];

  constructor(private readonly router: Router) { }


  navigateTo(link: string) {
    return this.router.navigate(['/'+link]);
  }
}
