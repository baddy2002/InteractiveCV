import { CanActivate, Routes } from '@angular/router';
import { Injectable } from '@angular/core';
import { HomeComponent } from './components/staticPages/home/HomeComponent.component';
import { AboutComponent } from './components/staticPages/about/AboutComponent.component';
import { CareerComponent} from './components/staticPages/career/CareerComponent.component';
import { ProjectsComponent} from './components/staticPages/projects/ProjectsComponent.component';
import {ContactComponent} from './components/staticPages/contact/ContactComponent.component';
import {Timeline3DComponent} from './components/staticPages/timeline3D/Timeline3DComponent.component';
import {Timeline2DComponent} from './components/staticPages/timeline2D/Timeline2DComponent.component';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    // Add authentication logic here
    return true;
  }
}

export const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'about', component: AboutComponent},
  {path: 'career', component: CareerComponent},
  {path: 'projects', component: ProjectsComponent},
  {path: 'contact', component: ContactComponent},
  { path: 'timeline-3d', component: Timeline3DComponent },
  { path: 'timeline-2d', component: Timeline2DComponent },
  { path: '**', redirectTo: 'timeline-3d' },
];
