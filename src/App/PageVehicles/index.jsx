import React from 'react';


// "Vehicles" page.


export default class PageVehicles extends React.Component {
  //this.state.vehicles
  //this.state.filters
  //this.state.selectors
  //this.state.filterBy50
  //this.fetchData
  constructor(props) {
    super(props);
    this.state = {
      sortingColumn: 'unknown'
    };
    this.makeSortedArray = this.makeSortedArray.bind(this);
    this.getHeaderName = this.getHeaderName.bind(this);
    this.formatCell = this.formatCell.bind(this);
    this.genTable = this.genTable.bind(this);
  }

  componentDidMount() {
    if (this.props.data === null) {
      this.props.fetchData();
    }
  }

  makeSortedArray() {
    // Returns sorted array based on header id, includes header ids as the first row.

    const SORTING_COLUMN = this.state.sortingColumn;

    // Getting active selectors.
    const ACTIVE_SELECTORS = this.props.selectors.filter((x) => x.active).map((x) => x.id);
    const HEADER_IDS = ['name'].concat(ACTIVE_SELECTORS);


    // Filters.
    const ALLOWED_TIERS = this.props.filters
      .filter((x) => x.active && (x.type == 'tiers'))
      .map((x) => parseInt(x.id));
    const ALLOWED_CLASSES = this.props.filters
      .filter((x) => x.active && (x.type == 'class'))
      .map((x) => x.id);
    const FILTER_BY_50 = this.props.filterBy50;

    // Creating filtered array with tank names appended as first cell.
    let unsortedArray = [];
    for (let tank of this.props.data) {

      // Conditions.
      const A = ALLOWED_TIERS.includes(tank.tier);
      const B = ALLOWED_CLASSES.includes(tank.type);
      const C = FILTER_BY_50 ? tank.battles >= 50 : true;
      if (!A || !B || !C) { continue };

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

  genTable() {

    const ARR = this.makeSortedArray();

    const HEADERS = ARR.slice(0, 1)[0];
    const ROWS = ARR.slice(1);

    // Header and footer.
    let thead = [];
    let tfoot = [];
    for (let header of HEADERS) {
      thead.push( <th key={ 'header' + header  }>
        <a onClick={ () => this.setState({sortingColumn: header}) }>
          { this.getHeaderName(header) }
        </a>
      </th>);
      tfoot.push( <th key={ 'footer' + header  }>
        { this.getHeaderName( header ) }
      </th>);
    }

    // Table body.
    let tbody = [];
    for (let r = 0; r < ROWS.length; r++) {
      let row = ROWS[r];
      let tempRow = [];

      for (let c = 0; c < row.length; c++) {
        tempRow.push( <td key={ c }>
          { this.formatCell(row[c], HEADERS[c]) }
        </td>);
      }

      tbody.push( <tr key={ r }>
        { tempRow }
      </tr>);
    }

    return( <div className='container'>
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
    </div>);
  }

  render() {

    if (this.props.data === null) return(null);

    return(this.genTable());
  }
}