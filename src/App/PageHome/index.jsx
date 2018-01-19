import React from 'react';


import Hero from './Hero';
import TagsMultiline from '../components/TagsMultiline';
import ChartController from './ChartController';
import TableMain from './TableMain';


// "Home" page.


export default class PageHome extends React.Component {
  //this.props.server
  //this.props.accountID
  //this.props.nickname
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      tableData: null,
      chartData: null,
          
      filters: [
        {label: 'Tier 1',        type: 'tiers', active: true, id: '1'},
        {label: 'Tier 2',        type: 'tiers', active: true, id: '2'},
        {label: 'Tier 3',        type: 'tiers', active: true, id: '3'},
        {label: 'Tier 4',        type: 'tiers', active: true, id: '4'},
        {label: 'Tier 5',        type: 'tiers', active: true, id: '5'},
        {label: 'Tier 6',        type: 'tiers', active: true, id: '6'},
        {label: 'Tier 7',        type: 'tiers', active: true, id: '7'},
        {label: 'Tier 8',        type: 'tiers', active: true, id: '8'},
        {label: 'Tier 9',        type: 'tiers', active: true, id: '9'},
        {label: 'Tier 10',       type: 'tiers', active: true, id: '10'},
        {label: 'Light Tanks',   type: 'class', active: true, id: 'lightTank'},
        {label: 'Medium Tanks',  type: 'class', active: true, id: 'mediumTank'},
        {label: 'Heavy Tanks',   type: 'class', active: true, id: 'heavyTank'},
        {label: 'AT-SPG',        type: 'class', active: true, id: 'AT-SPG'},
        {label: 'SPG',           type: 'class', active: true, id: 'SPG'}
      ]
    };
    this.fetchData = this.fetchData.bind(this);
    this.switchFilter = this.switchFilter.bind(this);
  }

  
  componentDidMount() {
    //if (!this.props.data) this.props.fetchData();
    this.fetchData();
    
    // Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', 'Profile');
      ga('send', 'pageview');
    }  
  }
  
  
  fetchData() {
    
    // Loading indicator.
    this.setState({loading: true});
    
    // Make POST request body.
    const FETCH_BODY = {
      headers: {
        'Accept': 'application/json', 
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        server: this.props.server,
        account_id: this.props.accountID,
        filters: this.state.filters.filter((x) => x.active).map((x) => x.id)
      })
    };
    
    // Fetching.
    fetch('/api/home/', FETCH_BODY)
      .then(response => response.json())
      .then(j => {
        this.setState({loading: false});
        if (j.error !== null) {
          window.alert('Server returned an error: ' + j.error);
        } else {
          this.setState({
            chartData: j.chart_data,
            tableData: j.table_data
          });
        }
      })
      .catch(error => {
        this.setState({loading: false});
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
  
  
  /* render */
  
  
  render() {
    return(
      <section style={{marginTop: '24px'}}>
        <div className='container'>

          <Hero nickname={ this.props.nickname } />

          <div className='columns'>
            <div className='column'>
              <div className='notification' style={{padding: '0.75em', height: '100%'}}>
                <TagsMultiline 
                  tags={ this.state.filters.filter((x) => x.type == 'tiers') }
                  toggleTag={ this.switchFilter }
                  activateAllTags={ () => this.switchFilters('tiers', true) }
                  deactivateAllTags={ () => this.switchFilters('tiers', false) }
                />
              </div>
            </div>
            <div className='column is-6'>
              <div className='notification' style={{padding: '0.75em', height: '100%'}}>
                <TagsMultiline 
                  tags={ this.state.filters.filter((x) => x.type == 'class') }
                  toggleTag={ this.switchFilter }
                  activateAllTags={ () => this.switchFilters('class', true) }
                  deactivateAllTags={ () => this.switchFilters('class', false) }
                />
              </div>
            </div>
          </div>

          <nav className="level">
            <p className="level-item has-text-centered">
              <a className={ 'button is-light is-fullwidth' + ((this.state.loading) ? ' is-loading' : '') }
                onClick={ this.fetchData }>
                Apply filters
              </a>
            </p>
          </nav>

          { (this.state.chartData) ? (<ChartController data={ this.state.chartData } />) : null }

          { (this.state.tableData) ? (<TableMain data={ this.state.tableData } />) : null }

        </div>
      </section>
    );
  }
  
}