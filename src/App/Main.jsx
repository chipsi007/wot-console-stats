import React from 'react';


import Hero from './Hero';
import Nav from './Nav';

import PageProfile from './PageProfile';
import PageVehicles from './PageVehicles';
import PageTimeseries from './PageTimeseries';
import PageSessionTracker from './PageSessionTracker';
import PageEstimates from './PageEstimates';


export default class Main extends React.Component {
  //this.props.nickname
  //this.props.accountID
  //this.props.server
  //this.props.updateRootInfo
  constructor(props) {
    super(props);
    this.state = {

      pages: [
        { label: 'Profile',         iconClass: 'fa fa-user',            active: true },
        { label: 'Vehicles',        iconClass: 'fa fa-table',           active: false },
        { label: 'Time Series',     iconClass: 'fa fa-line-chart',      active: false },
        { label: 'Session Tracker', iconClass: 'fa fa-calendar',        active: false },
        { label: 'WN8 Estimates',   iconClass: 'fa fa-calculator',      active: false }
      ],
      tabs: [
        {label: 'Dashboard', active: true},
        {label: 'In-Detail', active: false}
      ],

      loading: false,
      timestamp: 0,
      filterBy50: false,

      profile: null,
      vehicles: null,
      timeSeries: null,
      sessionTracker: null,
      wn8Estimates: null,

      filters: [
        {label: 'Tier 1',        type: 'tiers', active: true, id: '1'},
        {label: 'Tier 2',        type: 'tiers', active: true, id: '2'},
        {label: 'Tier 3',        type: 'tiers', active: true, id: '3'},
        {label: 'Tier 4',        type: 'tiers', active: true, id: '4'},
        {label: 'Tier 5',        type: 'tiers', active: true, id: '5'},
        {label: 'Tier 6',        type: 'tiers', active: true, id: '6'},
        {label: 'Tier 7',        type: 'tiers', active: true, id: '7'},
        {label: 'Tier 8',        type: 'tiers', active: true, id: '8'},
        {label: 'Tier 9',        type: 'tiers', active: true, id: '9'},
        {label: 'Tier 10',       type: 'tiers', active: true, id: '10'},
        {label: 'Light Tanks',   type: 'class', active: true, id: 'lightTank'},
        {label: 'Medium Tanks',  type: 'class', active: true, id: 'mediumTank'},
        {label: 'Heavy Tanks',   type: 'class', active: true, id: 'heavyTank'},
        {label: 'AT-SPG',        type: 'class', active: true, id: 'AT-SPG'},
        {label: 'SPG',           type: 'class', active: true, id: 'SPG'}
      ],
      selectors: [
        {label: 'WinRate', active: true,  id: 'wr'},
        {label: 'Battles', active: false, id: 'battles'},
        {label: 'WN8',     active: true,  id: 'wn8'},

        {label: 'Avg Dmg',   active: false, id: 'avg_dmg'},
        {label: 'Avg Frags', active: false, id: 'avg_frags'},
        {label: 'Avg Exp',   active: false, id: 'avg_exp'},

        {label: 'Avg DPM', active: true,  id: 'avg_dpm'},
        {label: 'Avg FPM', active: false, id: 'avg_fpm'},
        {label: 'Avg EPM', active: false, id: 'avg_epm'},

        {label: 'Dmg Percentile', active: false,  id: 'dmg_perc'},
        {label: 'WR Percentile',  active: true,   id: 'wr_perc'},
        {label: 'Exp Percentile', active: false,  id: 'exp_perc'},

        {label: 'Penetrated/Hits caused', active: false, id: 'pen_hits_ratio'},
        {label: 'Bounced/Hits received',  active: false, id: 'bounced_hits_ratio'},
        {label: 'Survived',               active: false, id: 'survived'},

        {label: 'Total Lifetime',   active: false, id: 'total_time_m'},
        {label: 'Average Lifetime', active: false, id: 'avg_lifetime_s'},
        {label: 'Last battle time', active: false, id: 'last_time'}
      ]
    };
    this.switchPage = this.switchPage.bind(this);
    this.switchTab = this.switchTab.bind(this);
    this.switchFilter = this.switchFilter.bind(this);
    this.switchSelector = this.switchSelector.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
    this.setTimestamp = this.setTimestamp.bind(this);

    this.switchFilterBy50 = this.switchFilterBy50.bind(this);

    this.fetchData = this.fetchData.bind(this);
  }


