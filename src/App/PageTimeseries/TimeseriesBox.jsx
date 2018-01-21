import React from 'react';


import TimeseriesLineChart from './ChartLine';
import getSequences from '../logic/getSequences';


export default class TimeseriesBox extends React.PureComponent {
  //this.props.server:str        - server of the player: 'xbox' or 'ps4'.
  //this.props.accountID:int     - accountID of the player.
  //this.props.timeScale:str     - 'daily' or 'weekly'
  //this.props.formula:List[Obj] - formula objects.
  //this.props.tankID:int/None   - Integer if single tank, otherwise None.
  //this.props.tankInfo:Obj/None - Tankopedia object if tankID is present, otherwise None.
  //this.props.tiers:List[str]   - List of tiers. Ignore if tankID is present.
  //this.props.types:List[str]   - List of types. Ignore if tankID is present.
  //this.props.remove:f()        - Function to remove this TimeseriesBox.
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      timestamps: null, // received data. x-axis.
      totals: null,     // received data. y-axis.
      change: null,     // received data. y-axis.
      
      showFormula: false
    };
    this.fetchData = this.fetchData.bind(this);
  }

  
  fetchData() {

    const FETCH_BODY = {
      method: 'POST',
      headers: {
        'Accept': 'application/json', 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({     
        server:    this.props.server,
        accountID: this.props.accountID,
        timeScale: this.props.timeScale,
        formula:   this.props.formula,
        tankID:    this.props.tankID,
        tiers:     this.props.tiers,
        types:     this.props.types
      })
    };

    fetch('/api/timeseries/get/', FETCH_BODY)
      .then(r => r.json())
      .then(j => {
        if (j.error !== null) {
          window.alert('Server returned an error: ' + j.error);
        } else {
          this.setState({
            isLoading:  false,
            timestamps: j.xTimestamps,
            totals:     j.yTotals,
            change:     j.yChange
          });
        }
      })
      .catch(err => {
        alert('There has been a problem with the request. Error message: ' + err.message);
      });
  }

  
  componentDidMount() {
    if (this.state.isLoading) { this.fetchData(); }
  }
  
  
  dropdownContent() {
    
    if (!this.props.tankID) {
      const TIER_NUMBERS = this.props.tiers.map(x => parseInt(x.id));    
      const TIER_ITEMS = getSequences(TIER_NUMBERS)
        .map(x => {
          // x[0] must be unique for every item.
          if (x[0] == x[1]) {
            return(<div className='tag is-rounded' key={ x[0] }>{ `T${x[0]}` }</div>);
          }
          return(<div className='tag is-rounded' key={ x[0] }>{ `T${x[0]}-T${x[1]}` }</div>);
        });
      
      const TYPES = this.props.tiers.concat(this.props.types)
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
    
    if (this.props.tankID) {
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
  
  
  renderLoading() {
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


  renderFormula() {

    const makeFormulaItem = (x, index) => {
      return( 
        <span className={ 'tag' + ((x.type == 'op') ? ' is-warning' : ' is-primary') } key={ index }>
          { x.label }
        </span>
      );
    }

    return(
      <div className='field'>
        <div className='tags'>
          { this.props.formula.map(makeFormulaItem) }
        </div>
      </div>
    );
  }

  
  render() {
    if (this.state.isLoading) { return this.renderLoading(); }
    return( 
      <article className='media'>
        <div className='media-content'>

          <div className='field is-grouped'>
            <div className='control dropdown is-hoverable'>
              <div className='dropdown-trigger'>
                <button className='button is-info is-small' aria-haspopup='true' aria-controls='dropdown-menu4'>
                  <span>{ (this.props.tankID === null) ? 'Filters' : this.props.tankInfo.short_name }</span>
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

          { (this.state.showFormula) ? this.renderFormula() : null }  

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
