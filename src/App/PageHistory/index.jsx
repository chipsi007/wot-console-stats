import React from 'react';


import TagsDropdown from '../components/TagsDropdown';
import InputDropdown from '../components/InputDropdown';
import ChartController from './ChartController';
import getSequences from '../logic/getSequences';


// "History" page.


export default class PageHistory extends React.Component {
  //this.props.server
  //this.props.accountID
  //this.props.nickname
  constructor(props) {
    super(props);
    this.state = {
      selectedTankID: null,
      warningMessage: null,

      tankopedia: null,
      history: null,

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
      ],
      // Container for selected chart items.
      selectedItems: [
        {
          name: 'A',
          tankID: null, 
          tiers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          types: ['lightTank', 'mediumTank', 'heavyTank', 'AT-SPG', 'SPG']
        },
        {
          name: 'IS-7',
          tankID: 7169,
          tiers: ['10'],
          types: ['heavyTank']
        }
      ]
    };
    this.fetchHistory = this.fetchHistory.bind(this);
    this.switchFilter = this.switchFilter.bind(this);
    this.addItem = this.addItem.bind(this);
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
      .catch((error) => {
        alert('There has been a problem with the request. Error message: ' + error.message);
      });
  }


  fetchHistory() {

    const FETCH_BODY = {
      headers: {
        'Accept': 'application/json', 
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        selected_items: this.state.selectedItems
      })
    };
    
    fetch('/api/history/get/', FETCH_BODY)
      .then(r => r.json())
      .then(j => {
        if (j.error !== null) {
          window.alert('Server returned an error: ' + j.error);
        } else {
          this.setState({history: j.data});
        }
      })
      .catch(err => {
        alert('There has been a problem with the request. Error message: ' + err.message);
      });

  }
    
  
  /* filters */
  
  
  switchFilter(sFilterID) {

    let filters = this.state.filters;

    filters.forEach((item) => {
      if (item.id == sFilterID) { item.active = !item.active }
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


  /* chart-items */


  addItem() {
    // Add item to the list.
    // Clear history state field.

    const OLD_NAMES = this.state.selectedItems.map(x => x.name);

    if (OLD_NAMES.length >= 5) {
      this.setState({warningMessage: 'Can\'t add. Too many items selected.'});
      return;
    }

    let newItem;
    if (this.state.selectedTankID) {
      const TANKOPEDIA_ITEM = this.state.tankopedia.filter(x => x.tank_id === this.state.selectedTankID)[0];
      newItem = {
        name: TANKOPEDIA_ITEM.name,
        tankID: this.state.selectedTankID,
        tiers: [String(TANKOPEDIA_ITEM.tier)],
        types: [TANKOPEDIA_ITEM.type]
      };
    } else {
      const ACTIVE_FILTERS = this.state.filters.filter(x => x.active);
      newItem = {
        name: ['F', 'E', 'D', 'C', 'B', 'A'].reduce((x, y) => OLD_NAMES.includes(y) ? x : y),
        tankID: null, 
        tiers: ACTIVE_FILTERS.filter(x => x.type === 'tier').map(x => x.id),
        types: ACTIVE_FILTERS.filter(x => x.type === 'type').map(x => x.id)
      };
    }

    this.setState({
      selectedItems: this.state.selectedItems.concat(newItem),
      history: null
    });
  }


  removeItem(itemName) {
    // Remove item from the list.
    // Clear history state field.
    
    const doesntHaveName = x => x.name !== itemName;

    const NEW_ITEMS = this.state.selectedItems.filter(doesntHaveName);

    this.setState({
      selectedItems: NEW_ITEMS,
      history: null
    });
  }
  

  renderSelectedItems() {
    return this.state.selectedItems.map(x => {

      const NAME = (x.tankID) ? x.name : 'Set ' + x.name;

      const makeTierTag = x => (<span className='tag' key={ x }>{ x }</span>);

      const makeTypeTag = x => {
        return(
          <span className='tag' key={ x }>
            { (x.includes('Tank')) ? x[0].toUpperCase() + 'T' : x }
          </span>
        );
      };

      const TIER_ITEMS = getSequences(x.tiers.map(x => parseInt(x)))
        .map(x => {
          if (x[0] == x[1]) {
            // if sequence of one number e.g. [4, 4]
            return makeTierTag(`T${x[0]}`);
          }
          return makeTierTag(`T${x[0]}-T${x[1]}`);
        });

      return(
        <article className='media' key={ x.name }>
          <div className='media-left'>
            <strong>
              { NAME }
            </strong>
          </div>
          <div className='media-content'>
            <div className='content'>
              <div className='tags'>
                { TIER_ITEMS }
                { x.types.map(makeTypeTag) }
              </div>
            </div>
          </div>
          <div className='media-right'>
            <button className='delete' onClick={ () => this.removeItem(x.name) }></button>
          </div>
        </article>
      );
    });
  }


  /* render */


  showChartButton() {
    return(
      <div className='field'>
        <p className='control'>
          <a className='button is-fullwidth is-light' onClick={ this.fetchHistory }>
            Show chart
          </a>
        </p>
      </div>
    );
  }

  
  render() {
    
    return(
      <section style={{marginTop: '24px'}}>
        <div className='container'>
          
          <div className='notification'>
            <button className='delete'></button>
            Lorem ipsum dolor sit amet, consectetur
            adipiscing elit lorem ipsum dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur. Sit amet,
            consectetur adipiscing elit
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

          <div className='field'>
            <p className='control'>
              <a className='button is-fullwidth is-light' onClick={ this.addItem }>
                Add
              </a>
            </p>
          </div>

          <div style={{margin: '24px'}}>
            { this.renderSelectedItems() }
          </div>

          { (this.state.history) ? (<ChartController data={ this.state.history } />) : this.showChartButton() }
          
        </div>
      </section>
    );
  }
  
}