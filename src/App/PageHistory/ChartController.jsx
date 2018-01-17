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
  
  
  genSelectors() {

    const ITEMS = [
      {id: 'popularity_index',      label: 'Popularity index (0-100)'},
      {id: 'battle_life_time',      label: 'Battle life time'},
      {id: 'capture_points',        label: 'Capture points'},
      {id: 'damage_assisted_radio', label: 'Damage assisted radio'},

      {id: 'damage_dealt',          label: 'Damage dealt'},
      {id: 'damage_received',       label: 'Damage received'},
      {id: 'direct_hits_received',  label: 'Direct hits received'},
      {id: 'frags',                 label: 'Frags'},

      {id: 'hits',                  label: 'Hits'},
      {id: 'piercings',             label: 'Piercings'},
      {id: 'piercings_received',    label: 'Piercings received'},
      {id: 'shots',                 label: 'Shots'},

      {id: 'spotted',               label: 'Spotted'},
      {id: 'survived_battles',      label: 'Survived ratio'},
      {id: 'wins',                  label: 'Winrate'},
      {id: 'xp',                    label: 'Experience'}
    ];

    const makeColumnItem = x => {
      return(
        <span className={'button is-small is-light is-fullwidth' + ((this.state.tabID == x.id) ? ' is-active': '') }
          onClick={ () => this.setState({tabID: x.id}) }
          key={ x.id }>
          { x.label }
        </span>
      );
    }

    const makeColumn = arr => {
      return(
        <div className='column'>
          { arr.map(makeColumnItem) }
        </div>
      );
    }

    return(
      <div className='columns is-gapless is-mobile is-multiline'>
        { makeColumn(ITEMS.slice(0, 4)) }
        { makeColumn(ITEMS.slice(4, 8)) }
        { makeColumn(ITEMS.slice(8, 12)) }
        { makeColumn(ITEMS.slice(12, 16)) }
      </div>
    );
  }
  

  render() {

    // * 1000 needed to convert unix epoch timestamp into JS format.
    const processRow = x => ({x: x.created_at * 1000, y: x[this.state.tabID]});
    const processItem = x => ({label: x.name, rows: x.rows.map(processRow)});

    return(
      <div>
        { this.genSelectors() }
        <ChartLine data={ this.props.data.map(processItem) } />
      </div>
    );
  }
}