  switchPage(sPage) {

    //Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', sPage);
      ga('send', 'pageview');
    }

    let newPages = this.state.pages;

    newPages.forEach((row) => {
      row.active = false;
      if (row.label == sPage) row.active = true;
    });

    this.setState({pages: newPages});

    // Setting tabs for 'Profile'.
    if (sPage === 'Profile') {
      this.setState({tabs: [
        {label: 'Dashboard', active: true},
        {label: 'In-Detail', active: false}
      ]});
    } else {
      this.setState({tabs: []});
    }
  }
  
  
  switchTab(sTab) {

    let newTabs = this.state.tabs;

    newTabs.forEach((row) => {
      row.active = false;
      if (row.label == sTab) row.active = true;
    });

    this.setState({tabs: newTabs});
  }
  
  
  switchFilter(sFilterID) {

    let filters = this.state.filters;

    filters.forEach((item) => {
      if (item.id == sFilterID) item.active = !item.active;
    });

    this.setState({filters: filters});
  }
  
  
  switchSelector(sSelectorID) {

    let selectors = this.state.selectors;

    selectors.forEach((item) => {
      if (item.id == sSelectorID) item.active = !item.active;
    });

    this.setState({selectors: selectors});
  }
  
  
  switchFilterBy50() {
    const OUTPUT = !this.state.filterBy50;
    this.setState({filterBy50: OUTPUT});
  }
  
  
  resetFilters() {
    let filters = this.state.filters;
    filters.forEach((item) => item.active = true);
    this.setState({filters: filters});
  }
  
  
  setTimestamp(iTimestamp) {
    // Passing as a callback so the data fetched after the state has changed.
    this.setState({timestamp: iTimestamp}, () => this.fetchData());
  }


  fetchData() {
    // Get props and states.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;

    const CURRENT_PAGE = this.state.pages.filter((x) => x.active === true).map((x) => x.label)[0];
    const TIMESTAMP = this.state.timestamp;

    const TEMP_FILTERS = this.state.filters.filter((x) => x.active === true).map((x) => x.id);
    const FILTERS = '&' + TEMP_FILTERS.join('&');


    // Obtain the type of request.
    let type;
    switch (CURRENT_PAGE) {
    case 'Profile':
      type = 'profile';
      this.setState({profile: null});
      break;
    case 'Vehicles':
      type = 'vehicles';
      this.setState({vehicles: null});
      break;
    case 'Time Series':
      type = 'time_series';
      this.setState({timeSeries: null});
      break;
    case 'Session Tracker':
      type = 'session_tracker';
      this.setState({sessionTracker: null});
      break;
    case 'WN8 Estimates':
      type = 'wn8_estimates';
      this.setState({wn8Estimates: null});
      break;
    }

    // Assembling the url.
    let url = '/api/' + type + '/' + SERVER + '/' + ACCOUNT_ID + '/' + TIMESTAMP + '/' + FILTERS + '/';

    // Fetching.
    this.setState({loading: true});
    fetch(url)
      .then(response => { return response.json() })
      .then(j => {
        this.setState({loading: false});
        if (j.status != 'ok') {
          alert(j.message);
        } else {
          const RESULT = j.data;
          switch (CURRENT_PAGE) {
          case 'Profile':
            this.setState({profile: RESULT});
            break;
          case 'Vehicles':
            this.setState({vehicles: RESULT});
            break;
          case 'Time Series':
            this.setState({timeSeries: RESULT});
            break;
          case 'Session Tracker':
            this.setState({sessionTracker: RESULT});
            break;
          case 'WN8 Estimates':
            this.setState({wn8Estimates: RESULT});
            break;
          default:
            break;
          }
        }
      })
      .catch(error => {
        this.setState({loading: false});
        alert('There has been a problem with your fetch operation: ' + error.message);
      });
  }

  
  /* render */
  
  
  genFilters(sType) {
    // sType is either 'class' or 'tiers'

    const ITEMS = this.state.filters.filter((item) => item.type == sType);

    let output = ITEMS.map((item) => {
      return(
        <div className='column' key={ item.id }>
          <a 
            className={ 'button is-small is-light is-fullwidth' + ((item.active) ? ' is-active' : '') }
            onClick={ () => this.switchFilter(item.id) }
          >
            { item.label }
          </a>
        </div>
      );
    });

    return( 
      <div className='columns is-gapless is-mobile is-multiline is-marginless'>
        { output }
      </div>
    );
  }
  
  
  genSelectors() {

    const ITEMS = this.state.selectors;

    function isActive(bool) {
      if (bool) {
        return('button is-small is-light is-fullwidth is-active');
      } else {
        return('button is-small is-light is-fullwidth');
      }
    }

    let list = [];
    for (let x = 0; x < ITEMS.length; x += 3) {
      list.push(
        <div className='column' key={ ITEMS[x].id }>
          <a className={ isActive( ITEMS[x].active ) } onClick={ () => this.switchSelector(ITEMS[x].id) }>
            { ITEMS[x].label }
          </a>
          <a className={ isActive( ITEMS[x+1].active ) } onClick={ () => this.switchSelector(ITEMS[x+1].id) }>
            { ITEMS[x+1].label }
          </a>
          <a className={ isActive( ITEMS[x+2].active ) } onClick={ () => this.switchSelector(ITEMS[x+2].id) }>
            { ITEMS[x+2].label }
          </a>
        </div>
      );
    }

    return( 
      <div className='columns is-gapless is-mobile is-multiline'>
        { list }
      </div>
    );
  }
  
  
  genResetButton() {
    return( 
      <div className='field'>
        <a className='button is-warning is-small is-fullwidth' onClick={ this.resetFilters }>
          Reset Filters
        </a>
      </div>
    );
  }
  
  
  genFilterBy50() {

    return(
      <div className='field'>
        <a className={ 'button is-light is-small is-fullwidth' + ((this.state.filterBy50 === true) ? ' is-active' : '') }
          onClick={ this.switchFilterBy50 }>
          Filter by at least 50 battles
        </a>
      </div>
    );
  }
  
  
  genRefreshButton() {
    return( 
      <div className='level'>
        <a className={ 'button is-primary is-fullwidth' + ((this.state.loading) ? ' is-loading' : '') } 
          onClick={ this.fetchData }>
          Refresh
        </a>
      </div>
    );
  }

  
  render() {

    let body;
    const CURRENT_PAGE = this.state.pages.filter((x) => x.active === true).map((x) => x.label)[0];

    // Choosing body.
    switch(CURRENT_PAGE) {
    case 'Profile':
      body = (
        <PageProfile 
          data={ this.state.profile }
          tabs={ this.state.tabs }
          fetchData={ this.fetchData }
        />
      );
      break;
    case 'Vehicles':
      body = (
        <PageVehicles 
          data={ this.state.vehicles }
          filters={ this.state.filters }
          selectors={ this.state.selectors }
          filterBy50={ this.state.filterBy50 }
          fetchData={ this.fetchData } 
        />
      );
      break;
    case 'Time Series':
      body = (
        <PageTimeseries 
          server={ this.props.server }
          accountID={ this.props.accountID }
        />
      );
      break;
    case 'Session Tracker':
      body = (
        <PageSessionTracker 
          server={ this.props.server }
          accountID={ this.props.accountID } 
        />
      );
      break;
    case 'WN8 Estimates':
      body = (
        <PageEstimates
          server={ this.props.server }
          accountID={ this.props.accountID }
        />
      );
      break;
    default:
      body = (<div>Error: page doesn't exist</div>);
      break;
    }

    // Choosing controls if 'Profile' or 'Vehicles'.
    let controls = null;
    if (['Profile', 'Vehicles'].includes(CURRENT_PAGE)) {
      controls = (
        <div className='container' style={ {marginTop: 15 + 'px', marginBottom: 15 + 'px'} }>
          { (CURRENT_PAGE === 'Vehicles') ? this.genSelectors() : null }
          { this.genFilters('tiers') }
          { this.genFilters('class') }
          { (CURRENT_PAGE === 'Vehicles') ? this.genFilterBy50() : null }
          { (CURRENT_PAGE === 'Profile') ? this.genResetButton() : null }
          { this.genRefreshButton() }
        </div>
      );
    }
    
    return(
      <div>
        <Hero
          pages={ this.state.pages }
          nickname={ this.props.nickname }
          switchPage={ this.switchPage }
          updateRootInfo={ this.props.updateRootInfo }
        />
        <Nav 
          tabs={ this.state.tabs }
          switchTab={ this.switchTab }
        />
        {controls}
        {body}
      </div>
    );
  }
}
