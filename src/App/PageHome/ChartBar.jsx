import React from 'react';
import Chart from 'chart.js';


export default class ChartBar extends React.PureComponent {
  //this.props.totals
  //this.props.change
  //this.props.timestamps
  //this.props.overrideBarColors
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

    const DATASETS = [
      {
        label: 'Average in period',
        type: 'bar',
        backgroundColor: (this.props.overrideBarColors) ? this.props.overrideBarColors : 'hsl(130, 25%,  63%)',
        borderColor: 'hsl(0, 0%, 100%)',
        borderWidth: 3,
        data: this.props.change
      },
      {
        label: 'All time average',
        type: 'line',
        fill: false,
        borderColor: 'hsl(195, 20%, 63%)',
        pointBackgroundColor: 'hsl(195, 20%, 63%)',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: 'hsl(195, 20%, 63%)',
        data: this.props.totals
      }
    ];

    // Update chart if already exists.
    if (this.Chart) {
      this.Chart.data.datasets = DATASETS;
      this.Chart.update();
      return
    }

    // If doesnt exist, create chart.
    let ctx = this.chartRef
    this.Chart = new Chart(ctx, {
      type: 'bar',
      data:  {
        labels: this.props.timestamps,
        datasets: DATASETS
      },
      options: {
        scales: {
          xAxes: [{
            barPercentage: 0.7,
            ticks: {
              // Show day and month.
              callback: function(value, index, values) {
                const DATE = new Date(value * 1000);
                const MONTH = DATE.toLocaleString('en-us', { month: 'short' });
                return `${ MONTH } ${ DATE.getDate() }`;
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true
            }
          }]
        }
      }
    });
  }


  render() {
    return(<canvas ref={ (x) => this.chartRef = x } width='100' height='25'></canvas>);
  }
}
