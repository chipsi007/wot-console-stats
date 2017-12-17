import React from 'react';
import Chart from 'chart.js';


export default class ChartLine extends React.PureComponent {
  //this.props.timestamps
  //this.props.totals
  //this.props.change
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

    // Pulling the data from props.
    const LABELS = this.props.timestamps.map(x => x * 1000);
    const TOTALS = this.props.totals;
    const CHANGE = this.props.change.map(x => (x == 0) ? null : x);

    // Creating the chart.
    this.Chart = new Chart(ctx, {
      type: 'line',
      data:  {
        labels: LABELS,
        datasets: [
          {
            label: 'Change',
            fill: false,
            spanGaps: true,
            hidden: true,
            backgroundColor: 'hsla(0, 35%, 63%, 0.2)',
            borderColor: 'hsl(0, 35%, 63%)',
            pointBackgroundColor: 'hsl(0, 35%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(0, 35%, 63%)',
            data: CHANGE
          },
          {
            label: 'Total',
            fill: true,
            backgroundColor: 'hsla(195, 20%, 63%, 0.1)',
            borderColor: 'hsl(195, 20%, 63%)',
            pointBackgroundColor: 'hsl(195, 20%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(195, 20%, 63%)',
            data: TOTALS
          }
        ]
      },
      options: {
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM D'
              }
            }
          }],
          yAxes: [
            {
              scaleLabel: {
                display: true
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            // Format for x axis.
            title: function(tooltipItem, data) {
              const DATE = new Date(tooltipItem[0].xLabel);
              const MONTH = DATE.toLocaleString('en-us', { month: 'long' });
              return `${ MONTH } ${ DATE.getDate() }, ${ DATE.getFullYear() }`;
            },
            // Format for y axis.
            label: function(tooltipItem, data) {
              return Math.round(tooltipItem.yLabel * 1000) / 1000;
            }
          }
        }
      }
    });
  }

  render() {
    return(<canvas ref={ (x) => this.chartRef = x } width='100' height='25'></canvas>);
  }
}
