import { Component, OnInit, ElementRef } from '@angular/core';
import { D3Service, D3, Selection } from 'd3-ng2-service';
import { RoundRobinCalcService } from '../roundrobin-calc.service'
import { ProcessDatabase } from '../process-database.service'
import { ProcessEntry } from '../process-entry'

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {

  private d3: D3;
  private parentNativeElement: any;
  private calcService: RoundRobinCalcService;
  private averageWaitingTime: number;
  private averageTurnaroundTime: number;
  private processDatabase = new ProcessDatabase();

  constructor(element: ElementRef,
    d3Service: D3Service,
    calcService: RoundRobinCalcService,
    database: ProcessDatabase) {

    this.d3 = d3Service.getD3();
    this.parentNativeElement = element.nativeElement;
    this.calcService = calcService;
    this.processDatabase = database;
  }

  ngOnInit() {
    this.calcService.currentAverageWaitingTime.subscribe(awt => this.averageWaitingTime = awt);
    this.calcService.currentAverageTurnaroundTime.subscribe(att => this.averageTurnaroundTime = att);

    this.drawChart();
  }

  drawChart() {
    let d3 = this.d3;
    let data: {name: string, startTime: number, endTime: number}[] = [];
    let processes: string[] = [];

    if (this.parentNativeElement !== null) {

      const width = 960;
      const height = 480;
      const rectHeight = 10;

      let svg = d3.select('#chart')
        .append('svg')
          .attr('width', width)
          .attr('height', height);

      let plotMargins = {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30
      };
      let plotGroup = svg.append('g')
        .classed('plot', true)
        .attr('transform', `translate(${plotMargins.left},${plotMargins.top})`);

      let plotWidth = width - plotMargins.left - plotMargins.right;
      let plotHeight = height - plotMargins.top - plotMargins.bottom;

      let xScale = d3.scaleLinear()
        .range([0, plotWidth])
        .domain([0, d3.max(data, (d) => d.endTime)]);
      let xAxis = d3.axisBottom(xScale);
      let xAxisGroup = plotGroup.append('g')
        .classed('x', true)
        .classed('axis', true)
        .attr('transform', `translate(${0},${plotHeight})`)
        .call(xAxis);

      let yScale = d3.scalePoint()
        .range([0, plotHeight])
        .domain(["P0"]);
      let yAxis = d3.axisLeft(yScale);
      let yAxisGroup = plotGroup.append('g')
        .classed('y', true)
        .classed('axis', true)
        .call(yAxis);

      let processGroup = plotGroup.append('g')
        .classed('process', true);

      let update = function() {
        let yScale = d3.scalePoint()
          .range([0, plotHeight])
          .domain(data.map((d) => d.name));
        let yAxis = d3.axisLeft(yScale);
        yAxisGroup.call(yAxis);

        let xScale = d3.scaleLinear()
          .range([0, plotWidth])
          .domain([0, d3.max(data, (d) => d.endTime)])
          .nice();
        let xAxis = d3.axisBottom(xScale);
        xAxisGroup.call(xAxis);


        var dataBound = processGroup.selectAll('.process')
          .data(data);



        dataBound
          .exit()
          .remove();

        var enterSelection = dataBound
          .enter()
            .append('g')
            .classed('process', true);

        enterSelection.merge(dataBound)
          .transition()
          .duration(500)
          .attr('transform', (d, i) => `translate(${xScale(d.startTime)},${yScale(d.name) - rectHeight})`);

        var rect = processGroup.selectAll('.process').selectAll('rect').data(data);

        rect.exit().remove();

        rect.enter().append('rect')
          .attr('height', rectHeight)
          .attr('width', (d) => (xScale(d.endTime - d.startTime)))
          .style('fill', 'red')
          .style('stroke', 'black')
          .style("stroke-width", '1px');

        rect.transition()
          .duration(500)
          .attr('width', (d) => (xScale(d.endTime - d.startTime)));
      }

      this.processDatabase.dataChange.asObservable().subscribe(nwData => {
        data = [];
        processes = [];
        for (let processEntry of nwData) {
          for (let i = 0; i < processEntry.timeStarts.length && i < processEntry.timeEnds.length; i++) {
            data.push({
              name: processEntry.process,
              startTime: processEntry.timeStarts[i],
              endTime: processEntry.timeEnds[i]
            });
            processes.push(processEntry.process);
          }
        }
        update();
      });

      update();
    }

  }

}
