import React from 'react';


import Loading from '../Loading';
import ChartRadar from './ChartRadar';


export default class PageSessiontracker extends React.Component {
  //this.props.server
  //this.props.accountID
  constructor(props) {
    super(props);
    this.state = {
      timestamps: null,
      timestamp: 0,
      data: null,
      tankID: 9999999
    };
    this.convertTime = this.convertTime.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.setTimestamp = this.setTimestamp.bind(this);
    this.genControls = this.genControls.bind(this);
    this.miniTable = this.miniTable.bind(this);
    this.mainBody = this.mainBody.bind(this);
  }

  
  convertTime(seconds) {
    if (seconds >= 60) {
      const M = parseInt(seconds / 60);
      const S = parseInt(seconds - M * 60);
      return(String(M) + 'm ' + String(S) + 's');
    } else {
      return(String(seconds) + 's');
    }
  }

  
  fetchData() {
    // Empty the data.
    this.setState({data: null});

    // Assembling the url.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;
    const TIMESTAMP = this.state.timestamp;
    const FILTERS = '&';
    const TYPE = 'session_tracker';
    const URL = '/api/' + TYPE + '/' + SERVER + '/' + ACCOUNT_ID + '/' + TIMESTAMP + '/' + FILTERS + '/';
    // Fetching.
    fetch(URL)
      .then(response => { return response.json() })
      .then(j => {
        if (j.status != 'ok') {
          window.alert('Server returned an error: ' + j.message);
        } else {
          this.setState({
            timestamp: j.data.timestamp,
            timestamps: j.data.timestamps,
            data: j.data.session_tanks
          });
        }
      })
      .catch(error => {
        alert('There has been a problem with your fetch operation: ' + error.message);
      });
  }

  
  setTimestamp(iTimestamp) {
    // Passing as a callback function so the data fetched after the state has changed.
    this.setState({timestamp: iTimestamp}, () => this.fetchData());
  }

  
  componentDidMount() {
    if (!this.state.data) { this.fetchData() }
    
    // Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', 'Session Tracker');
      ga('send', 'pageview');
    }
  }

  
  /* render */
  
  
  genControls() {

    const TIMESTAMPS = this.state.timestamps;
    const SELECTED_TIMESTAMP = this.state.timestamp;

    // Blank if no snapshots.
    if (!TIMESTAMPS) { return(null) }

    // Message if 0 snapshots.
    if (TIMESTAMPS.length === 0) {
      return( <div className='column'>
        <div className='notification'>
          There are currently no snapshots available for comparison, but your today's data is saved. Come back tomorrow to see how your recent performace compares to your all-time statistics.
        </div>
      </div>);
    }

    let output = [];
    TIMESTAMPS.forEach((timestamp) => {
      const DAYS_AGO = Math.round((Date.now() / 1000 - timestamp) / 60 / 60 / 24);
      let className = 'pagination-link';
      if (timestamp == SELECTED_TIMESTAMP) { className += ' is-current' }

      output.push(<li key={ timestamp }>
        <a className={ className } onClick={ () => this.setTimestamp(timestamp) }>{ DAYS_AGO }</a>
      </li>);
    });

    const DAYS_AGO = Math.round((Date.now() / 1000 - SELECTED_TIMESTAMP) / 60 / 60 / 24);
    return( <nav className='pagination'>
      <a className='pagination-previous' disabled>Snapshot between { DAYS_AGO } days ago and now</a>
      <ul className='pagination-list'>
        { output }
      </ul>
    </nav>);
  }

  
  miniTable(oTank) {

    const tank = oTank;

    let thead = tank.tank_name + ' Battles: ' + tank.session.battles + '  Wins: ' + tank.session.wins;

    let tableItems = [
      ['Accuracy',           tank.session.acc,      tank.all.acc],
      ['Damage Caused',      tank.session.dmgc,     tank.all.dmgc],
      ['Radio Assist',       tank.session.rass,     tank.all.rass],
      ['Experience',         tank.session.exp,      tank.all.exp],
      ['Damage Received',    tank.session.dmgr,     tank.all.dmgr],
      ['Lifetime',           tank.session.lifetime, tank.all.lifetime],
      ['DPM',                tank.session.dpm,      tank.all.dpm],
      ['WN8',                tank.session.wn8,      tank.all.wn8]
    ];

    let tbody = [];
    tableItems.forEach((row) => {
      switch(row[0]) {
      // Percent with 2 decimals.
      case 'Accuracy':
        row[1] = String(Math.round(row[1] * 100) / 100) + ' %';
        row[2] = String(Math.round(row[2] * 100) / 100) + ' %';
        break;
      case 'Lifetime':
        row[1] = this.convertTime(row[1]);
        row[2] = this.convertTime(row[2]);
        break;
        // Integer.
      default:
        row[1] = Math.round(row[1]);
        row[2] = Math.round(row[2]);
        break;
      }
      tbody.push(
        <tr key={ row[0] }>
          <td>{ row[0] }</td><td>{ row[1] }</td><td>{ row[2] }</td>
        </tr>
      );
    });

    return(
      <table className='table'>
        <thead>
          <tr>
            <th colSpan={ 3 }>
              { thead }
            </th>
          </tr>
          <tr>
            <th>Averages</th>
            <th>Session</th>
            <th>All time</th>
          </tr>
        </thead>
        <tbody>
          { tbody }
        </tbody>
      </table>
    );
  }

  
  mainBody() {

    // Loading indicator if data property is null.
    if (this.state.data === null) { return(<Loading />) }

    // Message if data.length = 0 and number of timestamps more than 0.
    if ((this.state.data.length === 0) && (this.state.timestamps.length > 0)) {
      return( 
        <div className='container'>
          <div className='notification'>
            No tanks were played.
          </div>
        </div>
      );
    }

    // Blank if data.length = 0.
    if (this.state.data.length === 0) { return(null) }

    // Assuming property exists and length > 0
    const TANKS = this.state.data;
    let tankID = this.state.tankID;
    let selectedTank = TANKS.filter((x) => x.tank_id == this.state.tankID)[0];

    // If no tanks selected in the array.
    if (!selectedTank) {
      selectedTank = TANKS[0];
      tankID = selectedTank.tank_id;
    }

    // Menu elements.
    let menu = [];
    TANKS.forEach((tank) => {
      let className = '';
      if (tank.tank_id == tankID) { className = 'is-active' }

      menu.push(
        <li key={ tank.tank_id }>
          <a 
            className={ className }
            onClick={ () => this.setState({tankID: tank.tank_id }) }
          >
            {tank.tank_name}
          </a>
        </li>
      );
    });

    return(
      <div className='container'>
        <div className='tile is-ancestor'>

          <div className='tile is-parent is-2'>
            <div className='tile is-child box'>
              <aside className='menu'>
                <p className='menu-label'>Tanks</p>
                <ul className='menu-list'>
                  { menu }
                </ul>
              </aside>
            </div>
          </div>

          <div className='tile is-parent is-5'>
            <div className='tile is-child box is-12'>
              <ChartRadar 
                all_time={ selectedTank.all.radar }
                recent={ selectedTank.session.radar }
              />
            </div>
          </div>

          <div className='tile is-parent is-5'>
            <div className='tile is-child box is-12'>
              { this.miniTable(selectedTank) }
            </div>
          </div>

        </div>
      </div>
    );
  }

  
  render() {
    return(
      <section style={{marginTop: '24px'}}>
        <div className='container' style={{marginBottom: '20px'}}>
          { this.genControls() }
        </div>
        <div className='container'>
          { this.mainBody() }
        </div>
      </section>
    );
  }
}