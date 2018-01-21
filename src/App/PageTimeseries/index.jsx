import React from 'react';


import TimeseriesBox from './TimeseriesBox';
import TagsMultiline from '../components/TagsMultiline';
import InputDropdown from '../components/InputDropdown';


export default class PageTimeseries extends React.Component {
  //this.props.server
  //this.props.accountID
  constructor(props) {
    super(props);
    this.state = {
      isShowingHelp: true,    // Render help message.
      warningMessage: null,   // Warning message above formula.
      selectedTankID: null,   // selected tank_id when filtering by single tank.s
      timeScale: 'daily',     // timescale selector for chart, 'daily' or 'weekly'
      formulaExpanded: false, // Editors expanded state. 
      playerTanks: null,      // Tankopedia List[Obj] only including player tanks.
      timeseriesBoxes: [],    // Container for timeseriesBoxes to be rendered.
      filters: [
        {label: 'Tier 1',       shortLabel: 'T1',  type: 'tier', active: true, id: '1'},
        {label: 'Tier 2',       shortLabel: 'T2',  type: 'tier', active: true, id: '2'},
        {label: 'Tier 3',       shortLabel: 'T3',  type: 'tier', active: true, id: '3'},
        {label: 'Tier 4',       shortLabel: 'T4',  type: 'tier', active: true, id: '4'},
        {label: 'Tier 5',       shortLabel: 'T5',  type: 'tier', active: true, id: '5'},
        {label: 'Tier 6',       shortLabel: 'T6',  type: 'tier', active: true, id: '6'},
        {label: 'Tier 7',       shortLabel: 'T7',  type: 'tier', active: true, id: '7'},
        {label: 'Tier 8',       shortLabel: 'T8',  type: 'tier', active: true, id: '8'},
        {label: 'Tier 9',       shortLabel: 'T9',  type: 'tier', active: true, id: '9'},
        {label: 'Tier 10',      shortLabel: 'T10', type: 'tier', active: true, id: '10'},
        {label: 'Light Tanks',  shortLabel: 'LT',  type: 'type', active: true, id: 'lightTank'},
        {label: 'Medium Tanks', shortLabel: 'MT',  type: 'type', active: true, id: 'mediumTank'},
        {label: 'Heavy Tanks',  shortLabel: 'HT',  type: 'type', active: true, id: 'heavyTank'},
        {label: 'AT-SPG',       shortLabel: 'AT',  type: 'type', active: true, id: 'AT-SPG'},
        {label: 'SPG',          shortLabel: 'SPG', type: 'type', active: true, id: 'SPG'}
      ],
      formula: [
        {label: 'wins',    id: 'wins',    type: 'raw'},
        {label: '÷',       id: 'divide',  type: 'op'},
        {label: 'battles', id: 'battles', type: 'raw'}
      ]
    };
    this.removeLastFormulaItem = this.removeLastFormulaItem.bind(this);
    this.clearFormula = this.clearFormula.bind(this);

    this.addTimeseriesBox = this.addTimeseriesBox.bind(this);
  }
  
  
  componentDidMount() {
    if (!this.state.playerTanks) { this.fetchTanks() }
    
    // Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', 'Time Series');
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


  /* InputDropdown */


  getInputDropdownItems() {
    if (!this.state.playerTanks) { return [] }
    
    // ACTIVE_TIERS and ACTIVE_TYPES are arrays of strings.
    const ACTIVE_TIERS = this.state.filters.filter((x) => (x.type === 'tier') && (x.active)).map((x) => x.id);
    const ACTIVE_TYPES = this.state.filters.filter((x) => (x.type === 'type') && (x.active)).map((x) => x.id);
    
    const includesTierType = x => (ACTIVE_TIERS.includes(String(x.tier)) && ACTIVE_TYPES.includes(x.type));
    const mapperFunc = x => ({ id: x.tank_id, label: x.name });

    return this.state.playerTanks.filter(includesTierType).map(mapperFunc);
  }
  
  
  /* formula */
  
  
  addFormulaItem(item) {
    let formula = this.state.formula;
    
    // Validation.
    if (item.type == 'op') {
      if (formula.length === 0) {
        this.setState({warningMessage: 'Formula can\'t start with an operation.'});
        return;
      }
      if (formula[formula.length - 1].type == 'op') {
        this.setState({warningMessage: 'Operation has to be followed by a value.'});
        return;
      }
      if (formula.length >= 10) {
        this.setState({warningMessage: 'Formula is too large.'});
        return;
      }
    } else if (formula.length > 0) {
      if (['num', 'raw', 'wn8', 'perc'].includes(formula[formula.length - 1].type)) {
        this.setState({warningMessage: 'Value has to be followed by an operation.'});
        return;
      }
    }
    
    formula.push(item);
    this.setState({formula: formula});
  }
  
  
  removeLastFormulaItem() {
    this.setState({formula: this.state.formula.slice(0, -1)});
  }


  clearFormula() {
    this.setState({formula: []});
  }
    
  
  /* timeseriesBoxes */
  
  
  addTimeseriesBox() {
    
    // Validation. Empty formula.
    if (this.state.formula.length === 0) {
      this.setState({warningMessage: 'Formula doesn\'t contain any values.'});
      return;
    }

    // Validation. Cant't be finished with an operation.
    if ((this.state.formula.length > 0) && (this.state.formula[this.state.formula.length - 1].type == 'op')) {
      this.setState({warningMessage: 'Formula can\'t be finished with an operation.'});
      return;
    }
    
    // Reset message.
    this.setState({warningMessage: null});
    
    // Adding chartbox.
    const KEYS = this.state.timeseriesBoxes.map(x => x.key);
    const ACTIVE_FILTERS = this.state.filters.filter(x => x.active);
    
    const NEW_ITEM = {
      timeScale: this.state.timeScale,
      formula: this.state.formula,
      tankID: this.state.selectedTankID,
      tankInfo: this.state.playerTanks.filter(x => x.tank_id == this.state.selectedTankID)[0],
      tiers: ACTIVE_FILTERS.filter(x => x.type === 'tier').map(x => x.id),
      types: ACTIVE_FILTERS.filter(x => x.type === 'type').map(x => x.id),
      key: (KEYS.length > 0) ? Math.max(...KEYS) + 1 : 1
    };

    this.setState({timeseriesBoxes: this.state.timeseriesBoxes.concat(NEW_ITEM)});
  }
  
  
  delTimeseriesBox(key) {
    const notKey = x => x.key !== key;
    this.setState({timeseriesBoxes: this.state.timeseriesBoxes.filter(notKey)});
  }

  
  /* filters */
  
  
  switchFilter(filterID) {
    let filters = this.state.filters;
    for (let item of filters) {
      if (item.id === filterID) { 
        item.active = !item.active; 
        break;
      }
    }
    this.setState({filters: filters});
  }


  activateFilters(filterType) {
    let filters = this.state.filters;
    filters.forEach(x => {
      if (x.type === filterType) {
        x.active = true;
      }
    });
    this.setState({filters: filters});
  }


  deactivateFilters(filterType) {
    let filters = this.state.filters;
    filters.forEach(x => {
      if (x.type === filterType) {
        x.active = false;
      }
    });
    this.setState({filters: filters});
  }

  
  /* render */


  renderHelpMessage() {
    return(
      <div className='notification has-text-centered'>
        <button className='delete' onClick={ () => this.setState({isShowingHelp: false}) }></button>
        This section allows to calculate various account or tank metrics and view it on a time series chart.
        1.Select filtered combination or a single tank. 
        2.Change the formula to calculate the necessary metric. 
        3.Pick time scale: 'daily' or 'weekly'.
        4.Click 'Add chart'.
      </div>
    );
  }


  renderWarningMessage() {
    const close = () => this.setState({warningMessage: null});
    return(
      <div className='notification is-warning' onClick={ close }>
        <button className='delete' onClick={ close }></button>
        { this.state.warningMessage }
      </div>
    );
  }


  renderFormula() {
    
    const FORMULA = this.state.formula;
    
    const DELETE_BUTTON = (<button className='delete' onClick={ this.removeLastFormulaItem }></button>);

    let formulaItems = FORMULA.map((x, index) => {
      // Items don't change order, so index keys are acceptable.
      return( 
        <span className={ 'tag is-medium' + ((x.type === 'op') ? ' is-warning' : ' is-primary') } 
          key={ index }>
          { x.label }
          { (index === FORMULA.length - 1) ? DELETE_BUTTON : null }
        </span>
      );
    });
    
    // Empty formula.
    if (FORMULA.length === 0) {
      formulaItems = (<span className='tag is-medium is-light'>Select items in 'Edit formula' section</span>);
    }
    
    
    // Elements.
    const strongDaily = (<strong>Daily</strong>);
    const strongWeekly = (<strong>Weekly</strong>);
    const linkDaily = (<a onClick={ () => this.setState({timeScale: 'daily'}) }>Daily</a>);
    const linkWeekly = (<a onClick={ () => this.setState({timeScale: 'weekly'}) }>Weekly</a>);
    
    
    return( 
      <nav className='level'>
        <div className='level-left'>
          <div className='level-item'>
            <span className='icon'>
              <a className='fa fa-angle-double-right'
                onClick={ this.clearFormula }>
              </a>
            </span>
          </div>
          <div className='level-item'>
            <div className='tags'>
              { formulaItems }
            </div>
          </div>
        </div>
        <div className='level-right'>
          <p className='level-item'>
            { (this.state.timeScale === 'daily') ? strongDaily : linkDaily }
          </p>
          <p className='level-item'>
            { (this.state.timeScale === 'weekly') ? strongWeekly : linkWeekly }
          </p>
          <p className='level-item'>
            <a className='button is-success' onClick={ this.addTimeseriesBox }>
              Add chart
            </a>
          </p>
        </div>
      </nav>
    );
  }
  

  editorFormula() {
    
    const RAW_ITEMS = [
      {label: 'last_battle_time(sec)',        id: 'last_battle_time',                type: 'raw'},
      {label: 'battle_life_time(sec)',        id: 'battle_life_time',                type: 'raw'},
      {label: 'battles',                      id: 'battles',                         type: 'raw'},
      {label: 'capture_points',               id: 'capture_points',                  type: 'raw'},
      {label: 'damage_assisted_radio',        id: 'damage_assisted_radio',           type: 'raw'},
      {label: 'damage_assisted_track',        id: 'damage_assisted_track',           type: 'raw'},
      {label: 'damage_dealt',                 id: 'damage_dealt',                    type: 'raw'},
      {label: 'damage_received',              id: 'damage_received',                 type: 'raw'},
      {label: 'direct_hits_received',         id: 'direct_hits_received',            type: 'raw'},
      {label: 'dropped_capture_points',       id: 'dropped_capture_points',          type: 'raw'},
      {label: 'explosion_hits',               id: 'explosion_hits',                  type: 'raw'},
      {label: 'explosion_hits_received',      id: 'explosion_hits_received',         type: 'raw'},
      {label: 'frags',                        id: 'frags',                           type: 'raw'},
      {label: 'hits',                         id: 'hits',                            type: 'raw'},
      {label: 'losses',                       id: 'losses',                          type: 'raw'},
      {label: 'mark_of_mastery',              id: 'mark_of_mastery',                 type: 'raw'},
      {label: 'max_frags',                    id: 'max_frags',                       type: 'raw'},
      {label: 'max_xp',                       id: 'max_xp',                          type: 'raw'},
      {label: 'no_dmg_direct_hits_received',  id: 'no_damage_direct_hits_received',  type: 'raw'},
      {label: 'piercings',                    id: 'piercings',                       type: 'raw'},
      {label: 'piercings_received',           id: 'piercings_received',              type: 'raw'},
      {label: 'shots',                        id: 'shots',                           type: 'raw'},
      {label: 'spotted',                      id: 'spotted',                         type: 'raw'},
      {label: 'survived_battles',             id: 'survived_battles',                type: 'raw'},
      {label: 'trees_cut',                    id: 'trees_cut',                       type: 'raw'},
      {label: 'wins',                         id: 'wins',                            type: 'raw'},
      {label: 'xp',                           id: 'xp',                              type: 'raw'}
    ];
    const OP_ITEMS = [
      {label: '+', id: 'plus',   type: 'op'},
      {label: '-', id: 'minus',  type: 'op'},
      {label: '×', id: 'times',  type: 'op'},
      {label: '÷', id: 'divide', type: 'op'}
    ];
    const NUM_ITEMS = [
      {label: '100', id: 'hundred',    type: 'num'},
      {label: '60',  id: 'sixty',      type: 'num'},
      {label: '24',  id: 'twentyfour', type: 'num'}
    ];  
    const CALC_ITEMS = [
      {label: 'WN8',                              id: 'wn8',                            type: 'wn8'},
      {label: 'PERC:battle_life_time',            id: 'battle_life_time',               type: 'perc'},
      {label: 'PERC:damage_dealt',                id: 'damage_dealt',                   type: 'perc'},
      {label: 'PERC:damage_received',             id: 'damage_received',                type: 'perc'},
      {label: 'PERC:xp',                          id: 'xp',                             type: 'perc'},
      {label: 'PERC:wins',                        id: 'wins',                           type: 'perc'},
      {label: 'PERC:survived_battles',            id: 'survived_battles',               type: 'perc'},
      {label: 'PERC:losses',                      id: 'losses',                         type: 'perc'},
      {label: 'PERC:max_frags',                   id: 'max_frags',                      type: 'perc'},
      {label: 'PERC:max_xp',                      id: 'max_xp',                         type: 'perc'},
      {label: 'PERC:mark_of_mastery',             id: 'mark_of_mastery',                type: 'perc'},
      {label: 'PERC:capture_points',              id: 'capture_points',                 type: 'perc'},
      {label: 'PERC:damage_assisted_radio',       id: 'damage_assisted_radio',          type: 'perc'},
      {label: 'PERC:damage_assisted_track',       id: 'damage_assisted_track',          type: 'perc'},
      {label: 'PERC:direct_hits_received',        id: 'direct_hits_received',           type: 'perc'},
      {label: 'PERC:no_dmg_direct_hits_received', id: 'no_damage_direct_hits_received', type: 'perc'},
      {label: 'PERC:dropped_capture_points',      id: 'dropped_capture_points',         type: 'perc'},
      {label: 'PERC:explosion_hits',              id: 'explosion_hits',                 type: 'perc'},
      {label: 'PERC:explosion_hits_received',     id: 'explosion_hits_received',        type: 'perc'},
      {label: 'PERC:frags',                       id: 'frags',                          type: 'perc'},
      {label: 'PERC:hits',                        id: 'hits',                           type: 'perc'},
      {label: 'PERC:trees_cut',                   id: 'trees_cut',                      type: 'perc'},
      {label: 'PERC:piercings',                   id: 'piercings',                      type: 'perc'},
      {label: 'PERC:piercings_received',          id: 'piercings_received',             type: 'perc'},
      {label: 'PERC:shots',                       id: 'shots',                          type: 'perc'},
      {label: 'PERC:spotted',                     id: 'spotted',                        type: 'perc'},
      {label: 'PERC:accuracy',                    id: 'accuracy',                       type: 'perc'}
    ];
    

    // Items never change order, so index keys are acceptable.
    const renderOpItem = (x, index) => {
      return( 
        <p className='control' key={ x.type + index }>
          <a className='button is-small is-warning'
            onClick={ () => this.addFormulaItem(x) }>
            { x.label }
          </a>
        </p>
      );
    };
    const renderNumItem = (x, index) => {
      return( 
        <p className='control' key={ x.type + index }>
          <a className='button is-small is-light'
            onClick={ () => this.addFormulaItem(x) }>
            { x.label }
          </a>
        </p>
      );
    };
    const renderRawItem = (x, index) => {
      return( 
        <p className='control' key={ index }>
          <a className='button is-small is-info'
            onClick={ () => this.addFormulaItem(x) }>
            { x.label }
          </a>
        </p>
      );
    };
    const renderCalcItem = (x, index) => {
      return(
        <p className='control' key={ index }>
          <a className='button is-small is-danger'
            onClick={ () => this.addFormulaItem(x) }>
            { x.label }
          </a>
        </p>
      );
    }

    
    const CONTENT = (
      <div className='card-content'>
        <div className='content'>
          <small>Operations and basic numbers:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { OP_ITEMS.map(renderOpItem) }
            { NUM_ITEMS.map(renderNumItem) }
          </div>
        </div>
        <div className='content'>
          <small>Raw data properties:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { RAW_ITEMS.map(renderRawItem) }
          </div>
        </div>
        <div className='content'>
          <small>WN8 and percentiles:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { CALC_ITEMS.map(renderCalcItem) }
          </div>
        </div>
      </div>
    );
    
    return( 
      <div className='card is-unselectable'>
        <header className='card-header'>
          <a className='card-header-title'
            onClick={ () => this.setState({formulaExpanded: !this.state.formulaExpanded}) }>
            <span className='icon'>
              <i className={ (this.state.formulaExpanded) ? 'fa fa-angle-down' : 'fa fa-angle-right' }></i>
            </span>
            Edit formula
          </a>
          <a className='card-header-icon' 
            onClick={ () => this.setState({formulaExpanded: !this.state.formulaExpanded}) }>
            { (this.state.formulaExpanded) ? 'Hide' : 'Show' }
          </a>
        </header>
        { (this.state.formulaExpanded) ? CONTENT : null }
      </div>
    );
  }


  renderTimeseriesBox(x) {
    return( 
      <TimeseriesBox
        server={ this.props.server }
        accountID={ this.props.accountID }
        timeScale={ x.timeScale } 
        formula={ x.formula }
        tankID={ x.tankID }
        tankInfo={ x.tankInfo }
        tiers={ x.tiers }
        types={ x.types }
        remove={ () => this.delTimeseriesBox(x.key) }
        key={ x.key }
      />
    );
  }
  

  render() {
    return(
      <section style={{marginTop: '24px'}}>
        <div className='container'>

          { (this.state.isShowingHelp) ? this.renderHelpMessage() : null }

          <div className='columns'>
            <div className='column'>     
              <TagsMultiline 
                tags={ this.state.filters.filter(x => x.type === 'tier') }
                toggleTag={ this.switchFilter }
                activateAllTags={ () => this.activateFilters('tier') }
                deactivateAllTags={ () => this.deactivateFilters('tier') }
              />
            </div>
            <div className='column is-6'>
              <TagsMultiline 
                tags={ this.state.filters.filter(x => x.type === 'type') }
                toggleTag={ this.switchFilter }
                activateAllTags={ () => this.activateFilters('type') }
                deactivateAllTags={ () => this.deactivateFilters('type') }
              />
            </div>
          </div>

          <InputDropdown 
            items={ this.getInputDropdownItems() }
            activeID={ this.state.selectedTankID }
            activateID={ (x) => this.setState({selectedTankID: x}) }
            deactivate={ () => this.setState({selectedTankID: null}) }
          />

          { (this.state.warningMessage) ? this.renderWarningMessage() : null }

          { this.renderFormula() }

          { this.editorFormula() }

        </div>

        <div className='container' style={{marginTop: 25 + 'px'}}>
          { this.state.timeseriesBoxes.map(this.renderTimeseriesBox, this) }
        </div>

      </section>
    );
  }
}