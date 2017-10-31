import React from 'react';
import Chart from 'chart.js';


export default class ChartBar extends React.Component {
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

  shouldComponentUpdate(nextProps, nextState) {
    return(this.props != nextProps);
  }

  openChart() {

    // Destroying the chart and picking the reference.
    if (this.Chart) this.Chart.destroy();
    let ctx = this.refs.chart;


    // Pulling the data from props.
    const LABELS = this.props.estimates.map((x) => x.label);
    const VALUES = this.props.estimates.map((x) => x.value);
    const WN8_SCORE = this.props.wn8;


    // Making colors arrays. Highlighting user WN8 score.
    let scoreIndex = null;
    for (let i = 0; i < LABELS.length; i++) {
      if (WN8_SCORE >= LABELS[i]) { scoreIndex = i }
    }
    let backgroundColors = [];
    let borderColors = [];
    for (let i = 0; i < LABELS.length; i++) {
      if (scoreIndex === i) {
        backgroundColors.push('hsla(0, 35%, 63%, 0.2)');
        borderColors.push('hsl(0, 35%, 63%)');
      } else {
        backgroundColors.push('hsla(200, 25%, 63%, 0.1)');
        borderColors.push('hsl(200, 25%, 63%)');
      }
    }


    // Creating the chart.
    this.Chart = new Chart(ctx, {
      type: 'bar',
      data:  {
        labels: LABELS,
        datasets: [
          {
            label: 'Expected DMG',
            fill: true,
            borderWidth: 2,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            data: VALUES
          }
        ]
      },
      options: {
        title: {
          display: true,
          text: 'Damage Targets' },
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            ticks: {
              callback: function(value, index, values) {
                return(value + ' WN8');
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Dmg needed'
            }
          }]
        }
      }
    });
  }

  render() {
    return(<canvas ref='chart' width='100' height='25'></canvas>);
  }
}
