import React from 'react';


import TagsMultiline from '../components/TagsMultiline';
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
      isShowingHelp: true,  // Render help message.
      isLoading: false,     // Show chart button loading indicator.
      selectedTankID: null, // tankID goes here before being added to 'selectedItems'.
      tankopedia: null,     // Tankopedia data onMount.
      history: null,        // Fetched data goes here.
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
      selectedItems: [
        {
          name: 'A',
          tankID: null, 
          tiers: ['10'],
          types: ['heavyTank']
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

    // Start loading.
    this.setState({isLoading: true});

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
        this.setState({isLoading: false});
        if (j.error !== null) {
          window.alert('Server returned an error: ' + j.error);
        } else {
          this.setState({history: j.data});
        }
      })
      .catch(err => {
        this.setState({isLoading: false});
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
    
    // ACTIVE_TIERS and ACTIVE_TYPES are arrays of strings.
    const ACTIVE_TIERS = this.state.filters.filter((x) => (x.type === 'tier') && (x.active)).map((x) => x.id);
    const ACTIVE_TYPES = this.state.filters.filter((x) => (x.type === 'type') && (x.active)).map((x) => x.id);
    
    const includesTierType = x => (ACTIVE_TIERS.includes(String(x.tier)) && ACTIVE_TYPES.includes(x.type));
    const mapperFunc = x => ({ id: x.tank_id, label: x.name });

    return this.state.tankopedia.filter(includesTierType).map(mapperFunc);
  }


  /* chart-items */


  addItem() {
    // Add item to the list.
    // Clear history state field.

    // Maximum 5 items.
    if (this.state.selectedItems.length >= 5) { 
      return;
    }

    const OLD_NAMES = this.state.selectedItems.map(x => x.name);

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

    // Do not add if already name is in old names. (Case with tank_id).
    if (OLD_NAMES.includes(newItem.name)) {
      return;
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

    const makeTierTag = x => (<span className='tag' key={ x }>{ x }</span>);
    const makeTypeTag = x => {
      return(
        <span className='tag' key={ x }>
          { (x.includes('Tank')) ? x[0].toUpperCase() + 'T' : x }
        </span>
      );
    };
    const makeTierTagFromSequence = x => {
      // If sequence of one number e.g. [4, 4]
      if (x[0] == x[1]) { return makeTierTag(`T${x[0]}`); }
      // If sequence of > 1 number e.g. [6, 7]
      return makeTierTag(`T${x[0]}-T${x[1]}`);
    };

    return this.state.selectedItems.map(x => {
      const TIER_ITEMS = getSequences(x.tiers.map(x => parseInt(x))).map(makeTierTagFromSequence);
      return(
        <article className='media' key={ x.name }>
          <div className='media-left'>
            <strong>
              { (x.tankID) ? x.name : 'Set ' + x.name }
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
            <button className='delete' 
              onClick={ () => this.removeItem(x.name) }>
            </button>
          </div>
        </article>
      );
    });
  }


  /* render */


  renderHelpMessage() {
    return(
      <div className='notification has-text-centered'>
        <button className='delete' onClick={ () => this.setState({isShowingHelp: false}) }></button>
        This page shows performace differences between individual tanks and / or any filtered combination on a timeline.
        Data is collected using random sample of recent players.
      </div>
    );
  }


  showChartButton() {
    return(
      <div className='field'>
        <p className='control'>
          <a className={'button is-fullwidth is-light' + ((this.state.isLoading) ? ' is-loading' : '') }
            onClick={ this.fetchHistory }>
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
          
          { (this.state.isShowingHelp) ? this.renderHelpMessage() : null }
          
          <div className='columns'>
            <div className='column'>
              <div className='notification' style={{padding: '0.75em', height: '100%'}}>
                <TagsMultiline 
                  tags={ this.state.filters.filter((x) => x.type == 'tier') }
                  toggleTag={ this.switchFilter }
                  activateAllTags={ () => this.switchFilters('tier', true) }
                  deactivateAllTags={ () => this.switchFilters('tier', false) }
                />
              </div>
            </div>
            <div className='column is-6'>
              <div className='notification' style={{padding: '0.75em', height: '100%'}}>
                <TagsMultiline 
                  tags={ this.state.filters.filter((x) => x.type == 'type') }
                  toggleTag={ this.switchFilter }
                  activateAllTags={ () => this.switchFilters('type', true) }
                  deactivateAllTags={ () => this.switchFilters('type', false) }
                />
              </div>
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