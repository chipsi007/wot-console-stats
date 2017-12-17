import React from 'react';


import ChartBar from './ChartBar';


export default class EstimatesTank extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view:      'chart',

      wn8:       null,
      actValues: null,
      expValues: null,
      estimates: null,
      tankData:  null
    };
    this.fetchData = this.fetchData.bind(this);
  }

  
  fetchData() {
    // Get props and states.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;
    const TANK_ID = this.props.tankID;

    // Assemble the url.
    const ARGS = `?server=${ SERVER }&account_id=${ ACCOUNT_ID }&tank_id=${ TANK_ID }`;
    const URL = '/newapi/estimates/get-tank/' + ARGS;

    // Fetching.
    fetch(URL)
      .then(response => { return response.json() })
      .then(j => {
        if (j.status != 'ok') {
          alert(j.message);
          return;
        }
        this.setState({
          wn8:       j.data.wn8_score,
          actValues: j.data.wn8_act_values,
          expValues: j.data.wn8_exp_values,
          estimates: j.data.wn8_estimates,
          tankData:  j.data.tank_data
        });
      })
      .catch(error => {
        alert('There has been a problem with your fetch operation: ' + error.message);
      });
  }

  
  componentDidMount() {
    // Fetchng the data only once.
    if (!this.state.tankData) { this.fetchData() }
  }

  
  shouldComponentUpdate(nextProps, nextState) {
    return(this.state != nextState);
  }

  
  /* render */
  
  
  loading() {
    return( 
      <article className='media'>
        <div className='media-content'>
          <div className='content'>
            <div className='columns'>
              <div className='column is-4 is-offset-4'>
                <a className='button is-large is-white is-loading is-fullwidth'></a>
              </div>
            </div>
          </div>
        </div>
        <div className='media-right'>
          <button className='delete' onClick={ () => this.props.remove(this.props.tankID) }></button>
        </div>
      </article>
    );
  }

  
  table() {
    const A_VALS = this.state.actValues;
    const E_VALS = this.state.expValues;

    // Damage targets.
    const LABELS = this.state.estimates.map((x) => x.label);
    const VALUES = this.state.estimates.map((x) => x.value);

    return( 
      <div>
        <table className='table is-narrow is-bordered is-fullwidth'>
          <thead>
            <tr>{ LABELS.map((x) => (<th key={ x }>{ x }</th>)) }</tr>
          </thead>
          <tbody>
            <tr>{ VALUES.map((x) => (<td key={ x }>{ x }</td>)) }</tr>
          </tbody>
        </table>
        <table className='table is-narrow is-bordered is-fullwidth'>
          <thead>
            <tr>
              <th></th>
              <th>Damage</th>
              <th>Def</th>
              <th>Frag</th>
              <th>Spot</th>
              <th>WinRate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Your values</td>
              <td>{ A_VALS.Damage }</td>
              <td>{ A_VALS.Def }</td>
              <td>{ A_VALS.Frag }</td>
              <td>{ A_VALS.Spot }</td>
              <td>{ A_VALS.WinRate }</td>
            </tr>
            <tr>
              <td>Expected values</td>
              <td>{ E_VALS.expDamage }</td>
              <td>{ E_VALS.expDef }</td>
              <td>{ E_VALS.expFrag }</td>
              <td>{ E_VALS.expSpot }</td>
              <td>{ E_VALS.expWinRate }</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  
  render() {
    
    // Loading if no tank data.
    if (!this.state.tankData) { return(this.loading()) }

    // Chart or table.
    let body = (
      <ChartBar 
        estimates={ this.state.estimates }
        wn8={ this.state.wn8 }
      />
    );
    if (this.state.view === 'table') { body = this.table() }

    return(
      <article className='media'>
        <div className='media-content'>
          <div className='content'>
            <strong>{ this.props.tankName }</strong>
            <span className='tag is-rounded' style={ {'marginLeft': 4} }>
              { 'Tier ' + this.props.tankTier }
            </span>
            <span className='tag is-rounded' style={ {'marginLeft': 4} }>
              { this.props.tankType[0].toUpperCase() + this.props.tankType.slice(1).replace('Tank', ' Tank') }
            </span>
            <span className='tag is-rounded' style={ {'marginLeft': 4} }>
              { this.props.tankNation.toUpperCase() }
            </span>
          </div>

          <nav className='level is-mobile'>
            <div className='level-left'>
              <a className='level-item' onClick={ () => this.setState({view: 'chart'}) }>
                <span className='icon is-small'><i className='fa fa-bar-chart'></i></span>
              </a>
              <a className='level-item' onClick={ () => this.setState({view: 'table'}) }>
                <span className='icon is-small'><i className='fa fa-table'></i></span>
              </a>
              <small>Current WN8: { this.state.wn8 }</small>
            </div>
          </nav>

          { body }

        </div>
        <div className='media-right'>
          <button className='delete' onClick={ () => this.props.remove(this.props.tankID) }></button>
        </div>
      </article>
    );
  }
}
