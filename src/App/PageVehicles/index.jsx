import React from 'react';


import TagsDropdown from '../components/TagsDropdown';


// "Vehicles" page.


export default class PageVehicles extends React.Component {
  //this.props.server
  //this.props.accountID
  constructor(props) {
    super(props);
    this.state = {
      sortingColumn: 'unknown',
      data: null,
      
      filterBy50: false,
      filters: [
        {label: 'Tier 1',        type: 'tier', active: true, id: '1'},
        {label: 'Tier 2',        type: 'tier', active: true, id: '2'},
        {label: 'Tier 3',        type: 'tier', active: true, id: '3'},
        {label: 'Tier 4',        type: 'tier', active: true, id: '4'},
        {label: 'Tier 5',        type: 'tier', active: true, id: '5'},
        {label: 'Tier 6',        type: 'tier', active: true, id: '6'},
        {label: 'Tier 7',        type: 'tier', active: true, id: '7'},
        {label: 'Tier 8',        type: 'tier', active: true, id: '8'},
        {label: 'Tier 9',        type: 'tier', active: true, id: '9'},
        {label: 'Tier 10',       type: 'tier', active: true, id: '10'},
        {label: 'Light Tanks',   type: 'type', active: true, id: 'lightTank'},
        {label: 'Medium Tanks',  type: 'type', active: true, id: 'mediumTank'},
        {label: 'Heavy Tanks',   type: 'type', active: true, id: 'heavyTank'},
        {label: 'AT-SPG',        type: 'type', active: true, id: 'AT-SPG'},
        {label: 'SPG',           type: 'type', active: true, id: 'SPG'}
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
    this.fetchData = this.fetchData.bind(this);
    this.switchFilter = this.switchFilter.bind(this);
    this.switchFilters = this.switchFilters.bind(this);
    this.makeSortedArray = this.makeSortedArray.bind(this);
    this.getHeaderName = this.getHeaderName.bind(this);
    this.formatCell = this.formatCell.bind(this);
  }

  
  componentDidMount() {
    if (!this.state.data) { this.fetchData() }
    
    // Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', 'Vehicles');
      ga('send', 'pageview');
    }
  }
  
  
  fetchData() {
    // Empty the data.
    this.setState({data: null});

    // Assembling the url.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;
    const TYPE = 'vehicles';
    const TIMESTAMP = '0';
    const FILTERS = '&';
    const URL = '/api/' + TYPE + '/' + SERVER + '/' + ACCOUNT_ID + '/' + TIMESTAMP + '/' + FILTERS + '/';
    // Fetching.
    fetch(URL)
      .then(response => { return response.json() })
      .then(j => {
        if (j.status != 'ok') {
          window.alert('Server returned an error: ' + j.message);
        } else {
          this.setState({data: j.data});
        }
      })
      .catch(error => {
        alert('There has been a problem with the request. Error message: ' + error.message);
      });
  }

  
  makeSortedArray() {
    
    const SORTING_COLUMN = this.state.sortingColumn;

    
    // Getting active selectors.
    const ACTIVE_SELECTORS = this.state.selectors.filter((x) => x.active).map((x) => x.id);
    const HEADER_IDS = ['name'].concat(ACTIVE_SELECTORS);


    // Filters.
    const ALLOWED_TIERS = this.state.filters
      .filter((x) => x.active && (x.type == 'tier'))
      .map((x) => parseInt(x.id));
    const ALLOWED_CLASSES = this.state.filters
      .filter((x) => x.active && (x.type == 'type'))
      .map((x) => x.id);
    const FILTER_BY_50 = this.state.filterBy50;

    
    // Creating filtered array with tank names appended as first cell.
    let unsortedArray = [];
    for (let tank of this.state.data) {

      // Conditions.
      const A = ALLOWED_TIERS.includes(tank.tier);
      const B = ALLOWED_CLASSES.includes(tank.type);
      const C = FILTER_BY_50 ? tank.battles >= 50 : true;
      if (!A || !B || !C) { continue }

      let row = [tank.short_name];
      ACTIVE_SELECTORS.forEach((cellName) => {
        row.push(tank[cellName]);
      });

      unsortedArray.push(row);
    }


    // Looking for column to sort based on header id.
    let sortIndex = 0;
    for(let h = 0; h < HEADER_IDS.length; h++) {
      if (HEADER_IDS[h] == SORTING_COLUMN) {
        sortIndex = h;
        break;
      }
    }


    // Sorting.
    let sortedArray = unsortedArray.sort(function(a,b) {
      return b[sortIndex] - a[sortIndex];
    });

    
    return([HEADER_IDS].concat(sortedArray));
  }

  
  getHeaderName(sHeaderID) {

    const HEADERS_DICT = {
      'name': 'Tank',

      'wr': 'WinRate',
      'battles': 'Battles',
      'wn8': 'WN8',

      'avg_dmg': 'Avg DMG',
      'avg_frags': 'Avg Frags',
      'avg_exp': 'Avg EXP',

      'avg_dpm': 'Avg DPM',
      'avg_fpm': 'Avg FPM',
      'avg_epm': 'Avg EPM',

      'dmg_perc': 'DMG Perc',
      'wr_perc': 'WR Perc',
      'exp_perc': 'EXP Perc',

      'pen_hits_ratio': 'Penned',
      'bounced_hits_ratio': 'Bounced',
      'survived': 'Survived',

      'total_time_m': 'Total Lifetime',
      'avg_lifetime_s': 'Avg Lifetime',
      'last_time': 'Last Battle'
    };

    return(HEADERS_DICT[sHeaderID]);
  }

  
  formatCell(fValue, sHeaderID) {

    const MONTHS_DICT = {
      '1': 'Jan',
      '2': 'Feb',
      '3': 'Mar',
      '4': 'Apr',

      '5': 'May',
      '6': 'Jun',
      '7': 'Jul',

      '8': 'Aug',
      '9': 'Sep',
      '10': 'Oct',

      '11': 'Nov',
      '12': 'Dec'
    };

    const minutes = parseInt(fValue / 60);
    const seconds = parseInt(fValue - minutes * 60);
    const time = new Date(fValue * 1000);    
    
    switch (sHeaderID) {
    // Percent with two decimals.
    case 'wr':
      return Math.round(fValue * 100) / 100 + ' %';
    case 'pen_hits_ratio':
    case 'bounced_hits_ratio':
    case 'survived':
      return Math.round(fValue * 1000) / 10 + ' %';
      // Integer.
    case 'wn8':
    case 'battles':
    case 'avg_dmg':
    case 'avg_exp':
    case 'avg_dpm':
    case 'avg_epm':
    case 'dmg_perc':
    case 'wr_perc':
    case 'exp_perc':
      return(Math.round(fValue));
    // Float with two decimals.
    case 'avg_frags':
    case 'avg_fpm':
      return(Math.round(fValue * 100) / 100);
    // Minutes.
    case 'total_time_m':
      return(Math.round(fValue) + 'm');
    // Minutes and seconds.
    case 'avg_lifetime_s':
      return minutes + 'm ' + seconds + 's';
    // Last battle time.
    case 'last_time':
      return MONTHS_DICT[String(time.getMonth() + 1)] + ' ' + String(time.getDate());
    default:
      return(fValue);
    }
  }
  
   
  switchFilter(sFilterID) {

    let filters = this.state.filters;

    filters.forEach((item) => {
      if (item.id == sFilterID) item.active = !item.active;
    });

    this.setState({filters: filters});
  }
  
  
  switchFilters(sType, bActive) {

    let filters = this.state.filters;

    filters
      .filter((x) => x.type == sType)
      .forEach((x) => {
        if (bActive) { x.active = true }
        else { x.active = false }
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
  
  
  /* render */
  
  
  loading() {
    return(
      <section className='section is-medium'>
        <div className='columns'>
          <div className='column is-4 is-offset-4'>
            <a className='button is-large is-white is-loading is-fullwidth'></a>
          </div>
        </div>
      </section>
    );
  }
    
   
  genSelectors() {

    const ITEMS = this.state.selectors;

    let list = [];
    for (let x = 0; x < ITEMS.length; x += 3) {
      list.push(
        <div className='column' key={ ITEMS[x].id }>
          <a className={ 'button is-small is-light is-fullwidth' + ((ITEMS[x].active) ? ' is-active' : '') } 
            onClick={ () => this.switchSelector(ITEMS[x].id) }>
            { ITEMS[x].label }
          </a>
          <a className={ 'button is-small is-light is-fullwidth' + ((ITEMS[x+1].active) ? ' is-active' : '') } 
            onClick={ () => this.switchSelector(ITEMS[x+1].id) }>
            { ITEMS[x+1].label }
          </a>
          <a className={ 'button is-small is-light is-fullwidth' + ((ITEMS[x+2].active) ? ' is-active' : '') } 
            onClick={ () => this.switchSelector(ITEMS[x+2].id) }>
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
  
  
  genFilterBy50() {

    return(
      <div className='field'>
        <a className={ 'button is-outlined is-small is-fullwidth' + ((this.state.filterBy50 === true) ? ' is-active' : '') }
          onClick={ () => this.setState({filterBy50: !this.state.filterBy50}) }>
          <span className='icon'>
            <i className='fa fa-filter'></i>
          </span>
          <span>
            Filter by at least 50 battles
          </span>
        </a>
      </div>
    );
  }
  
  
  genTable() {

    const ARR = this.makeSortedArray();

    const HEADERS = ARR.slice(0, 1)[0];
    const ROWS = ARR.slice(1);

    // Header and footer.
    let thead = [];
    let tfoot = [];
    for (let header of HEADERS) {
      thead.push(
        <th key={ header }>
          <a onClick={ () => this.setState({sortingColumn: header}) }>
            { this.getHeaderName(header) }
          </a>
        </th>
      );
      tfoot.push(
        <th key={ header }>
          { this.getHeaderName(header) }
        </th>
      );
    }

    // Table body.
    let tbody = [];
    for (let r = 0; r < ROWS.length; r++) {
      let row = ROWS[r];
      let tempRow = [];

      for (let c = 0; c < row.length; c++) {
        tempRow.push(
          <td key={ c }>
            { this.formatCell(row[c], HEADERS[c]) }
          </td>
        );
      }

      tbody.push(
        <tr key={ r }>
          { tempRow }
        </tr>
      );
    }

    return(
      <div className='container'>
        <table className='table is-bordered is-narrow is-striped is-fullwidth'>
          <thead>
            <tr>
              { thead }
            </tr>
          </thead>

          <tbody>
            { tbody }
          </tbody>

          <tfoot>
            <tr>
              { tfoot }
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  
  render() {

    if (this.state.data === null) { return this.loading() }
    
    return(
      <section style={{marginTop: '24px'}}>
        <div className='container' style={{marginBottom: '24px'}}>
          
          <div className='columns'>
            <div className='column'>
              <TagsDropdown
                tags={ this.state.filters.filter((x) => x.type == 'tier') }
                toggleTag={ this.switchFilter }
                activateAllTags={ () => this.switchFilters('tier', true) }
                deactivateAllTags={ () => this.switchFilters('tier', false) }
                lastButtonMessage={ 'Add more tiers...' }
              />
            </div>
            <div className='column is-6'>
              <TagsDropdown 
                tags={ this.state.filters.filter((x) => x.type == 'type') }
                toggleTag={ this.switchFilter }
                activateAllTags={ () => this.switchFilters('type', true) }
                deactivateAllTags={ () => this.switchFilters('type', false) }
                lastButtonMessage={ 'Add more types...' }
              />
            </div>
          </div>
          
          { this.genSelectors() }
          { this.genFilterBy50() }
          
        </div>
        { this.genTable() }
      </section>
    );
  }
}