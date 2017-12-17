import React from 'react';


import ChartBar from './ChartBar';
import getWn8Color from '../logic/colorsWn8';


// Component that holds tabs, chart and tab state.


export default class ChartController extends React.Component {
  //this.props.data
  constructor(props) {
    super(props);
    this.state = {
      tab: 'wn8'
    };
  }
  
  
  shouldComponentUpdate(nextProps, nextState) {
    if ((this.props.data != nextProps.data) || (this.state.tab != nextState.tab)) { 
      return true;
    }
    return false;
  }

 
  /* render */
  
  
  tabs() {
    
    const TABS = [
      {id: 'wn8',         label: 'WN8'},
      {id: 'blt',         label: 'Lifetime'},
      {id: 'xp',          label: 'Experience'},
      {id: 'dmgd_p_dar',  label: 'Dmg + radio assist'}, 
      {id: 'dmgd_d_dmgr', label: 'Dmg dealt / received'}
    ].map((x) => {
      return(
        <li key={ x.id } className={ (this.state.tab == x.id) ? 'is-active' : '' }>
          <a onClick={ () => this.setState({tab: x.id}) }>
            { x.label }
          </a>
        </li>
      );
    });
    
    return(
      <div className="tabs is-centered is-small">
        <ul>
          { TABS }
        </ul>
      </div>
    );
  }
  

  render() {
    
    const TOTALS = this.props.data.map((x) => Math.round(x[this.state.tab] * 100) / 100);
    const CHANGE = this.props.data.map((x) => Math.round(x['change_' + this.state.tab] * 100) / 100);
    const TIMESTAMPS = this.props.data.map((x) => x.timestamp);
    const COLORS = (this.state.tab == 'wn8') ? CHANGE.map((x) => getWn8Color(x, 0.7, 1.4) ) : null;
    
    if (TIMESTAMPS.length === 0) {
      return(
        <div className='is-hidden-mobile notification has-text-centered'>
          This chart will be shown once more datapoints are available. Log in for 2 or more days to see the change of your scores.
        </div>
      );
    }
    
    return(
      <div className='is-hidden-mobile' style={{marginBottom: '25px'}}>
        <ChartBar 
          totals={ TOTALS }
          change={ CHANGE }
          timestamps={ TIMESTAMPS }
          overrideBarColors={ COLORS } />
        { this.tabs() }
      </div>
    );
  }
}
