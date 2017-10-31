import React from 'react';
import Chart from 'chart.js';


// Line chart for WN8 on the first tab of "Profile" page.


export default class ChartLineWn8 extends React.PureComponent {
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
          label: 'WN8',
          fill: true,
          backgroundColor: 'hsla(200, 25%, 63%, 0.1)',
          borderColor: 'hsl(200, 25%, 63%)',
          pointBackgroundColor: 'hsl(200, 25%, 63%)',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: 'hsl(200, 25%, 63%)',
          data: DATA.wn8_totals,
        }]
      },
      options: {
        legend: {
          display: false
        },
        scales: {
          yAxes: [{
            ticks: {
              callback: function(label, index, labels) {
                return Math.round(label);
              }
            }
          }]
        }
      }
    });
  }

  
  render() {
    return(<canvas ref='chart' width='100' height='40'></canvas>);
  }
}
