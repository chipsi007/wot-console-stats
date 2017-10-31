import React from 'react';
import Chart from 'chart.js';


// Radar chart on the second tab of the "Profile" page.


export default class ChartRadar extends React.PureComponent {
  //this.props.data
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
    
    if (this.Chart) this.Chart.destroy();
    let ctx = this.refs.chart; 
    
    const DATA = this.props.data;

    this.Chart = new Chart(ctx, {
      type: 'radar',
      data:  {
        labels: ['Accuracy', 'Damage Caused', 'Radio Assist', 'WinRate', 'Damage Received (inv)'],
        datasets: [
          {
            label: 'Recent Percentiles',
            fill: true,
            backgroundColor: 'hsla(0, 35%, 63%, 0.2)',
            borderColor: 'hsl(0, 35%, 63%)',
            pointBackgroundColor: 'hsl(0, 35%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(0, 35%, 63%)',
            data: [
              DATA.recent.percentiles.acc,
              DATA.recent.percentiles.dmgc,
              DATA.recent.percentiles.rass,
              DATA.recent.percentiles.wr,
              DATA.recent.percentiles.dmgr
            ],
          },
          {
            label: 'All Time Percentiles',
            fill: true,
            backgroundColor: 'hsla(200, 25%, 63%, 0.1)',
            borderColor: 'hsl(200, 25%, 63%)',
            pointBackgroundColor: 'hsl(200, 25%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(200, 25%, 63%)',
            data: [
              DATA.all_time.percentiles.acc,
              DATA.all_time.percentiles.dmgc,
              DATA.all_time.percentiles.rass,
              DATA.all_time.percentiles.wr,
              DATA.all_time.percentiles.dmgr
            ],
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
    return(<canvas ref='chart' width='100' height='70'></canvas>);
  }
}