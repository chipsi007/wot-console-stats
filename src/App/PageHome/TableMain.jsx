import React from 'react';


import getWn8Color from '../logic/colorsWn8';


// Main table on PageHome.


export default class TableMain extends React.PureComponent {
  //this.props.data
  constructor(props) {
    super(props);
  }
  
  
  calculateCell(sRowID, oData) {
    
    if (oData.battles == 0) { return 0 }
    
    switch(sRowID) {
    // Specialized values.
    case 'battles':
      return oData.battles;
    case 'ratio_wins':
      return oData.wins / oData.battles * 100;
    case 'dmgd_to_dmgr':
      if (oData.damage_received == 0) { return 0 } 
      return oData.damage_dealt / oData.damage_received;
    case 'frags_to_surv':
      if (oData.survived_battles == 0) { return 0 }
      return oData.frags / oData.survived_battles;
      // Averages per battle.
    default:
      return oData[sRowID] / oData.battles;
    }
  }


  calculateRows() {
   
    // Columns are ordered as they should appear on the page.
    const COLUMNS = [
      this.props.data.checkpoint_2w,
      this.props.data.checkpoint_8w,
      this.props.data.checkpoint_0w
    ];
    
    // id == name of the propery in REST object. round == number of decimals to round by.
    let tableItems = [
      {id: 'battles',                label: 'battles',                 round: 0},
      {id: 'ratio_wins',             label: 'winrate %',               round: 2},
      {id: 'damage_dealt',           label: 'damage per battle',       round: 0},
      {id: 'dmgd_to_dmgr',           label: 'damage dealt / received', round: 2},
      {id: 'frags',                  label: 'frags per battle',        round: 2},
      {id: 'spotted',                label: 'spotted per battle',      round: 2},
      {id: 'dropped_capture_points', label: 'defence points',          round: 2},
      {id: 'capture_points',         label: 'capture points',          round: 2},
      {id: 'frags_to_surv',          label: 'kills / deaths ratio',    round: 2},
      {id: 'battle_life_time',       label: 'lifetime seconds avg',    round: 0},
      {id: 'perc_battle_life_time',  label: 'lifetime percentile',     round: 2},
      {id: 'perc_xp',                label: 'xp percentile',           round: 2},
      {id: 'tier',                   label: 'avg tank tier',           round: 2},
      {id: 'wn8',                    label: 'wn8',                     round: 0}
    ];
    
    // Calculate column values.
    for (let c = 0; c < 3; c++ ) {
      const COL_NAME = 'col' + c;
      const DATA = COLUMNS[c];
      tableItems.forEach((row) => {
        row[COL_NAME] = this.calculateCell(row.id, DATA);
      });
    }
    
    // Calculate difference values for first two columns.
    tableItems.forEach((row) => {
      const ROUND_MULTIPLIER = Math.pow(10, row.round);
      row.diff0 = Math.round((row.col0 - row.col2) * ROUND_MULTIPLIER) / ROUND_MULTIPLIER;
      row.diff1 = Math.round((row.col1 - row.col2) * ROUND_MULTIPLIER) / ROUND_MULTIPLIER;
      // Rounding source columns.
      row.col0 = Math.round(row.col0 * ROUND_MULTIPLIER) / ROUND_MULTIPLIER;
      row.col1 = Math.round(row.col1 * ROUND_MULTIPLIER) / ROUND_MULTIPLIER;
      row.col2 = Math.round(row.col2 * ROUND_MULTIPLIER) / ROUND_MULTIPLIER;
    });
    
    return tableItems;
  }
  
  
  /* render */
  
  
  getArrowTag(nDiff) {
    // Arrow up.
    if (nDiff > 0) { return(<span style={{color: '#89b891'}}> &#9650; </span>) }
    // Arrow down.
    return(<span style={{color: '#c28080'}}> &#9660; </span>);
  }
  
  
  getDiffTag(nDiff) {
    const COLOR = (nDiff < 0) ? 'hsl(0, 35%, 50%)' : 'hsl(130, 25%, 50%)';
    const M_SYMBOL = (nDiff < 0) ? '' : '+';
    return (<span style={ {color: COLOR} }> { M_SYMBOL + nDiff }</span>);
  }
  
   
  getWn8Cell(nScore, nDiff) {
    return (
      <td>
        { (nDiff !== null) ? this.getArrowTag(nDiff) : null }
        { nScore }
        { (nScore) ? (<span style={{color: getWn8Color(nScore, 1, 1.4)}}> &#9679;</span>) : null }
      </td>
    );
  }
  

  render() {
    
    const TABLE_ITEMS = this.calculateRows();
    
    const ROWS = TABLE_ITEMS.map((row) => {
      
      let cell0, cell1, cell2;
      if (row.id == 'wn8') {
        cell0 = this.getWn8Cell(row.col0, row.diff0);
        cell1 = this.getWn8Cell(row.col1, row.diff1);
        cell2 = this.getWn8Cell(row.col2, null);
      } else if (row.id == 'battles') {
        cell0 = (<td>{ row.col0 }</td>);
        cell1 = (<td>{ row.col1 }</td>);
        cell2 = (<td>{ row.col2 }</td>);
      } else {
        cell0 = (<td>{ this.getArrowTag(row.diff0) } { row.col0 }</td>);
        cell1 = (<td>{ this.getArrowTag(row.diff1) } { row.col1 }</td>);
        cell2 = (<td>{ row.col2 }</td>);
      }
      
      let diff0, diff1;
      if (row.id == 'battles') {
        diff0 = '+' + Math.round(row.col0 / row.col2 * 10000 || 0) / 100 + ' %';
        diff1 = '+' + Math.round(row.col1 / row.col2 * 10000 || 0) / 100 + ' %';
      } else {
        diff0 = this.getDiffTag(row.diff0);
        diff1 = this.getDiffTag(row.diff1);
      }
      
      return(
        <tr key={ row.id }>
          <td>{ row.label }</td>
          { cell0 }
          <td className='is-hidden-mobile'>{ diff0 }</td>
          { cell1 }
          <td className='is-hidden-mobile'>{ diff1 }</td>
          { cell2 }
        </tr>
      );
    });
    
    return(
      <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th></th>
            <th style={ {borderRight: 'none'} }>2 weeks</th>
            <th style={ {borderLeft: 'none'} } className='is-hidden-mobile'></th>
            <th style={ {borderRight: 'none'} }>8 weeks</th>
            <th style={ {borderLeft: 'none'} } className='is-hidden-mobile'></th>
            <th>All time</th>
          </tr>
        </thead>
        <tbody>
          { ROWS }
        </tbody>
      </table>
    );
  }
}
