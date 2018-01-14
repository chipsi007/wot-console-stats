import React from 'react';


import ChartLine from './ChartLine';


// Component that holds tabs, chart and button state.


export default class ChartController extends React.Component {
  //this.props.data
  constructor(props) {
    super(props);
    this.state = {
      tabID: 'wins'
    };
  }
  
  
  shouldComponentUpdate(nextProps, nextState) {
    if ((this.props.data != nextProps.data) || (this.state.tabID != nextState.tabID)) { 
      return true;
    }
    return false;
  }

 
  /* render */
  
  
  buttons() {

    let arr = [
      {id: 'popularity_index'},
      {id: 'battle_life_time'},
      {id: 'capture_points'},
      {id: 'damage_assisted_radio'},
      {id: 'damage_dealt'},
      {id: 'damage_received'},
      {id: 'direct_hits_received'},
      {id: 'frags'},
      {id: 'hits'},
      {id: 'losses'},
      {id: 'piercings'},
      {id: 'piercings_received'},
      {id: 'shots'},
      {id: 'spotted'},
      {id: 'survived_battles'},
      {id: 'wins'},
      {id: 'xp'}
    ];

    const ITEMS = arr.map((x) => {
      return(
        <span className={'button is-small' + ((this.state.tabID == x.id) ? ' is-active': '') }
          onClick={ () => this.setState({tabID: x.id}) }
          key={ x.id }>
          { x.id }
        </span>
      );
    });

    return(
      <div className='buttons'>
        { ITEMS }
      </div>
    );
  }
  

  render() {

    // * 1000 needed to convert unix epoch timestamp into JS format.
    const processRow = x => ({x: x.created_at * 1000, y: x[this.state.tabID]});
    const processItem = x => ({label: x.name, rows: x.rows.map(processRow)});

    return(
      <div>
        { this.buttons() }
        <ChartLine data={ this.props.data.map(processItem) } />
      </div>
    );
  }
}
