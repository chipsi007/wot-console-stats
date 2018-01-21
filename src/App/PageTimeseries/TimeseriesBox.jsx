import React from 'react';


import TimeseriesLineChart from './ChartLine';
import getSequences from '../logic/getSequences';


export default class TimeseriesBox extends React.PureComponent {
  //this.props.server:str        - server of the player: 'xbox' or 'ps4'.
  //this.props.accountID:int     - accountID of the player.
  //this.props.timeScale:str     - 'daily' or 'weekly'
  //this.props.formula:List[Obj] - formula objects.
  //this.props.tankID:int/None   - Integer if single tank, otherwise None.
  //this.props.tankItem:Obj/None - Tankopedia object if tankID is present, ignore otherwise.
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
    this.fetchData();
  }
  

  /* render */
  
  
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
          <button className='delete' onClick={ this.props.remove }></button>
        </div>
      </article>
    );
  }


  renderSetButtons() {

    const makeStaticButton = x => {
      return(
        <span className='button is-small is-static' key={ x }>
          { x }
        </span>
      );
    };

    const makeTierButton = x => {
      // If sequence of one number e.g. [4, 4]
      if (x[0] == x[1]) { return makeStaticButton(`T${x[0]}`); }
      // If sequence of > 1 number e.g. [6, 7]
      return makeStaticButton(`T${x[0]}-T${x[1]}`);
    };

    const makeType = x => (x.includes('Tank')) ? x[0].toUpperCase() + 'T' : x;

    const TIER_ITEMS = getSequences(this.props.tiers.map(x => parseInt(x))).map(makeTierButton);
    const TYPE_ITEMS = this.props.types.map(makeType).map(makeStaticButton);

    return(
      <div className='buttons'>
        { makeStaticButton('Filters') }
        { TIER_ITEMS }
        { TYPE_ITEMS }
        <span className='button is-small' 
          onClick={ () => this.setState({showFormula: !this.state.showFormula}) }>
          { ((this.state.showFormula) ? 'Hide' : 'View') + ' formula' }
        </span>
      </div>
    );
  }


  renderTankButtons() {

    const makeStaticButton = x => {
      return(
        <span className='button is-small is-static' key={ x }>
          { x }
        </span>
      );
    };

    const makeType = x => (x.includes('Tank')) ? x[0].toUpperCase() + 'T' : x;

    return(
      <div className='buttons'>
        { makeStaticButton(this.props.tankItem.name) }
        { makeStaticButton('T' + this.props.tankItem.tier) }
        { makeStaticButton(makeType(this.props.tankItem.type)) }
        { makeStaticButton(this.props.tankItem.nation.toUpperCase()) }
        <span className='button is-small' 
          onClick={ () => this.setState({showFormula: !this.state.showFormula}) }>
          { ((this.state.showFormula) ? 'Hide' : 'View') + ' formula' }
        </span>
      </div>
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
      <div className='tags'>
        { this.props.formula.map(makeFormulaItem) }
      </div>
    );
  }

  
  render() {
    if (this.state.isLoading) { return this.renderLoading(); }
    return( 
      <article className='media'>
        <div className='media-content'>

          { (this.props.tankID) ? this.renderTankButtons() : this.renderSetButtons() }

          { (this.state.showFormula) ? this.renderFormula() : null }  

          <TimeseriesLineChart 
            timestamps={ this.state.timestamps } 
            totals={ this.state.totals }
            change={ this.state.change } 
          />

        </div>
        <div className='media-right'>
          <button className='delete' onClick={ this.props.remove }></button>
        </div>
      </article>
    );
  }
}
