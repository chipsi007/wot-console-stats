import React from 'react';


import ChartRadar from './ChartRadar';
import ChartLineWn8 from './ChartLineWn8';
import ChartLinePerc from './ChartLinePerc';


// "Profile" page.


export default class PageProfile extends React.Component {
  //this.state.profile 
  //this.state.tabs
  //this.fetchData
  constructor(props) {
    super(props);
    this.getArrowTag = this.getArrowTag.bind(this);
    this.getSmallArrowTag = this.getSmallArrowTag.bind(this);
    this.getWn8Color = this.getWn8Color.bind(this);
  }

  
  componentDidMount() {
    if (!this.props.data) this.props.fetchData();
  }


  getArrowTag(recentNumber, alltimeNumber) {
    if (recentNumber > alltimeNumber) {
      //Arrow up.
      return(<p className='title' style={ {color: '#89b891'} }> &#9650; </p>);
    } else if (recentNumber < alltimeNumber) {
      // Arrow down.
      return(<p className='title' style={ {color: '#c28080'} }> &#9660; </p>);
    } else {
      // Arrow straight.
      return(<p className='title' style={ {color: 'BLACK'} }> &#9654; </p>);
    }
  }
  
  
  getSmallArrowTag(recentNumber, alltimeNumber) {
    if (recentNumber > alltimeNumber) {
      //Arrow up.
      return(<p style={ {color: '#89b891'} }> &#9650; </p>);
    } else if (recentNumber < alltimeNumber) {
      // Arrow down.
      return(<p style={ {color: '#c28080'} }> &#9660; </p>);
    } else {
      // Arrow straight.
      return(<p style={ {color: 'BLACK'} }> &#9654; </p>);
    }
  }
  
  
  getWn8Color(wn8Score) {

    let color = 'BLACK';

    const SCALE = [
      [-999,  299,    'DARKRED'],
      [300,   449,    'ORANGERED'],
      [450,   649,    'DARKORANGE'],
      [650,   899,    'GOLD'],
      [900,   1199,   'YELLOWGREEN'],
      [1200,  1599,   'LIME'],
      [1600,  1999,   'DEEPSKYBLUE'],
      [2000,  2449,   'DODGERBLUE'],
      [2450,  2899,   'MEDIUMSLATEBLUE'],
      [2900,  99999,  'REBECCAPURPLE']
    ];

    for (let item of SCALE) {
      if ((wn8Score >= item[0]) && (wn8Score <= item[1])) {
        color = item[2];
        break;
      }
    }

    return(color);
  }

  
  /* render */
  
  
  dashboard() {
    return( <div className='container'>
      { this.level() }
      { this.panels() }
    </div>);
  }
  
  
  inDetail() {

    const DATA = this.props.data;
    const TABLE_DATA = [
      {label: 'Win Rate',                 attr: 'wr',         addon: ' %'},
      {label: 'WN8',                      attr: 'wn8',        addon: ''},
      {label: 'Total Percentile',         attr: 'total_perc', addon: ' %'},
      {label: 'Accuracy',                 attr: 'acc',        addon: ' %'},
      {label: 'Damage Caused',            attr: 'dmgc',       addon: ''},
      {label: 'Radio Assist',             attr: 'rass',       addon: ''},
      {label: 'Damage Received',          attr: 'dmgr',       addon: ''},
      {label: 'Kills / Deaths',           attr: 'k_d',        addon: ''},
      {label: 'Damage Caused / Received', attr: 'dmgc_dmgr',  addon: ''}
    ];

    let tbody = [];

    TABLE_DATA.forEach((item) => {

      const RECENT = DATA.recent[item.attr];
      const ALL_TIME = DATA.all_time[item.attr];

      tbody.push(
        <tr key={ item.attr }>
          <td>{this.getSmallArrowTag(RECENT, ALL_TIME)}</td>
          <td>{item.label}</td>
          <td>{ALL_TIME + item.addon}</td>
          <td>{RECENT + item.addon}</td>
        </tr>
      );
    });

    return( <div className='container'>
      <div className='tile is-ancestor'>
        <div className='tile is-parent is-6'>
          <div className='tile is-child box is-12'>

            <ChartRadar data={ this.props.data } />

          </div>
        </div>
        <div className='tile is-parent is-6'>
          <div className='tile is-child box is-12'>
            <table className='table'>
              <thead>
                <tr>
                  <td></td>
                  <td></td>
                  <td>All time</td>
                  <td>Recent</td>
                </tr>
              </thead>
              <tbody>

                {tbody}

              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);
  }

  
  level() {

    const DATA = this.props.data;

    const WR_SCORE = DATA.all_time.wr;
    const WN8_SCORE = parseInt(DATA.all_time.wn8);
    const PERC_SCORE = DATA.all_time.total_perc;

    const WR_TAG = this.getArrowTag(DATA.recent.wr, DATA.all_time.wr);
    const WN8_TAG = this.getArrowTag(DATA.recent.wn8, DATA.all_time.wn8);
    const PERC_TAG = this.getArrowTag(DATA.recent.total_perc, DATA.all_time.total_perc);

    return( <nav className='level is-mobile'>

      <div className='level-item has-text-centered'>
        <div>
          <p className='heading'>WINRATE</p>
          <p className='title'>
            { WR_SCORE + ' % ' }
          </p>
          { WR_TAG }
        </div>
      </div>

      <div className='level-item has-text-centered'>
        <div>
          <p className='heading'>WN8</p>
          <p className='title'>
            { WN8_SCORE + ' ' }
            <span style={ {color: this.getWn8Color(WN8_SCORE) } }>
                      &#9733;
            </span>
          </p>
          { WN8_TAG }
        </div>
      </div>

      <div className='level-item has-text-centered'>
        <div>
          <p className='heading'>PERCENTILE</p>
          <p className='title'>
            { PERC_SCORE + ' % ' }
          </p>
          { PERC_TAG }
        </div>
      </div>

    </nav>);

  }
  
  
  panels() {
    return( <div className='columns'>
      <div className='column is-6'>

        <nav className='panel'>
          <p className='panel-heading has-text-centered'>
                    WN8
          </p>
          <div className='panel-block'>
            <ChartLineWn8 data={ this.props.data } />
          </div>
        </nav>

      </div>
      <div className='column is-6'>

        <nav className='panel'>
          <p className='panel-heading has-text-centered'>
                    Total Percentile
          </p>
          <div className='panel-block'>
            <ChartLinePerc data={ this.props.data } />
          </div>
        </nav>

      </div>
    </div>);
  }

  
  render() {
    const CURRENT_TAB = this.props.tabs.filter((x) => x.active).map((x) => x.label)[0];

    if (!this.props.data) return(null);
    if (CURRENT_TAB == 'Dashboard') return(this.dashboard());
    if (CURRENT_TAB == 'In-Detail') return(this.inDetail());
    return(<div>Error: tab doesn't exist</div>);
  }
}