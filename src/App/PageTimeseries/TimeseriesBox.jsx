import React from 'react';


import TimeseriesLineChart from './ChartLine';
import getSequences from '../logic/getSequences';


export default class TimeseriesBox extends React.Component {
  //this.props.server
  //this.props.accountID
  //this.props.timeScale
  //this.props.formula
  //this.props.dataTab
  //this.props.filters
  //this.props.dataTankID
  //this.props.tankInfo
  //this.props.remove
  constructor(props) {
    super(props);
    this.state = {
      timestamps: null,
      totals: null,
      change: null,
      
      showFormula: false
    };
    this.fetchData = this.fetchData.bind(this);
  }

  
  fetchData() {
    
    fetch('/newapi/timeseries/get-data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        server:     this.props.server,
        account_id: this.props.accountID,
        time_scale: this.props.timeScale,
        formula:    this.props.formula,
        filter_by:  this.props.dataTab,
        filters:    this.props.filters.filter((x) => x.active).map((x) => x.id),
        tank_id:    this.props.dataTankID
      })
    })
      .then(response => { return response.json() })
      .then(j => {
      
        if (j.status != 'ok') {
          alert(j.message);
          return;
        }
        
        this.setState({
          timestamps: j.timestamps,
          totals:     j.data_totals,
          change:     j.data_change
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
  
  
  dropdownContent() {
    
    if (this.props.dataTab == 'filters') {
      const TIER_NUMBERS = this.props.filters
        .filter(x => x.active && (x.type == 'tier'))
        .map(x => parseInt(x.id));
      
      const TIER_ITEMS = getSequences(TIER_NUMBERS)
        .map(x => {
          // x[0] must be unique for every item.
          if (x[0] == x[1]) {
            return(<div className='tag is-rounded' key={ x[0] }>{ `T${x[0]}` }</div>);
          }
          return(<div className='tag is-rounded' key={ x[0] }>{ `T${x[0]}-T${x[1]}` }</div>);
        });
      
      const TYPES = this.props.filters
        .filter(x => x.active && (x.type == 'type'))
        .map(x => x.id)
        .map(x => (x.includes('Tank')) ? (x[0].toUpperCase() + 'T') : x)
        .map(x => (<div className='tag is-rounded' key={ x }>{x}</div>));
      
      return (
        <div className='dropdown-content'>
          <div className='dropdown-item'>
            <div className='tags'>
              { TIER_ITEMS }
              { TYPES }
            </div>
          </div>
        </div>
      );
    } 
    
    if (this.props.dataTab == 'tank') {
      return (
        <div className='dropdown-content'>
          <div className='dropdown-item'>
            <div className='tags'>
              <div className='tag is-rounded'>
                { 'T' + this.props.tankInfo.tier }
              </div>
              <div className='tag is-rounded'>
                {  (this.props.tankInfo.type.includes('Tank')) ? this.props.tankInfo.type[0].toUpperCase() + 'T' : this.props.tankInfo.type }
              </div>
              <div className='tag is-rounded'>
                { this.props.tankInfo.nation.toUpperCase() }
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
  
  
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
          <button className='delete' onClick={ () => this.props.remove() }></button>
        </div>
      </article>
    );
  }

  
  render() {
    
    // Loading if no tank data.
    if (!this.state.timestamps) { return(this.loading()) }
    
    const FORMULA_ITEMS = this.props.formula.map((x, index) => {
      return( 
        <span className={ 'tag' + ((x.type == 'op') ? ' is-warning' : ' is-primary') } key={ index }>
          { x.label }
        </span>
      );
    });
    
    const FORMULA = (
      <div className='field'>
        <div className='tags'>
          { FORMULA_ITEMS }
        </div>
      </div>
    );
     
    return( 
      <article className='media'>
        <div className='media-content'>

          <div className='field is-grouped'>
            <div className='control dropdown is-hoverable'>
              <div className='dropdown-trigger'>
                <button className='button is-info is-small' aria-haspopup='true' aria-controls='dropdown-menu4'>
                  <span>{ (this.props.dataTab == 'filters') ? 'Filters' : this.props.tankInfo.short_name }</span>
                  <span className='icon is-small'>
                    <i className='fa fa-angle-down' aria-hidden='true'></i>
                  </span>
                </button>
              </div>
              <div className='dropdown-menu' role='menu'>
                { this.dropdownContent() }
              </div>
            </div>
            <p className='control'>
              <a className='button is-small' 
                onClick={ () => this.setState({showFormula: !this.state.showFormula}) }>
                { ((this.state.showFormula) ? 'Hide' : 'View') + ' formula' }
              </a>
            </p>
          </div>

          { (this.state.showFormula) ? FORMULA : null }  

          <TimeseriesLineChart 
            timestamps={ this.state.timestamps } 
            totals={ this.state.totals }
            change={ this.state.change } 
          />

        </div>
        <div className='media-right'>
          <button className='delete' onClick={ () => this.props.remove() }></button>
        </div>
      </article>
    );
  }
}
