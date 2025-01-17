import { Component } from "@angular/core";
import { Router } from '@angular/router';
import { HeaderComponent } from "../../common/header/header.component";
import { FooterComponent } from "../../common/footer/footer.component";

@Component({
  selector: 'app-video-analyzer',
  standalone: true,
  imports: [HeaderComponent, FooterComponent],
  templateUrl: './HomeComponent.component.html',
})
export class HomeComponent {
  constructor(private readonly router: Router) { }

  navigateTo(link: string) {
    if(link==='/timeline'){
      if (!window.WebGLRenderingContext) {
        return this.router.navigate(['/timeline-2d']);
      } else {
        return this.router.navigate(['/timeline-3d']);
      }
    }
    else
      return this.router.navigate(['/'+link]);
  }
}
