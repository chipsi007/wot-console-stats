import React from 'react';


import EstimatesTank from './EstimatesTank';


// "Estimates" page.


export default class PageEstimates extends React.Component {
  //this.props.server
  //this.props.accountID
  constructor(props) {
    super(props);
    this.state = {
      typeFilter: null,
      textFilter: '',

      playerTanks: [],
      selectedTankIDs: [],

      limit: 10
    };
    this.fetchTanks = this.fetchTanks.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
  }

  
  componentDidMount() {
    if (this.state.playerTanks.length === 0) { this.fetchTanks() }
    
    // Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', 'WN8 Estimates');
      ga('send', 'pageview');
    }
  }

  
  fetchTanks() {
    // Get props and states.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;

    // Assemble the url.
    const ARGS = `?server=${ SERVER }&account_id=${ ACCOUNT_ID }`;
    const URL = '/newapi/general/get-player-tanks/' + ARGS;

    // Fetching.
    fetch(URL)
      .then(response => { return response.json() })
      .then(j => {
        if (j.status != 'ok') {
          window.alert(j.message);
          return;
        }
        if (j.data.length === 0) {
          window.alert('No tanks on the account.');
          return;
        }
        this.setState({playerTanks: j.data});
      })
      .catch(error => {
        alert('There has been a problem with your fetch operation: ' + error.message);
      });
  }

  
  toggleSelect(iTankID) {

    let selectedTankIDs = this.state.selectedTankIDs;
    let index = selectedTankIDs.indexOf(iTankID);

    if (index === -1) {
      selectedTankIDs.push(iTankID);
    } else {
      selectedTankIDs.splice(index, 1);
    }

    this.setState({selectedTankIDs: selectedTankIDs});
  }

  
  panel() {

    // Filters.
    const TEXT_FILTER = this.state.textFilter;
    const TYPE_FILTER = this.state.typeFilter;

    const PLAYER_TANKS = this.state.playerTanks;
    const SELECTED_TANKS = this.state.selectedTankIDs;

    // Adding tanks to the panel & filtering.
    let body = [];
    let counter = 0;
    for (let tank of PLAYER_TANKS) {

      // Filters.
      if ((TYPE_FILTER) && (TYPE_FILTER != tank.type)) { continue }
      if (!tank.name.toLowerCase().includes(TEXT_FILTER)) { continue }

      const IS_ACTIVE = SELECTED_TANKS.includes(tank.tank_id);

      body.push(
        <a className={ 'panel-block' + ((IS_ACTIVE) ? ' is-active' : '') }
          onClick={ () => this.toggleSelect(tank.tank_id) }
          key={ tank.tank_id }>
          <span className='panel-icon'>
            <i className={ (IS_ACTIVE) ? 'fa fa-check' : 'fa fa-minus' }></i>
          </span>
          <span className='tag is-rounded' style={ {'marginRight': 4} }>
            { 'Tier ' + tank.tier }
          </span>
          <span className='tag is-rounded' style={ {'marginRight': 4} }>
            { tank.nation.toUpperCase() }
          </span>
          { tank.name }
        </a>
      );

      // Adding 'show more' button if hitting the limit.
      counter += 1;
      if (counter >= this.state.limit) {
        body.push(
          <p className='panel-tabs' key={ 'addmore' }>
            <a onClick={ () => this.setState({limit: this.state.limit + 10}) }>
              <span className='icon'><i className='fa fa-ellipsis-h'></i></span>
            </a>
          </p>
        );
        break;
      }
    }

    return( 
      <nav className='panel'>
        <p className='panel-heading'>Tanks</p>
        <div className='panel-block'>
          <p className={ 'control has-icons-left' + ((this.state.playerTanks.length === 0) ? ' is-loading' : '') }>
            <input className='input' 
              type='text' 
              placeholder='Filter by tank name'
              onChange={ () => this.setState({textFilter: this.textFilterRef.value}) }
              ref={ (x) => this.textFilterRef = x }
            />
            <span className='icon is-small is-left'>
              <i className='fa fa-search'></i>
            </span>
          </p>
        </div>
        <p className='panel-tabs'>
          <a className={ (this.state.typeFilter === null) ? 'is-active' : '' }
            onClick={ () => this.setState({typeFilter: null}) }>
            All
          </a>
          <a className={ (this.state.typeFilter === 'lightTank') ? 'is-active' : '' }
            onClick={ () => this.setState({typeFilter: 'lightTank'}) }>
            LT
          </a>
          <a className={ (this.state.typeFilter === 'mediumTank') ? 'is-active' : '' }
            onClick={ () => this.setState({typeFilter: 'mediumTank'}) }>
            MT
          </a>
          <a className={ (this.state.typeFilter === 'heavyTank') ? 'is-active' : '' }
            onClick={ () => this.setState({typeFilter: 'heavyTank'}) }>
            HT
          </a>
          <a className={ (this.state.typeFilter === 'AT-SPG') ? 'is-active' : '' }
            onClick={ () => this.setState({typeFilter: 'AT-SPG'}) }>
            AT-SPG
          </a>
          <a className={ (this.state.typeFilter === 'SPG') ? 'is-active' : '' }
            onClick={ () => this.setState({typeFilter: 'SPG'}) }>
            SPG
          </a>
        </p>

        { body }

        <div className='panel-block'>
          <a className='button is-primary is-outlined is-fullwidth'
            onClick={ () => this.setState({selectedTankIDs: []}) }>
            <span className='icon'><i className='fa fa-trash-o'></i></span>
          </a>
        </div>
      </nav>
    );
  }

  
  emptyTanksField() {
    return( 
      <article className='media box'>
        <div className='media-content'>
          <div className='content has-text-centered'>
            <h4>No tanks selected</h4>
            <p>
              Click on a tank in the left panel to view damage targets necessary to achieve a certain WN8 score.
              <br />
              The targets are calculated precisely for your account data with WN8 expected values extracted from WoT Console player base.
            </p>
          </div>
        </div>
      </article>
    );
  }

  
  render() {

    const SELECTED_IDS = this.state.selectedTankIDs;
    const PLAYER_TANKS = this.state.playerTanks.filter((x) => SELECTED_IDS.includes(x.tank_id));

    let outputTanks = [];

    SELECTED_IDS.forEach((tankID) => {
      const TANK = PLAYER_TANKS.filter((x) => x.tank_id == tankID)[0];
      outputTanks.push(
        <EstimatesTank 
          accountID={ this.props.accountID }
          server={ this.props.server }
          tankID={ TANK.tank_id }
          tankName={ TANK.name }
          tankTier={ TANK.tier }
          tankType={ TANK.type }
          tankNation={ TANK.nation }
          key={ TANK.tank_id }
          remove={ this.toggleSelect }
        />
      );
    });

    if (SELECTED_IDS.length === 0) { outputTanks = this.emptyTanksField() }

    return( 
      <section style={{marginTop: '24px'}}>
        <div className='container'>
          <div className='columns'>
            <div className='column is-4'>
              { this.panel() }
            </div>
            <div className='column'>
              { outputTanks }
            </div>
          </div>
        </div>
      </section>
    );
  }
}
