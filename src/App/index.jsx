import React from 'react';


import Hero from './Hero';


import PageLogin from './PageLogin';
import PageHome from './PageHome';
import PageVehicles from './PageVehicles';
import PageTimeseries from './PageTimeseries';
import PageSessionTracker from './PageSessionTracker';
import PageEstimates from './PageEstimates';


// Contains root state of the app.


export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      server: null,
      nickname: null,
      accountID: null,
        
      pages: [
        { label: 'Home',            iconClass: 'fa fa-home',            active: true },
        { label: 'Vehicles',        iconClass: 'fa fa-table',           active: false },
        { label: 'Time Series',     iconClass: 'fa fa-line-chart',      active: false },
        { label: 'Session Tracker', iconClass: 'fa fa-calendar',        active: false },
        { label: 'WN8 Estimates',   iconClass: 'fa fa-calculator',      active: false }
      ]
    };
    this.updateRootInfo = this.updateRootInfo.bind(this);
    this.switchPage = this.switchPage.bind(this);
  }
  
  
  updateRootInfo(Obj) {
    this.setState({
      server: Obj.server,
      nickname: Obj.nickname,
      accountID: Obj.accountID
    });
  }
  
  
  switchPage(sPage) {

    const PAGES = this.state.pages.map((x) => {
      x.active = false;
      if (x.label == sPage) { x.active = true }
      return x;
    });
    
    this.setState({pages: PAGES});
  }

  
  /* render */
   
  
  render() {
    
    if ((this.state.accountID === null) || (this.state.server === null)) {
      return(<PageLogin updateRootInfo={ this.updateRootInfo } />);
    }

    let body;
    const CURRENT_PAGE = this.state.pages.filter((x) => x.active === true).map((x) => x.label)[0];

    // Choosing body.
    switch(CURRENT_PAGE) {
    case 'Home':
      body = (
        <PageHome
          server={ this.state.server }
          accountID={ this.state.accountID }
          nickname={ this.state.nickname }
        />
      );
      break;
    case 'Vehicles':
      body = (
        <PageVehicles 
          server={ this.state.server }
          accountID={ this.state.accountID }
        />
      );
      break;
    case 'Time Series':
      body = (
        <PageTimeseries 
          server={ this.state.server }
          accountID={ this.state.accountID }
        />
      );
      break;
    case 'Session Tracker':
      body = (
        <PageSessionTracker 
          server={ this.state.server }
          accountID={ this.state.accountID } 
        />
      );
      break;
    case 'WN8 Estimates':
      body = (
        <PageEstimates
          server={ this.state.server }
          accountID={ this.state.accountID }
        />
      );
      break;
    default:
      body = (<div>Error: page doesn't exist</div>);
      break;
    }
    
    return(
      <div>
        <Hero
          pages={ this.state.pages }
          nickname={ this.state.nickname }
          switchPage={ this.switchPage }
          updateRootInfo={ this.updateRootInfo }
        />
        {body}
      </div>
    );
  }
  
}
