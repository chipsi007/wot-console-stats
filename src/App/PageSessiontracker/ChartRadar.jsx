import React from 'react';
import Chart from 'chart.js';


export default class ChartRadar extends React.PureComponent {
  //this.props.all_time
  //this.props.recent
  constructor(props) {
    super(props);
    this.openChart = this.openChart.bind(this);
  }

  
  componentDidMount() {
    this.openChart();
  }

  
  componentDidUpdate() {
    this.openChart();
  }

  
  componentWillUnmount() {
    if (this.Chart) { this.Chart.destroy() }
  }

  
  openChart() {

    // Destroying the chart and picking the reference.
    if (this.Chart) this.Chart.destroy();
    let ctx = this.chartRef;

    const ALL_TIME = this.props.all_time;
    const RECENT = this.props.recent;

    this.Chart = new Chart(ctx, {
      type: 'radar',
      data:  {
        labels: ['Accuracy', 'Damage Caused', 'Radio Assist', 'Experience', 'Damage Received (inv)'],
        datasets: [
          {
            label: 'Selected period',
            fill: true,
            backgroundColor: 'hsla(0, 35%, 63%, 0.2)',
            borderColor: 'hsl(0, 35%, 63%)',
            pointBackgroundColor: 'hsl(0, 35%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(0, 35%, 63%)',
            data: RECENT,
          },
          {
            label: 'All time',
            fill: true,
            backgroundColor: 'hsla(200, 25%, 63%, 0.1)',
            borderColor: 'hsl(200, 25%, 63%)',
            pointBackgroundColor: 'hsl(200, 25%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(200, 25%, 63%)',
            data: ALL_TIME,
          }
        ]
      },
      options: {
        scale: {
          ticks: {
            beginAtZero: true
          }
        }
      }
    });
  }

  render() {
    return(<canvas ref={ (x) => this.chartRef = x } width='100' height='100'></canvas>);
  }
}
