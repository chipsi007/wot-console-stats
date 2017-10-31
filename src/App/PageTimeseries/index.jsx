import React from 'react';


import TimeseriesBox from './TimeseriesBox';


export default class PageTimeseries extends React.Component {
  //this.props.server
  //this.props.accountID
  constructor(props) {
    super(props);
    this.state = {
      
      // Data to request.
      timeScale: 'daily', // 'daily' or 'weekly'
      
      // Editors expanded state. 
      formulaExpanded: false,
      dataExpanded: false,
      
      // Editor tab state.
      dataTab: 'filters', // 'filters' or 'tank'
      
      // editorDataFilters state.
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
      
      // editorDataTank state.
      dataTankText: '',
      dataTankType: 'all',
      dataTankTier: 0,
      dataTankID: null,
      dataTankMaxItems: 12,
      
      // Formula container, default formula placed here.
      formula: [
        {label: 'wins',    id: 'wins',    type: 'raw'},
        {label: '÷',       id: 'divide',  type: 'op'},
        {label: 'battles', id: 'battles', type: 'raw'}
      ],
      
      // Messages under formula.
      infoMsg: 'This section allows to calculate various account or tank metrics and view it on a time series chart. Click this message to close.',//null,
      dangerMsg: null,
      
      // Container for player tanks loaded on mount.
      playerTanks: [],
      chartboxes: []
    };
    this.fetchTanks = this.fetchTanks.bind(this);
    this.addChartBox = this.addChartBox.bind(this);
    this.removeLastFormulaItem = this.removeLastFormulaItem.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
  }
  
  
  componentDidMount() {
    if (this.state.playerTanks.length === 0) { this.fetchTanks() }
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
  
  
  addFormulaItem(item) {
    let formula = this.state.formula;
    
    // Validation.
    if (item.type == 'op') {
      if (formula.length === 0) {
        this.setState({dangerMsg: 'Formula can\'t start with an operation'});
        return;
      }
      if (formula[formula.length - 1].type == 'op') {
        this.setState({dangerMsg: 'Operation has to be followed by a value'});
        return;
      }
      if (formula.length >= 10) {
        this.setState({dangerMsg: 'Formula is too large'});
        return;
      }
    } else if (formula.length > 0) {
      if (['num', 'raw', 'wn8', 'perc'].includes(formula[formula.length - 1].type)) {
        this.setState({dangerMsg: 'Value has to be followed by an operation'});
        return;
      }
    }
    
    formula.push(item);
    this.setState({formula: formula});
  }
  
  
  removeFormulaItem(item) {
    const output = this.state.formula.filter((x) => x != item);
    this.setState({formula: output});
  }
  
  
  removeLastFormulaItem() {
    this.setState({formula: this.state.formula.slice(0, -1)});
  }
  
  
  formula() {
    
    const FORMULA = this.state.formula;
    
    const DELETE_BUTTON = (<button className='delete' onClick={ this.removeLastFormulaItem }></button>);

    let formulaItems = FORMULA.map((x, index) => {
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
                onClick={ () => this.setState({formula: []}) }>
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
            <a className='button is-success' onClick={ this.addChartBox }>
              Add chart
            </a>
          </p>
        </div>
      </nav>
    );
  }
  
  
  addChartBox() {
    
    // Validation.
    if (this.state.formula.length === 0) {
      this.setState({dangerMsg: 'Formula doesn\'t contain any values'});
      return;
    }
    if ((this.state.dataTab == 'tank') && (this.state.dataTankID === null)) {
      this.setState({dangerMsg: 'Filter by tank tab is active but no tanks are selected'});
      return;
    }
    if ((this.state.formula.length > 0) && (this.state.formula[this.state.formula.length - 1].type == 'op')) {
      this.setState({dangerMsg: 'Formula can\'t be finished with an operation'});
      return;
    }
    
    // Reset message.
    this.setState({dangerMsg: null});
    
    // Adding chartbox.
    let charts = this.state.chartboxes;
    charts.push({
      timeScale: this.state.timeScale,
      formula: this.state.formula,
      dataTab: this.state.dataTab,
      filters: this.state.filters,
      dataTankID: this.state.dataTankID,
      tankInfo: (this.state.dataTab == 'tank') ? this.state.playerTanks.find(x => x.tank_id == this.state.dataTankID) : null,
      key: (charts.length > 0) ? Math.max(...charts.map((x) => x.key)) + 1 : 1
    });
    this.setState({chartboxes: charts});
  }
  
  
  removeChartBox(key) {
    let output = this.state.chartboxes.filter((x) => x.key != key);
    this.setState({chartboxes: output});
  }

  
  switchFilter(filterID) {
    let filters = this.state.filters;
    for (let item of filters) {
      if (item.id == filterID) { 
        item.active = !item.active; 
        break;
      }
    }
    this.setState({filters: filters});
  }
  
  
  resetFilters() {
    this.refs.text.value = '';
    this.refs.tier.value = '0';
    this.refs.type.value = 'all';
    this.setState({
      dataTankText: '',
      dataTankType: 'all',
      dataTankTier: 0,
      dataTankID: null,
      dataTankMaxItems: 12, // actually 12 - 1 for the extend button.
    });
  }
  

  editorFormula() {
    
    const RAW_FIELDS = [
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
    const OP_FIELDS = [
      {label: '+', id: 'plus',   type: 'op'},
      {label: '-', id: 'minus',  type: 'op'},
      {label: '×', id: 'times',  type: 'op'},
      {label: '÷', id: 'divide', type: 'op'}
    ];
    const NUM_FIELDS = [
      {label: '100', id: 'hundred',    type: 'num'},
      {label: '60',  id: 'sixty',      type: 'num'},
      {label: '24',  id: 'twentyfour', type: 'num'}
    ];  
    const CALC_FIELDS = [
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
    
    const OP_ITEMS = OP_FIELDS.map((x, index) => {
      return( <p className='control' key={ x.type + index }>
        <a className='button is-small is-warning'
          onClick={ () => this.addFormulaItem(x) }
        >
          { x.label }
        </a>
      </p>);
    });
    const NUM_ITEMS = NUM_FIELDS.map((x, index) => {
      return( <p className='control' key={ x.type + index }>
        <a className='button is-small is-light'
          onClick={ () => this.addFormulaItem(x) }
        >
          { x.label }
        </a>
      </p>);
    });
    const RAW_ITEMS = RAW_FIELDS.map((x, index) => {
      return( <p className='control' key={ index }>
        <a className='button is-small is-info'
          onClick={ () => this.addFormulaItem(x) }
        >
          { x.label }
        </a>
      </p>);
    });
    const CALC_ITEMS = CALC_FIELDS.map((x, index) => {
      return( <p className='control' key={ index }>
        <a className='button is-small is-danger'
          onClick={ () => this.addFormulaItem(x) }
        >
          { x.label }
        </a>
      </p>);
    });
   
    const HEADER = (
      <header className='card-header'>
        <a className='card-header-title'
          onClick={ () => this.setState({formulaExpanded: !this.state.formulaExpanded}) }
        >
          <span className='icon'>
            <i className={ (this.state.formulaExpanded) ? 'fa fa-angle-down' : 'fa fa-angle-right' }></i>
          </span>
          Edit formula
        </a>
        <a className='card-header-icon' 
          onClick={ () => this.setState({formulaExpanded: !this.state.formulaExpanded}) }
        >
          { (this.state.formulaExpanded) ? 'Hide' : 'Show' }
        </a>
      </header>
    );
    
    const CONTENT = (
      <div className='card-content'>
        
        <div className='content'>
          <small>Operations and basic numbers:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { OP_ITEMS }
            { NUM_ITEMS }
          </div>
        </div>
        
        <div className='content'>
          <small>Raw data properties:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { RAW_ITEMS }
          </div>
        </div>
        
        <div className='content'>
          <small>WN8 and percentiles:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { CALC_ITEMS }
          </div>
        </div>
        
      </div>
    );
    
    return( <div className='card is-unselectable'>
      { HEADER }
      { (this.state.formulaExpanded) ? CONTENT : null }
    </div>);
  }
  
  
  editorData() {
    
    const HEADER = (
      <header className='card-header'>
        <a className='card-header-title'
          onClick={ () => this.setState({dataExpanded: !this.state.dataExpanded}) }
        >
          <span className='icon'>
            <i className={ (this.state.dataExpanded) ? 'fa fa-angle-down' : 'fa fa-angle-right' }></i>
          </span>
          Choose data
        </a>
        <a className='card-header-icon' 
          onClick={ () => this.setState({dataExpanded: !this.state.dataExpanded}) }
        >
          { (this.state.dataExpanded) ? 'Hide' : 'Show' }
        </a>
      </header>
    );
    
    const TABS = (
      <div className='tabs'>
        <ul>
          <li className={ (this.state.dataTab === 'filters') ? 'is-active' : '' }>
            <a onClick={ () => this.setState({dataTab: 'filters'}) }>Filters</a>
          </li>
          <li className={ (this.state.dataTab === 'tank') ? 'is-active' : '' }>
            <a onClick={ () => this.setState({dataTab: 'tank'}) }>Single vehicle</a>
          </li>
        </ul>
      </div>
    );

    const CONTENT = (
      <div className='card-content'>                        
        <div className='content'>

          { (this.state.dataTab === 'filters') ? this.editorDataFilters() : null }
          { (this.state.dataTab === 'tank') ? this.editorDataTank() : null }

        </div>
      </div>
    );
    
    
    return( <div className='card is-unselectable'>
              
      { HEADER }
        
      { (this.state.dataExpanded) ? TABS : null }
        
      { (this.state.dataExpanded) ? CONTENT : null }
        
    </div>);
  }
  
  
  editorDataFilters() {
    
    const TIERS = this.state.filters.filter((x) => x.type === 'tier').map((x) => {
      return( <a className={ 'tag' + (x.active ? ' is-success' : '') }
        onClick={ () => this.switchFilter(x.id) }
        key={ x.id }
      >
        { x.label }
      </a>);
    });
    
    const TYPES = this.state.filters.filter((x) => x.type === 'type').map((x) => {
      return( <a className={ 'tag' + (x.active ? ' is-success' : '') }
        onClick={ () => this.switchFilter(x.id) }
        key={ x.id }
      >
        { x.label }
      </a>);
    });
    

    
    return( <div className='columns'>
      <div className='column'>
        <div className='tags'>
          { TIERS }
        </div>
        <div className='tags'>
          { TYPES }
        </div>
      </div>
    </div>);
  }
  
  
  editorDataTank() {
    
    const TIER_SELECT_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((x) => {
        return( 
          <option key={ x } value={ x }>
            { (x != 0) ? `Tier ${x}` : 'All tiers' }
          </option>
        );
      });
    
    const TYPE_SELECT_ITEMS = ['all', 'lightTank', 'mediumTank', 'heavyTank', 'AT-SPG', 'SPG']
      .map((x) => {
        return( 
          <option key={ x } value={ x }>
            { (x != 'all') ? x[0].toUpperCase() + x.slice(1).replace('Tank', ' Tank') : 'All types' }
          </option>
        );
      });
    
    const TANKS = this.state.playerTanks
      .filter((x) => {
        const typePass = ((this.state.dataTankType == 'all') || (this.state.dataTankType == x.type)) ? true : false;
        const tierPass = ((this.state.dataTankTier == 0) || (this.state.dataTankTier == x.tier)) ? true : false;
        return typePass && tierPass;
      })
      .filter((x) => x.name.toLowerCase().includes(this.state.dataTankText))
      .map((x) => {
        return( 
          <div className='field' key={ x.tank_id }>
            <p className='control is-expanded'>
              <a className={ 'button is-small is-fullwidth' + ((this.state.dataTankID == x.tank_id) ? ' is-info' : ' is-light') }
                onClick={ () => this.setState({dataTankID: x.tank_id}) }>
                { x.short_name }
              </a>
            </p>
          </div>
        );
      });
    
    // Limit to show as defined in state.
    const TANKS_TO_VIEW = TANKS.slice(0, this.state.dataTankMaxItems);
    
    // Splitting tanks onto 4 columns.
    function splitItems(arr) {
      let col1 = [], col2 = [], col3 = [], col4 = [];
      const floor = Math.floor(arr.length / 4);
      let remainder = arr.length % 4;
      
      if (floor > 0) {
        for (let i = 0; i < floor * 4; i += 4) {
          col1.push(arr[i]);
          col2.push(arr[i + 1]);
          col3.push(arr[i + 2]);
          col4.push(arr[i + 3]);
        }
      }    
      
      if (remainder > 0) {
        const remainderArr = arr.slice(arr.length - remainder, arr.length);
        col1.push(remainderArr[0]);
        col2.push(remainderArr[1]);
        col3.push(remainderArr[2]);
        col4.push(remainderArr[3]);
      }
      
      return [col1, col2, col3, col4];
    }
    
    let [col1, col2, col3, col4] = splitItems(TANKS_TO_VIEW);
    
    // Put extend button to column 4 if more than 12 tanks.
    if (TANKS.length > this.state.dataTankMaxItems) {
      col4[col4.length - 1] = (
        <div className='field' key='extend'>
          <p className='control is-expanded'>
            <a className='button is-small is-fullwidth'
              onClick={ () => this.setState({dataTankMaxItems: this.state.dataTankMaxItems + 12}) }
            >
              { '• • •' }
            </a>
          </p>
        </div>
      );
    }
    
    
    return( 
      <div>
        <nav className='level'>

          <div className='level-left'>

            <div className='level-item'>
              <div className='field'>
                <p className={ 'control has-icons-left' + ((this.state.playerTanks.length === 0) ? ' is-loading' : '') }>
                  <input className='input' type='text' placeholder='Filter by tank name'
                    onChange={ () => this.setState({dataTankText: this.refs.text.value}) }
                    ref='text'
                  />
                  <span className='icon is-left'>
                    <i className='fa fa-search'></i>
                  </span>
                </p>
              </div>
            </div>

            <div className='level-item'>
              <p className='control'>
                <button className='button is-outlined' onClick={ this.resetFilters }>
                  <span className='icon is-small'>
                    <i className='fa fa-times'></i>
                  </span>
                </button>
              </p>
            </div>

            <div className='level-item'>
              <p className='subtitle is-5'>
                <strong>{ TANKS.length }</strong> vehicles
              </p>
            </div>

          </div>

          <div className='level-right'>

            <div className='level-item'>
              <div className='select'>
                <select ref='tier' onChange={ () => this.setState({dataTankTier: this.refs.tier.value}) }>
                  { TIER_SELECT_ITEMS }
                </select>
              </div>
            </div>

            <div className='level-item'>
              <div className='select'>
                <select ref='type' onChange={ () => this.setState({dataTankType: this.refs.type.value}) }>
                  { TYPE_SELECT_ITEMS }
                </select>
              </div>
            </div>

          </div>

        </nav>

        <div className='columns'>
          <div className='column is-3'>
            { col1 }
          </div>

          <div className='column is-3'>
            { col2 }
          </div>

          <div className='column is-3'>
            { col3 }
          </div>

          <div className='column is-3'>
            { col4 }      
          </div>
        </div>
      </div>
    );
  }
  

  render() {
    
    const CHARTBOXES = this.state.chartboxes.map((x) => {
      return( 
        <TimeseriesBox
          server={ this.props.server }
          accountID={ this.props.accountID }
          timeScale={ x.timeScale } 
          formula={ x.formula }
          dataTab={ x.dataTab } 
          filters={ x.filters } 
          dataTankID={ x.dataTankID }
          tankInfo={ x.tankInfo }
          remove={ () => this.removeChartBox(x.key) }
          key={ x.key }
        />
      );
    });
    
    const DANGER_MESSAGE = (
      <article className='message is-danger'>
        <div className='message-body' onClick={ () => this.setState({dangerMsg: null}) }>
          { this.state.dangerMsg }
        </div>
      </article>
    );
    
    const INFO_MESSAGE = (
      <article className='message'>
        <div className='message-body' onClick={ () => this.setState({infoMsg: null}) }>
          { this.state.infoMsg }
        </div>
      </article>
    );
        
    return(
      <section className='section'>
        <div className='container' >
          { this.formula() }
          { (this.state.dangerMsg) ? DANGER_MESSAGE : null }
          { (this.state.infoMsg) ? INFO_MESSAGE : null }   
          { this.editorFormula() }
          { this.editorData() }
        </div>
        <div className='container' style={ {marginTop: 25 + 'px'} }>
          { CHARTBOXES }
        </div>
      </section>
    );
  }
}