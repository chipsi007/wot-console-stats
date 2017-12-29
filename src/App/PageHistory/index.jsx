import React from 'react';


import TagsDropdown from '../components/TagsDropdown';
import InputDropdown from '../components/InputDropdown';


// "History" page.


export default class PageHistory extends React.Component {
  //this.props.server
  //this.props.accountID
  //this.props.nickname
  constructor(props) {
    super(props);
    this.state = {
      selectedTankID: 1,
      tankopedia: null,
      filters: [
        {label: 'Tier 1',        type: 'tier', active: true, id: '1'},
        {label: 'Tier 2',        type: 'tier', active: true, id: '2'},
        {label: 'Tier 3',        type: 'tier', active: true, id: '3'},
        {label: 'Tier 4',        type: 'tier', active: true, id: '4'},
        {label: 'Tier 5',        type: 'tier', active: true, id: '5'},
        {label: 'Tier 6',        type: 'tier', active: true, id: '6'},
        {label: 'Tier 7',        type: 'tier', active: true, id: '7'},
        {label: 'Tier 8',        type: 'tier', active: true, id: '8'},
        {label: 'Tier 9',        type: 'tier', active: true, id: '9'},
        {label: 'Tier 10',       type: 'tier', active: true, id: '10'},
        {label: 'Light Tanks',   type: 'type', active: true, id: 'lightTank'},
        {label: 'Medium Tanks',  type: 'type', active: true, id: 'mediumTank'},
        {label: 'Heavy Tanks',   type: 'type', active: true, id: 'heavyTank'},
        {label: 'AT-SPG',        type: 'type', active: true, id: 'AT-SPG'},
        {label: 'SPG',           type: 'type', active: true, id: 'SPG'}
      ]
    };
    this.switchFilter = this.switchFilter.bind(this);
  }

  
  componentDidMount() {
    if (!this.state.tankopedia) { this.fetchTankopedia() }
    
    // Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', 'History');
      ga('send', 'pageview');
    }  
  }
  
  
  fetchTankopedia() {
    
    fetch('/export/tankopedia/')
      .then((r) => r.json())
      .then((j) => {
        if (j.error !== null) {
          window.alert('Server returned an error: ' + j.error);
        } else {
          this.setState({tankopedia: j.data});
        }
      })
      .catch(error => {
        alert('There has been a problem with the request. Error message: ' + error.message);
      });
  }
    
  
  /* filters */
  
  
  switchFilter(sFilterID) {

    let filters = this.state.filters;

    filters.forEach((item) => {
      if (item.id == sFilterID) item.active = !item.active;
    });

    this.setState({filters: filters});
  }
  
  
  switchFilters(sType, bActive) {

    let filters = this.state.filters;

    filters
      .filter((x) => x.type == sType)
      .forEach((x) => {
        if (bActive) { x.active = true }
        else { x.active = false }
      });

    this.setState({filters: filters});
  }
  
  
  /* input-dropdown */
  
  
  getInputDropdownItems() {
    if (!this.state.tankopedia) { return [] }
    
    const ACTIVE_TIERS = this.state.filters.filter((x) => (x.type === 'tier') && (x.active)).map((x) => x.id);
    const ACTIVE_TYPES = this.state.filters.filter((x) => (x.type === 'type') && (x.active)).map((x) => x.id);
    
    return this.state.tankopedia
      .filter((x) => ACTIVE_TIERS.includes(String(x.tier)) && ACTIVE_TYPES.includes(x.type))
      .map((x) => {
        return { id: x.tank_id, label: x.name };
      });
  }
  
  
  /* render */
  
  
  render() {
    
    return(
      <section style={{marginTop: '24px'}}>
        <div className='container'>
          
          <div className="notification">
            <button className="delete"></button>
            Lorem ipsum dolor sit amet, consectetur
            adipiscing elit lorem ipsum dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur. Sit amet,
            consectetur adipiscing elit
          </div>
          
          <div className="tabs is-centered is-fullwidth is-toggle">
            <ul>
              <li className="is-active">
                <a>
                  <span className="icon is-small"><i className="fa fa-image"></i></span>
                  <span>Pictures</span>
                </a>
              </li>
              <li>
                <a>
                  <span className="icon is-small"><i className="fa fa-music"></i></span>
                  <span>Music</span>
                </a>
              </li>
              <li>
                <a>
                  <span className="icon is-small"><i className="fa fa-film"></i></span>
                  <span>Videos</span>
                </a>
              </li>
              <li>
                <a>
                  <span className="icon is-small"><i className="fa fa-file-text-o"></i></span>
                  <span>Documents</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div className='columns'>
            <div className='column'>
              <TagsDropdown 
                tags={ this.state.filters.filter((x) => x.type == 'tier') }
                buttonMsg={ 'Add more tiers...' }
                toggle={ this.switchFilter }
                toggleAllOn={ () => this.switchFilters('tier', true) }
                toggleAllOff={ () => this.switchFilters('tier', false) }
              />
            </div>
            <div className='column is-6'>
              <TagsDropdown 
                tags={ this.state.filters.filter((x) => x.type == 'type') }
                buttonMsg={ 'Add more types...' }
                toggle={ this.switchFilter }
                toggleAllOn={ () => this.switchFilters('type', true) }
                toggleAllOff={ () => this.switchFilters('type', false) }
              />
            </div>
          </div>
          
          <InputDropdown 
            data={ this.getInputDropdownItems() }
            activeID={ this.state.selectedTankID }
            funcActivateID={ (x) => this.setState({selectedTankID: x}) }
            funcDeactivate={ () => this.setState({selectedTankID: null}) }
          />
          
        </div>
      </section>
    );
  }
  
}