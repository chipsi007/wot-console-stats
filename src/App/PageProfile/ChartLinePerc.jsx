import React from 'react';
import Chart from 'chart.js';


// Line chart for Percentiles on the first tab of "Profile" page.


export default class ChartLinePerc extends React.PureComponent {
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
      type: 'line',
      data:  {
        labels: DATA.xlabels,
        datasets: [{
          label: 'Total Percentile',
          fill: true,
          backgroundColor: 'hsla(130, 25%, 63%, 0.1)',
          borderColor: 'hsl(130, 25%, 63%)',
          pointBackgroundColor: 'hsl(130, 25%, 63%)',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: 'hsl(130, 25%, 63%)',
          data: DATA.percentiles_totals,
        }],
      },
      options: {
        legend: {
          display: false,
        },
        scales: {
          yAxes: [{
            ticks: {
              callback: function(label, index, labels) {
                return Math.round(label * 100) / 100;
              }
            },
          }],
        },
      },
    });
  }

  
  render() {
    return(<canvas ref='chart' width='100' height='40'></canvas>);
  }
}
