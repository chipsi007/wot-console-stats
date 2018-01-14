import React from 'react';
import Chart from 'chart.js';


export default class ChartLine extends React.PureComponent {
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

    // Pulling the data from props.
    const COLORS = ['#A06868', '#8098A0', '#81A080', '#A08450', '#A0688E'];
    const DATASETS = this.props.data.map((x, i) => {
      return({
        label: x.label,
        fill: false,
        spanGaps: true,
        borderColor: COLORS[i],
        pointBackgroundColor: COLORS[i],
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: COLORS[i],
        data: x.rows
      });
    });

    // Update chart if already exists.
    if (this.Chart) {
      this.Chart.data.datasets = DATASETS;
      this.Chart.update();
      return
    }

    // If doesnt exist, create chart.
    let ctx = this.chartRef;
    this.Chart = new Chart(ctx, {
      type: 'line',
      data:  {
        datasets: DATASETS
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
