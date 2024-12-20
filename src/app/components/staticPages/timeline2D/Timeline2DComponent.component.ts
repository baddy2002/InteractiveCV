import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import {HeaderComponent} from '../../common/header/header.component';
import {FooterComponent} from '../../common/footer/footer.component';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-timeline-2d',
  imports: [HeaderComponent, FooterComponent, CommonModule],
  standalone: true,
  templateUrl: './Timeline2DComponent.component.html',
})
export class Timeline2DComponent implements OnInit {
  ngOnInit(): void {
    const svg = d3
      .select('#map')
      .append('svg')
      .attr('width', 800)
      .attr('height', 400);

    svg
      .append('circle')
      .attr('cx', 100)
      .attr('cy', 100)
      .attr('r', 20)
      .attr('fill', 'blue')
      .on('click', () => alert('Scuola superiore'));
  }
}
