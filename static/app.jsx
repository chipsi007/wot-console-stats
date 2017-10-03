// Main functions.
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      server: null,
      nickname: null,
      accountID: null
    };
    this.updateRootInfo = this.updateRootInfo.bind(this);
  }

  updateRootInfo(Obj) {
    this.setState({
      server: Obj.server,
      nickname: Obj.nickname,
      accountID: Obj.accountID
    });
  }

  render() {
    if ((this.state.accountID === null) || (this.state.server === null)) {
      return(<Login updateRootInfo={ this.updateRootInfo } />);
    }

    return(<Main nickname={ this.state.nickname }
                 accountID={ this.state.accountID }
                 server={ this.state.server }
                 updateRootInfo={ this.updateRootInfo } />);
  }
}
class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      warningMsg: null,
      openAbout: false,
      loggedBefore: false,
      nickname: null,
      server: null
    };
    this.updateLocalStorage = this.updateLocalStorage.bind(this);
    this.clearLocalStorage = this.clearLocalStorage.bind(this);
    this.fetchAccountInfo = this.fetchAccountInfo.bind(this);
  }

  componentWillMount() {

    // Getting local storage.
    if (!window.localStorage) { return }
    const NICKNAME = window.localStorage.getItem('nickname');
    const SERVER = window.localStorage.getItem('server');
    if (NICKNAME && SERVER) {
      this.setState({
        loggedBefore: true,
        nickname: NICKNAME,
        server: SERVER
      });
    }
  }

  updateLocalStorage(nickname, server) {
    if (!window.localStorage) { return }
    try {
      window.localStorage.clear();
      window.localStorage.setItem('nickname', nickname);
      window.localStorage.setItem('server', server);
    }
    catch(error) {
      return;
    }

  }

  clearLocalStorage() {
    this.setState({loggedBefore: false});
    if (!window.localStorage) { return }
    window.localStorage.clear();
  }

  fetchAccountInfo() {

    // Clear warning message.
    this.setState({warningMsg: null});

    // Getting variables based on the form.
    let nickname = this.state.nickname;
    let server = this.state.server;

    // If new user, getting variables from refs.
    if (!this.state.loggedBefore) {
      nickname = this.refs.nickname.value;
      server = this.refs.server.value;
    }

    // Validation.
    if (nickname === '') {
      this.setState({warningMsg: 'Please enter your playername'});
      return;
    }

    // Loading indication.
    this.setState({loading: true});

    // Preparing the url.
    let url = 'https://api-' + server + '-console.worldoftanks.com/wotx/account/list/?application_id=demo&search=';
    url += nickname;

    // Requesting the info.
    fetch(url)
      .then(response => { return response.json() })
      .then(j => {
        // Disable loading indicator.
        this.setState({loading: false});
        // Everythyng OK.
        if ((j.status == 'ok') && (j.meta.count > 0)) {
          const OBJ = {
            nickname: j.data[0].nickname,
            accountID: j.data[0].account_id,
            server: server
          };
          this.updateLocalStorage(OBJ.nickname, OBJ.server);
          this.props.updateRootInfo(OBJ);
        // No players found.
        } else if ((j.status == 'ok') && (j.meta.count === 0)) {
          this.setState({warningMsg: 'The player was not found'});
        // WG API returned error.
        } else if (j.status == 'error') {
          this.setState({warningMsg: j.error.message});
        }
      })
      .catch(error => {
        // Disable loading indicator & show warning message.
        this.setState({
          loading: false,
          warningMsg: 'Failed to contact Wargaming API services. Error message: ' + error.message
        });
        // Clear local storage and return to new login form.
        this.clearLocalStorage();
      });
  }

  warningMsg() {
    if (!this.state.warningMsg) { return }
    return( <p className='help is-danger has-text-centered'>
              { this.state.warningMsg }
            </p>);
  }

  newUser() {

    return( <div className='field has-addons'>
              <p className='control has-icons-left is-expanded'>
                <input className='input has-text-centered' type='text' ref='nickname' />
                <span className='icon is-left'>
                  <i className='fa fa-user'></i>
                </span>
              </p>
              <p className='control has-icons-left'>
                <span className='select'>
                  <select ref='server'>
                    <option value='xbox'>XBOX</option>
                    <option value='ps4'>PS4</option>
                  </select>
                </span>
                <span className='icon is-left'>
                  <i className='fa fa-gamepad'></i>
                </span>
              </p>
            </div>);
  }

  returningUser() {

    return( <div className='field is-grouped'>
              <p className='control is-expanded'>
                <span className='button is-static is-fullwidth'>
                  <span className='icon'><i className='fa fa-user'></i></span>
                  <span>{ this.state.nickname }</span>
                </span>
              </p>
              <p className='control'>
                <a className='button is-danger' onClick={ this.clearLocalStorage }>
                  <span className='icon'><i className='fa fa-times'></i></span>
                </a>
              </p>
            </div>);
  }

  about() {
    return( <div className={ 'modal' + (this.state.openAbout ? ' is-active' : '') }>
              <div className='modal-background'></div>
              <div className='modal-card'>
                <header className='modal-card-head'>
                  <p className='modal-card-title'>About</p>
                  <button className='delete' onClick={ () => this.setState({openAbout: false}) }></button>
                </header>
                <section className='modal-card-body'>
                  <div className='content'>  
                    <p>
                      This website is the result to bring fair results tracking into WoT Console community. It is not associated with Wargaming company in any way. It's intended not to shame anyone but rather to satisfy the curiosity of players. Follow the links below to learn more about how the things work inside.
                    </p>
                    <p>
                      The most interesting features of this website requre user to have at least a few data points. To help with that, the system creates checkpoints automatically up 7 days after the last user log in.
                    </p>       
                    <p className='control'>
                      <a className='button is-info is-outlined is-fullwidth'
                         target='_blank'
                         href='https://github.com/IDDT/wot-console-stats/commits/master'>
                        Changelog
                      </a>
                    </p>
                    <p className='control'>
                      <a className='button is-info is-outlined is-fullwidth'
                         target='_blank'
                         href='http://forum-console.worldoftanks.com/index.php?/user/turboparrot666-1076121407/'>
                        Suggest things here
                      </a>
                    </p>
                    <p className='control'>
                      <a className='button is-info is-outlined is-fullwidth'
                         target='_blank'
                         href='https://github.com/IDDT/wot-console-wn8'>
                        Original WN8 / percentiles calculation algorithm.
                      </a>
                    </p>
                    <p className='control'>
                      <a className='button is-info is-outlined is-fullwidth'
                         target='_blank'
                         href='https://github.com/IDDT/wot-console-dataminer'>
                        Service that constantly updates WN8 and percentiles.
                      </a>
                    </p>
                  </div>
                </section>
              </div>
            </div>);
  }

  render() {

    // Loading indication for login button.
    let loginClsName = 'button is-primary is-fullwidth' + (this.state.loading ? ' is-loading' : '');

    return( <section className='hero is-fullheight is-light is-bold is-medium'>
              <div className='hero-body'>
                <div className='container'>
                  <div className='columns is-centered'>

                    <article className='card'>
                      <div className='card-content'>

                        <div className='media'>
                          <div className='media-left'>
                            <span className='icon is-large'><i className='fa fa-line-chart'></i></span>
                          </div>
                          <div className='media-content'>
                            <p className='title is-4'>World of Tanks</p>
                            <p className='subtitle is-6'>console statistics</p>
                          </div>
                          <div className='media-right'>
                            <a onClick={ () => this.setState({openAbout: true}) }>
                              <span className='icon is-small'>
                                <i className='fa fa-question-circle'></i>
                              </span>
                            </a>
                          </div>
                        </div>

                        { (this.state.loggedBefore) ? this.returningUser() : this.newUser() }

                        <div className='field'>
                          <p className='control'>
                            <a className={ loginClsName } onClick={ this.fetchAccountInfo }>
                              <span className='icon'><i className='fa fa-sign-in'></i></span>
                              <span>Login</span>
                            </a>
                          </p>
                        </div>
                        
                        { this.warningMsg() }

                      </div>
                    </article>
                    
                    { this.about() }

                  </div>
                </div>
              </div>
            </section>);
  }
}
class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

      pages: [
        { label: 'Profile',         iconClass: 'fa fa-user',            active: true },
        { label: 'Vehicles',        iconClass: 'fa fa-table',           active: false },
        { label: 'Time Series',     iconClass: 'fa fa-line-chart',      active: false },
        { label: 'Session Tracker', iconClass: 'fa fa-calendar',        active: false },
        { label: 'WN8 Estimates',   iconClass: 'fa fa-calculator',      active: false }
      ],
      tabs: [
        {label: 'Dashboard', active: true},
        {label: 'In-Detail', active: false}
      ],

      loading: false,
      timestamp: 0,
      filterBy50: false,

      profile: null,
      vehicles: null,
      timeSeries: null,
      sessionTracker: null,
      wn8Estimates: null,

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
      ],
      selectors: [
        {label: 'WinRate', active: true,  id: 'wr'},
        {label: 'Battles', active: false, id: 'battles'},
        {label: 'WN8',     active: true,  id: 'wn8'},

        {label: 'Avg Dmg',   active: false, id: 'avg_dmg'},
        {label: 'Avg Frags', active: false, id: 'avg_frags'},
        {label: 'Avg Exp',   active: false, id: 'avg_exp'},

        {label: 'Avg DPM', active: true,  id: 'avg_dpm'},
        {label: 'Avg FPM', active: false, id: 'avg_fpm'},
        {label: 'Avg EPM', active: false, id: 'avg_epm'},

        {label: 'Dmg Percentile', active: false,  id: 'dmg_perc'},
        {label: 'WR Percentile',  active: true,   id: 'wr_perc'},
        {label: 'Exp Percentile', active: false,  id: 'exp_perc'},

        {label: 'Penetrated/Hits caused', active: false, id: 'pen_hits_ratio'},
        {label: 'Bounced/Hits received',  active: false, id: 'bounced_hits_ratio'},
        {label: 'Survived',               active: false, id: 'survived'},

        {label: 'Total Lifetime',   active: false, id: 'total_time_m'},
        {label: 'Average Lifetime', active: false, id: 'avg_lifetime_s'},
        {label: 'Last battle time', active: false, id: 'last_time'}
      ]
    };
    this.switchPage = this.switchPage.bind(this);
    this.switchTab = this.switchTab.bind(this);
    this.switchFilter = this.switchFilter.bind(this);
    this.switchSelector = this.switchSelector.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
    this.setTimestamp = this.setTimestamp.bind(this);

    this.switchFilterBy50 = this.switchFilterBy50.bind(this);

    this.fetchData = this.fetchData.bind(this);
  }

  // Functions
  switchPage(sPage) {

    //Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', sPage);
      ga('send', 'pageview');
    }

    let newPages = this.state.pages;

    newPages.forEach((row) => {
      row.active = false;
      if (row.label == sPage) row.active = true;
    });

    this.setState({pages: newPages});

    // Setting tabs.
    switch(sPage) {
      case 'Profile':
        this.setState({tabs: [
          {label: 'Dashboard', active: true},
          {label: 'In-Detail', active: false}
        ]});
        break;
      default:
        this.setState({tabs: []});
        break;
    }
  }
  switchTab(sTab) {

    let newTabs = this.state.tabs;

    newTabs.forEach((row) => {
      row.active = false;
      if (row.label == sTab) row.active = true;
    });

    this.setState({tabs: newTabs});
  }
  switchFilter(sFilterID) {

    let filters = this.state.filters;

    filters.forEach((item) => {
      if (item.id == sFilterID) item.active = !item.active;
    });

    this.setState({filters: filters});
  }
  switchSelector(sSelectorID) {

    let selectors = this.state.selectors;

    selectors.forEach((item) => {
      if (item.id == sSelectorID) item.active = !item.active;
    });

    this.setState({selectors: selectors});
  }
  switchFilterBy50() {
    const OUTPUT = !this.state.filterBy50;
    this.setState({filterBy50: OUTPUT});
  }
  resetFilters() {
    let filters = this.state.filters;
    filters.forEach((item) => item.active = true);
    this.setState({filters: filters});
  }
  setTimestamp(iTimestamp) {
    // Passing as a callback so the data fetched after the state has changed.
    this.setState({timestamp: iTimestamp}, () => this.fetchData());
  }

  // Ajax
  fetchData() {
    // Get props and states.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;

    const CURRENT_PAGE = this.state.pages.filter((x) => x.active === true).map((x) => x.label)[0];
    const TIMESTAMP = this.state.timestamp;

    const TEMP_FILTERS = this.state.filters.filter((x) => x.active === true).map((x) => x.id);
    const FILTERS = '&' + TEMP_FILTERS.join('&');


    // Obtain the type of request.
    let type;
    switch (CURRENT_PAGE) {
      case 'Profile':
        type = 'profile';
        this.setState({profile: null});
        break;
      case 'Vehicles':
        type = 'vehicles';
        this.setState({vehicles: null});
        break;
      case 'Time Series':
        type = 'time_series';
        this.setState({timeSeries: null});
        break;
      case 'Session Tracker':
        type = 'session_tracker';
        this.setState({sessionTracker: null});
        break;
      case 'WN8 Estimates':
        type = 'wn8_estimates';
        this.setState({wn8Estimates: null});
        break;
    }

    // Assembling the url.
    let url = '/api/' + type + '/' + SERVER + '/' + ACCOUNT_ID + '/' + TIMESTAMP + '/' + FILTERS + '/';

    // Fetching.
    this.setState({loading: true});
    fetch(url)
      .then(response => { return response.json() })
      .then(j => {
        this.setState({loading: false});
        if (j.status != 'ok') {
          alert(j.message);
        } else {
          const RESULT = j.data;
          switch (CURRENT_PAGE) {
            case 'Profile':
              this.setState({profile: RESULT});
              break;
            case 'Vehicles':
              this.setState({vehicles: RESULT});
              break;
            case 'Time Series':
              this.setState({timeSeries: RESULT});
              break;
            case 'Session Tracker':
              this.setState({sessionTracker: RESULT});
              break;
            case 'WN8 Estimates':
              this.setState({wn8Estimates: RESULT});
              break;
            default:
              break;
          }
        }
      })
      .catch(error => {
        this.setState({loading: false});
        alert('There has been a problem with your fetch operation: ' + error.message);
      });
  }

  // Controls
  genFilters(sType) {
    // sType is either 'class' or 'tiers'

    const ITEMS = this.state.filters.filter((item) => item.type == sType);

    let list = [];
    ITEMS.forEach((item) => {
      let className = 'button is-small is-light is-fullwidth';
      if (item.active === true) {
        className += ' is-active';
      }
      list.push(  <div className='column' key={ item.id }>
                    <a className={ className }
                       onClick={ () => this.switchFilter(item.id) }>
                      { item.label }
                    </a>
                  </div>);
    });

    return( <div className='columns is-gapless is-mobile is-multiline is-marginless'>
              { list }
            </div>);
  }
  genSelectors() {

    const ITEMS = this.state.selectors;

    function isActive(bool) {
      if (bool) {
        return('button is-small is-light is-fullwidth is-active');
      } else {
        return('button is-small is-light is-fullwidth');
      }
    }

    let list = [];
    for (let x = 0; x < ITEMS.length; x += 3) {
      list.push(<div className='column' key={ ITEMS[x].id }>

                  <a className={ isActive( ITEMS[x].active ) }
                     onClick={ () => this.switchSelector(ITEMS[x].id) }>
                    { ITEMS[x].label }
                  </a>

                  <a className={ isActive( ITEMS[x+1].active ) }
                     onClick={ () => this.switchSelector(ITEMS[x+1].id) }>
                    { ITEMS[x+1].label }
                  </a>

                  <a className={ isActive( ITEMS[x+2].active ) }
                     onClick={ () => this.switchSelector(ITEMS[x+2].id) }>
                    { ITEMS[x+2].label }
                  </a>

                </div>);
    }

    return( <div className='columns is-gapless is-mobile is-multiline'>
              { list }
            </div>);
  }
  genResetButton() {
    return( <div className='field'>
              <a className='button is-warning is-small is-fullwidth'
                onClick={ this.resetFilters }>
                Reset Filters
              </a>
            </div>);
  }
  genFilterBy50() {

    let className = 'button is-light is-small is-fullwidth';
    if (this.state.filterBy50 === true) className += ' is-active';

    return( <div className='field'>
              <a className={ className }
                 onClick={ this.switchFilterBy50 }>
                Filter by at least 50 battles
              </a>
            </div>);
  }
  genRefreshButton() {
    let className = 'button is-primary is-fullwidth';
    if (this.state.loading) {
      className += ' is-loading';
    }

    return( <div className='level'>
              <a className={ className } onClick={ this.fetchData }>
                Refresh
              </a>
            </div>);
  }

  render() {

    let body;
    const CURRENT_PAGE = this.state.pages.filter((x) => x.active === true).map((x) => x.label)[0];

    // Choosing body.
    switch(CURRENT_PAGE) {
      case 'Profile':
        body = (<Profile data={ this.state.profile }
                         tabs={ this.state.tabs }
                         fetchData={ this.fetchData } />);
        break;
      case 'Vehicles':
        body = (<Vehicles data={ this.state.vehicles }
                          filters={ this.state.filters }
                          selectors={ this.state.selectors }
                          filterBy50={ this.state.filterBy50 }
                          fetchData={ this.fetchData } />);
        break;
      case 'Time Series':
        body = (<Timeseries server={ this.props.server }
                            accountID={ this.props.accountID } />);
        break;
      case 'Session Tracker':
        body = (<SessionTracker server={ this.props.server }
                                accountID={ this.props.accountID } />);
        break;
      case 'WN8 Estimates':
        body = (<Estimates server={ this.props.server }
                           accountID={ this.props.accountID } />);
        break;
      default:
        body = (<div>Error: page doesn't exist</div>)
        break;
    }


    // Choosing controls.
    let controls;
    switch(CURRENT_PAGE) {
      case 'Profile':
        controls = (  <div className='container' style={{marginTop: 15 + 'px', marginBottom: 15 + 'px'}}>
                        { this.genFilters('tiers') }
                        { this.genFilters('class') }
                        { this.genResetButton() }
                        { this.genRefreshButton() }
                      </div>);
        break;
      case 'Vehicles':
        controls = (  <div className='container' style={{marginTop: 15 + 'px', marginBottom: 15 + 'px'}}>
                        { this.genSelectors() }
                        { this.genFilters('tiers') }
                        { this.genFilters('class') }
                        { this.genFilterBy50() }
                        { this.genRefreshButton() }
                      </div>);
        break;
      default:
        controls = null;
    }

    return( <div>
              <Hero pages={ this.state.pages }
                    nickname={ this.props.nickname }
                    switchPage={ this.switchPage }
                    updateRootInfo={ this.props.updateRootInfo } />

              <Nav tabs={ this.state.tabs }
                   switchTab={ this.switchTab } />

              { controls }

              { body }

            </div>);
  }
}

// Page components.
class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.getArrowTag = this.getArrowTag.bind(this);
    this.getSmallArrowTag = this.getSmallArrowTag.bind(this);
    this.getWn8Color = this.getWn8Color.bind(this);
  }

  componentDidMount() {
    if (!this.props.data) this.props.fetchData();
  }

  // Functions.
  getArrowTag(recentNumber, alltimeNumber) {
    if (recentNumber > alltimeNumber) {
      //Arrow up.
      return(<p className='title' style={{color: '#89b891'}}> &#9650; </p>);
    } else if (recentNumber < alltimeNumber) {
      // Arrow down.
      return(<p className='title' style={{color: '#c28080'}}> &#9660; </p>);
    } else {
      // Arrow straight.
      return(<p className='title' style={{color: 'BLACK'}}> &#9654; </p>);
    }
  }
  getSmallArrowTag(recentNumber, alltimeNumber) {
    if (recentNumber > alltimeNumber) {
      //Arrow up.
      return(<p style={{color: '#89b891'}}> &#9650; </p>);
    } else if (recentNumber < alltimeNumber) {
      // Arrow down.
      return(<p style={{color: '#c28080'}}> &#9660; </p>);
    } else {
      // Arrow straight.
      return(<p style={{color: 'BLACK'}}> &#9654; </p>);
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

  // Tabs.
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

      tbody.push( <tr key={ item.attr }>
                    <td>{ this.getSmallArrowTag(RECENT, ALL_TIME) }</td>
                    <td>{ item.label }</td>
                    <td>{ ALL_TIME + item.addon }</td>
                    <td>{ RECENT + item.addon }</td>
                  </tr>);
    });

    return( <div className='container'>
              <div className='tile is-ancestor'>
                <div className='tile is-parent is-6'>
                  <div className='tile is-child box is-12'>

                    <RadarChart data={ this.props.data } />

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

                        { tbody }

                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>);
  }

  // Elements.
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
                    <span style={{color: this.getWn8Color(WN8_SCORE) }}>
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
                    <Wn8LineChart data={ this.props.data } />
                  </div>
                </nav>

              </div>
              <div className='column is-6'>

                <nav className='panel'>
                  <p className='panel-heading has-text-centered'>
                    Total Percentile
                  </p>
                  <div className='panel-block'>
                    <PercLineChart data={ this.props.data } />
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
    return(<div>Error: tab doesn't exist</div>)
  }
}
class Vehicles extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortingColumn: 'unknown'
    };
    this.makeSortedArray = this.makeSortedArray.bind(this);
    this.getHeaderName = this.getHeaderName.bind(this);
    this.formatCell = this.formatCell.bind(this);
    this.genTable = this.genTable.bind(this);
  }

  componentDidMount() {
    if (this.props.data === null) {
      this.props.fetchData();
    }
  }

  makeSortedArray() {
    // Returns sorted array based on header id, includes header ids as the first row.

    const SORTING_COLUMN = this.state.sortingColumn;

    // Getting active selectors.
    const ACTIVE_SELECTORS = this.props.selectors.filter((x) => x.active).map((x) => x.id);
    const HEADER_IDS = ['name'].concat(ACTIVE_SELECTORS);


    // Filters.
    const ALLOWED_TIERS = this.props.filters
      .filter((x) => x.active && (x.type == 'tiers'))
      .map((x) => parseInt(x.id));
    const ALLOWED_CLASSES = this.props.filters
      .filter((x) => x.active && (x.type == 'class'))
      .map((x) => x.id);
    const FILTER_BY_50 = this.props.filterBy50;

    // Creating filtered array with tank names appended as first cell.
    let unsortedArray = [];
    for (let tank of this.props.data) {

      // Conditions.
      const A = ALLOWED_TIERS.includes(tank.tier);
      const B = ALLOWED_CLASSES.includes(tank.type);
      const C = FILTER_BY_50 ? tank.battles >= 50 : true;
      if (!A || !B || !C) continue;

      let row = [tank.short_name];
      ACTIVE_SELECTORS.forEach((cellName) => {
        row.push(tank[cellName]);
      });

      unsortedArray.push(row);
    }


    // Looking for column to sort based on header id.
    let sortIndex = 0;
    for(let h = 0; h < HEADER_IDS.length; h++) {
      if (HEADER_IDS[h] == SORTING_COLUMN) {
        sortIndex = h;
        break;
      }
    }


    // Sorting.
    let sortedArray = unsortedArray.sort(function(a,b) {
      return b[sortIndex] - a[sortIndex];
    });

    return([HEADER_IDS].concat(sortedArray));
  }

  getHeaderName(sHeaderID) {

    const HEADERS_DICT = {
        'name': 'Tank',

        'wr': 'WinRate',
        'battles': 'Battles',
        'wn8': 'WN8',

        'avg_dmg': 'Avg DMG',
        'avg_frags': 'Avg Frags',
        'avg_exp': 'Avg EXP',

        'avg_dpm': 'Avg DPM',
        'avg_fpm': 'Avg FPM',
        'avg_epm': 'Avg EPM',

        'dmg_perc': 'DMG Perc',
        'wr_perc': 'WR Perc',
        'exp_perc': 'EXP Perc',

        'pen_hits_ratio': 'Penned',
        'bounced_hits_ratio': 'Bounced',
        'survived': 'Survived',

        'total_time_m': 'Total Lifetime',
        'avg_lifetime_s': 'Avg Lifetime',
        'last_time': 'Last Battle'
    };

    return(HEADERS_DICT[sHeaderID]);
  }

  formatCell(fValue, sHeaderID) {

    const MONTHS_DICT = {
      '1': 'Jan',
      '2': 'Feb',
      '3': 'Mar',
      '4': 'Apr',

      '5': 'May',
      '6': 'Jun',
      '7': 'Jul',

      '8': 'Aug',
      '9': 'Sep',
      '10': 'Oct',

      '11': 'Nov',
      '12': 'Dec'
    };

    let output;
    switch (sHeaderID) {
      // Percent with two decimals.
      case 'wr':
        output = Math.round(fValue * 100) / 100 + ' %';
        return(output);
      case 'pen_hits_ratio':
      case 'bounced_hits_ratio':
      case 'survived':
        output = Math.round(fValue * 1000) / 10 + ' %';
        return(output);
      // Integer.
      case 'wn8':
      case 'battles':
      case 'avg_dmg':
      case 'avg_exp':
      case 'avg_dpm':
      case 'avg_epm':
      case 'dmg_perc':
      case 'wr_perc':
      case 'exp_perc':
        return(Math.round(fValue));
      // Float with two decimals.
      case 'avg_frags':
      case 'avg_fpm':
        return(Math.round(fValue * 100) / 100);
      // Minutes.
      case 'total_time_m':
        return(Math.round(fValue) + 'm');
      // Minutes and seconds.
      case 'avg_lifetime_s':
        let minutes = parseInt(fValue / 60);
        let seconds = parseInt(fValue - minutes * 60);
        output = minutes + 'm ' + seconds + 's';
        return(output);
      // Last battle time.
      case 'last_time':
        let time = new Date(fValue * 1000);
        output = MONTHS_DICT[String(time.getMonth() + 1)] + ' ' + String(time.getDate());
        return(output);
      // Default.
      default:
        return(fValue);
    }
  }

  genTable() {

    const ARR = this.makeSortedArray();

    const HEADERS = ARR.slice(0, 1)[0];
    const ROWS = ARR.slice(1);

    // Header and footer.
    let thead = [];
    let tfoot = [];
    for (let header of HEADERS) {
      thead.push( <th key={ 'header' + header  }>
                    <a onClick={ () => this.setState({sortingColumn: header}) }>
                      { this.getHeaderName(header) }
                    </a>
                  </th>);
      tfoot.push( <th key={ 'footer' + header  }>
                    { this.getHeaderName( header ) }
                  </th>);
    }

    // Table body.
    let tbody = [];
    for (let r = 0; r < ROWS.length; r++) {
      let row = ROWS[r];
      let tempRow = [];

      for (let c = 0; c < row.length; c++) {
          tempRow.push( <td key={ c }>
                          { this.formatCell(row[c], HEADERS[c]) }
                        </td>);
      }

      tbody.push( <tr key={ r }>
                    { tempRow }
                  </tr>);
    }

    return( <div className='container'>
              <table className='table is-bordered is-narrow is-striped is-fullwidth'>
                <thead>
                  <tr>
                    { thead }
                  </tr>
                </thead>

                <tbody>
                  { tbody }
                </tbody>

                <tfoot>
                  <tr>
                    { tfoot }
                  </tr>
                </tfoot>
              </table>
            </div>);
  }

  render() {

    if (this.props.data === null) return(null);

    return(this.genTable());
  }
}
class Timeseries extends React.Component {
  //this.props.server
  //this.props.accountID
  constructor(props) {
    super(props);
    this.state = {
      
      // Data to request.
      timeScale: 'daily', // 'daily' or 'weekly'
      
      // Editors expanded state. 
      formulaExpanded: false,
      dataExpanded: false,
      
      // Editor tab state.
      dataTab: 'filters', // 'filters' or 'tank'
      
      // editorDataFilters state.
      filters: [
        {label: 'Tier 1',       shortLabel: 'T1',  type: 'tier', active: true, id: '1'},
        {label: 'Tier 2',       shortLabel: 'T2',  type: 'tier', active: true, id: '2'},
        {label: 'Tier 3',       shortLabel: 'T3',  type: 'tier', active: true, id: '3'},
        {label: 'Tier 4',       shortLabel: 'T4',  type: 'tier', active: true, id: '4'},
        {label: 'Tier 5',       shortLabel: 'T5',  type: 'tier', active: true, id: '5'},
        {label: 'Tier 6',       shortLabel: 'T6',  type: 'tier', active: true, id: '6'},
        {label: 'Tier 7',       shortLabel: 'T7',  type: 'tier', active: true, id: '7'},
        {label: 'Tier 8',       shortLabel: 'T8',  type: 'tier', active: true, id: '8'},
        {label: 'Tier 9',       shortLabel: 'T9',  type: 'tier', active: true, id: '9'},
        {label: 'Tier 10',      shortLabel: 'T10', type: 'tier', active: true, id: '10'},
        {label: 'Light Tanks',  shortLabel: 'LT',  type: 'type', active: true, id: 'lightTank'},
        {label: 'Medium Tanks', shortLabel: 'MT',  type: 'type', active: true, id: 'mediumTank'},
        {label: 'Heavy Tanks',  shortLabel: 'HT',  type: 'type', active: true, id: 'heavyTank'},
        {label: 'AT-SPG',       shortLabel: 'AT',  type: 'type', active: true, id: 'AT-SPG'},
        {label: 'SPG',          shortLabel: 'SPG', type: 'type', active: true, id: 'SPG'}
      ],
      
      // editorDataTank state.
      dataTankText: '',
      dataTankType: 'all',
      dataTankTier: 0,
      dataTankID: null,
      dataTankMaxItems: 12,
      
      // Formula container, default formula placed here.
      formula: [
        {label: 'wins',    id: 'wins',    type: 'raw'},
        {label: '÷',       id: 'divide',  type: 'op'},
        {label: 'battles', id: 'battles', type: 'raw'}
      ],
      
      // Messages under formula.
      infoMsg: 'This section allows to calculate various account or tank metrics and view it on a time series chart. Click this message to close.',//null,
      dangerMsg: null,
      
      // Container for player tanks loaded on mount.
      playerTanks: [],
      chartboxes: []
    };
    this.fetchTanks = this.fetchTanks.bind(this);
    this.addChartBox = this.addChartBox.bind(this);
    this.removeLastFormulaItem = this.removeLastFormulaItem.bind(this);
    this.resetFilters = this.resetFilters.bind(this);
  }
  
  componentDidMount() {
    if (this.state.playerTanks.length === 0) { this.fetchTanks() }
  }
  
  // AJAX
  fetchTanks() {
    // Get props and states.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;

    // Assemble the url.
    const ARGS = `?server=${ SERVER }&account_id=${ ACCOUNT_ID }`;
    const URL = '/newapi/general/get-player-tanks/' + ARGS;

    // Fetching.
    fetch(URL)
    .then(response => { return response.json() })
    .then(j => {
      this.setState({loading: false});
      if (j.status != 'ok') {
        window.alert(j.message);
        return;
      }
      if (j.data.length === 0) {
        window.alert('No tanks on the account.');
        return;
      }
      this.setState({playerTanks: j.data});
    })
    .catch(error => {
      alert('There has been a problem with your fetch operation: ' + error.message);
    });
  }
  
  // Formula
  addFormulaItem(item) {
    let formula = this.state.formula;
    
    // Validation.
    if (item.type == 'op') {
      if (formula.length === 0) {
        this.setState({dangerMsg: 'Formula can\'t start with an operation'});
        return;
      }
      if (formula[formula.length - 1].type == 'op') {
        this.setState({dangerMsg: 'Operation has to be followed by a value'});
        return;
      }
      if (formula.length >= 10) {
        this.setState({dangerMsg: 'Formula is too large'});
        return;
      }
    } else if (formula.length > 0) {
      if (['num', 'raw', 'wn8', 'perc'].includes(formula[formula.length - 1].type)) {
        this.setState({dangerMsg: 'Value has to be followed by an operation'});
        return;
      }
    }
    
    formula.push(item);
    this.setState({formula: formula});
  }
  removeFormulaItem(item) {
    const output = this.state.formula.filter((x) => x != item);
    this.setState({formula: output});
  }
  removeLastFormulaItem() {
    this.setState({formula: this.state.formula.slice(0, -1)});
  }
  formula() {
    
    const FORMULA = this.state.formula;
    
    const DELETE_BUTTON = (<button className='delete' onClick={ this.removeLastFormulaItem }></button>);

    let formulaItems = FORMULA.map((x, index) => {
      return( <span className={ 'tag is-medium' + ((x.type === 'op') ? ' is-warning' : ' is-primary') } 
                    key={ index }>
                { x.label }
                { (index === FORMULA.length - 1) ? DELETE_BUTTON : null }
              </span>);
    });
    
    // Empty formula.
    if (FORMULA.length === 0) {
      formulaItems = (<span className='tag is-medium is-light'>Select items in 'Edit formula' section</span>);
    }
    
    return( <nav className='level'>
              
              <div className='level-left'>
                
                <div className='level-item'>
                  <span className='icon'>
                    <a className='fa fa-angle-double-right'
                       onClick={ () => this.setState({formula: []}) }></a>
                  </span>
                </div>
                
                <div className='level-item'>
                  <div className='tags'>
                    { formulaItems }
                  </div>
                </div>
    
              </div>

              <div className='level-right'>
                <p className='level-item'>
                  {
                    (this.state.timeScale === 'daily') ? (<strong>Daily</strong>) : (<a onClick={ () => this.setState({timeScale: 'daily'}) }>Daily</a>)
                  }
                  
                </p>
                <p className='level-item'>
                  {
                    (this.state.timeScale === 'weekly') ? (<strong>Weekly</strong>) : (<a onClick={ () => this.setState({timeScale: 'weekly'}) }>Weekly</a>)
                  }
                </p>
                <p className='level-item'>
                  <a className='button is-success' onClick={ this.addChartBox }>
                    Add chart
                  </a>
                </p>
              </div>
            </nav>);
  }
  
  // Chartboxes
  addChartBox() {
    
    // Validation.
    if (this.state.formula.length === 0) {
      this.setState({dangerMsg: 'Formula doesn\'t contain any values'});
      return;
    }
    if ((this.state.dataTab == 'tank') && (this.state.dataTankID === null)) {
      this.setState({dangerMsg: 'Filter by tank tab is active but no tanks are selected'});
      return;
    }
    if ((this.state.formula.length > 0) && (this.state.formula[this.state.formula.length - 1].type == 'op')) {
      this.setState({dangerMsg: 'Formula can\'t be finished with an operation'});
      return;
    }
    
    // Reset message.
    this.setState({
      dangerMsg: null
    });
    
    // Adding chartbox.
    let charts = this.state.chartboxes;
    charts.push({
      timeScale: this.state.timeScale,
      formula: this.state.formula,
      dataTab: this.state.dataTab,
      filters: this.state.filters,
      dataTankID: this.state.dataTankID,
      tankInfo: (this.state.dataTab == 'tank') ? this.state.playerTanks.find(x => x.tank_id == this.state.dataTankID) : null,
      key: (charts.length > 0) ? Math.max(...charts.map((x) => x.key)) + 1 : 1
    });
    this.setState({chartboxes: charts});
  }
  removeChartBox(key) {
    let output = this.state.chartboxes.filter((x) => x.key != key);
    this.setState({chartboxes: output});
  }
  
  // Filters
  switchFilter(filterID) {
    let filters = this.state.filters;
    for (let item of filters) {
      if (item.id == filterID) { 
        item.active = !item.active; 
        break;
      }
    }
    this.setState({filters: filters});
  }
  resetFilters() {
    this.refs.text.value = '';
    this.refs.tier.value = '0';
    this.refs.type.value = 'all';
    this.setState({
      dataTankText: '',
      dataTankType: 'all',
      dataTankTier: 0,
      dataTankID: null,
      dataTankMaxItems: 12, // actually 12 - 1 for the extend button.
    });
  }
  
  // Editors
  editorFormula() {
    
    const RAW_FIELDS = [
      {label: 'last_battle_time(sec)',        id: 'last_battle_time',                type: 'raw'},
      {label: 'battle_life_time(sec)',        id: 'battle_life_time',                type: 'raw'},
      {label: 'battles',                      id: 'battles',                         type: 'raw'},
      {label: 'capture_points',               id: 'capture_points',                  type: 'raw'},
      {label: 'damage_assisted_radio',        id: 'damage_assisted_radio',           type: 'raw'},
      {label: 'damage_assisted_track',        id: 'damage_assisted_track',           type: 'raw'},
      {label: 'damage_dealt',                 id: 'damage_dealt',                    type: 'raw'},
      {label: 'damage_received',              id: 'damage_received',                 type: 'raw'},
      {label: 'direct_hits_received',         id: 'direct_hits_received',            type: 'raw'},
      {label: 'dropped_capture_points',       id: 'dropped_capture_points',          type: 'raw'},
      {label: 'explosion_hits',               id: 'explosion_hits',                  type: 'raw'},
      {label: 'explosion_hits_received',      id: 'explosion_hits_received',         type: 'raw'},
      {label: 'frags',                        id: 'frags',                           type: 'raw'},
      {label: 'hits',                         id: 'hits',                            type: 'raw'},
      {label: 'losses',                       id: 'losses',                          type: 'raw'},
      {label: 'mark_of_mastery',              id: 'mark_of_mastery',                 type: 'raw'},
      {label: 'max_frags',                    id: 'max_frags',                       type: 'raw'},
      {label: 'max_xp',                       id: 'max_xp',                          type: 'raw'},
      {label: 'no_dmg_direct_hits_received',  id: 'no_damage_direct_hits_received',  type: 'raw'},
      {label: 'piercings',                    id: 'piercings',                       type: 'raw'},
      {label: 'piercings_received',           id: 'piercings_received',              type: 'raw'},
      {label: 'shots',                        id: 'shots',                           type: 'raw'},
      {label: 'spotted',                      id: 'spotted',                         type: 'raw'},
      {label: 'survived_battles',             id: 'survived_battles',                type: 'raw'},
      {label: 'trees_cut',                    id: 'trees_cut',                       type: 'raw'},
      {label: 'wins',                         id: 'wins',                            type: 'raw'},
      {label: 'xp',                           id: 'xp',                              type: 'raw'}
    ];
    const OP_FIELDS = [
      {label: '+', id: 'plus',   type: 'op'},
      {label: '-', id: 'minus',  type: 'op'},
      {label: '×', id: 'times',  type: 'op'},
      {label: '÷', id: 'divide', type: 'op'}
    ];
    const NUM_FIELDS = [
      {label: '100', id: 'hundred',    type: 'num'},
      {label: '60',  id: 'sixty',      type: 'num'},
      {label: '24',  id: 'twentyfour', type: 'num'}
    ];  
    const CALC_FIELDS = [
      {label: 'WN8',                              id: 'wn8',                            type: 'wn8'},
      {label: 'PERC:battle_life_time',            id: 'battle_life_time',               type: 'perc'},
      {label: 'PERC:damage_dealt',                id: 'damage_dealt',                   type: 'perc'},
      {label: 'PERC:damage_received',             id: 'damage_received',                type: 'perc'},
      {label: 'PERC:xp',                          id: 'xp',                             type: 'perc'},
      {label: 'PERC:wins',                        id: 'wins',                           type: 'perc'},
      {label: 'PERC:survived_battles',            id: 'survived_battles',               type: 'perc'},
      {label: 'PERC:losses',                      id: 'losses',                         type: 'perc'},
      {label: 'PERC:max_frags',                   id: 'max_frags',                      type: 'perc'},
      {label: 'PERC:max_xp',                      id: 'max_xp',                         type: 'perc'},
      {label: 'PERC:mark_of_mastery',             id: 'mark_of_mastery',                type: 'perc'},
      {label: 'PERC:capture_points',              id: 'capture_points',                 type: 'perc'},
      {label: 'PERC:damage_assisted_radio',       id: 'damage_assisted_radio',          type: 'perc'},
      {label: 'PERC:damage_assisted_track',       id: 'damage_assisted_track',          type: 'perc'},
      {label: 'PERC:direct_hits_received',        id: 'direct_hits_received',           type: 'perc'},
      {label: 'PERC:no_dmg_direct_hits_received', id: 'no_damage_direct_hits_received', type: 'perc'},
      {label: 'PERC:dropped_capture_points',      id: 'dropped_capture_points',         type: 'perc'},
      {label: 'PERC:explosion_hits',              id: 'explosion_hits',                 type: 'perc'},
      {label: 'PERC:explosion_hits_received',     id: 'explosion_hits_received',        type: 'perc'},
      {label: 'PERC:frags',                       id: 'frags',                          type: 'perc'},
      {label: 'PERC:hits',                        id: 'hits',                           type: 'perc'},
      {label: 'PERC:trees_cut',                   id: 'trees_cut',                      type: 'perc'},
      {label: 'PERC:piercings',                   id: 'piercings',                      type: 'perc'},
      {label: 'PERC:piercings_received',          id: 'piercings_received',             type: 'perc'},
      {label: 'PERC:shots',                       id: 'shots',                          type: 'perc'},
      {label: 'PERC:spotted',                     id: 'spotted',                        type: 'perc'},
      {label: 'PERC:accuracy',                    id: 'accuracy',                       type: 'perc'}
    ];
    
    const OP_ITEMS = OP_FIELDS.map((x, index) => {
      return( <p className='control' key={ x.type + index }>
                <a className='button is-small is-warning'
                   onClick={ () => this.addFormulaItem(x) }>
                  { x.label }
                </a>
              </p>);
    });
    const NUM_ITEMS = NUM_FIELDS.map((x, index) => {
      return( <p className='control' key={ x.type + index }>
                <a className='button is-small is-light'
                   onClick={ () => this.addFormulaItem(x) }>
                  { x.label }
                </a>
              </p>);
    });
    const RAW_ITEMS = RAW_FIELDS.map((x, index) => {
      return( <p className='control' key={ index }>
                <a className='button is-small is-info'
                   onClick={ () => this.addFormulaItem(x) }>
                  { x.label }
                </a>
              </p>);
    });
    const CALC_ITEMS = CALC_FIELDS.map((x, index) => {
      return( <p className='control' key={ index }>
                <a className='button is-small is-danger'
                   onClick={ () => this.addFormulaItem(x) }>
                  { x.label }
                </a>
              </p>);
    });
   
    const HEADER = (
      <header className='card-header'>
        <a className='card-header-title'
           onClick={ () => this.setState({formulaExpanded: !this.state.formulaExpanded}) }>
          <span className='icon'>
            <i className={ (this.state.formulaExpanded) ? 'fa fa-angle-down' : 'fa fa-angle-right' }></i>
          </span>
          Edit formula
        </a>
        <a className='card-header-icon' 
           onClick={ () => this.setState({formulaExpanded: !this.state.formulaExpanded}) }>
          { (this.state.formulaExpanded) ? 'Hide' : 'Show' }
        </a>
      </header>
    );
    
    const CONTENT = (
      <div className='card-content'>
        
        <div className='content'>
          <small>Operations and basic numbers:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { OP_ITEMS }
            { NUM_ITEMS }
          </div>
        </div>
        
        <div className='content'>
          <small>Raw data properties:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { RAW_ITEMS }
          </div>
        </div>
        
        <div className='content'>
          <small>WN8 and percentiles:</small>
          <div className='field is-grouped is-grouped-multiline'>
            { CALC_ITEMS }
          </div>
        </div>
        
      </div>
    );
    
    return( <div className='card is-unselectable'>
              { HEADER }
              { (this.state.formulaExpanded) ? CONTENT : null }
            </div>);
  }
  editorData() {
    
    const HEADER = (
      <header className='card-header'>
        <a className='card-header-title'
           onClick={ () => this.setState({dataExpanded: !this.state.dataExpanded}) }>
          <span className='icon'>
            <i className={ (this.state.dataExpanded) ? 'fa fa-angle-down' : 'fa fa-angle-right' }></i>
          </span>
          Choose data
        </a>
        <a className='card-header-icon' 
           onClick={ () => this.setState({dataExpanded: !this.state.dataExpanded}) }>
          { (this.state.dataExpanded) ? 'Hide' : 'Show' }
        </a>
      </header>
    );
    
    const TABS = (
      <div className='tabs'>
        <ul>
          <li className={ (this.state.dataTab === 'filters') ? 'is-active' : '' }>
            <a onClick={ () => this.setState({dataTab: 'filters'}) }>Filters</a>
          </li>
          <li className={ (this.state.dataTab === 'tank') ? 'is-active' : '' }>
            <a onClick={ () => this.setState({dataTab: 'tank'}) }>Single vehicle</a>
          </li>
        </ul>
      </div>
    );

    const CONTENT = (
      <div className='card-content'>                        
        <div className='content'>

          { (this.state.dataTab === 'filters') ? this.editorDataFilters() : null }
          { (this.state.dataTab === 'tank') ? this.editorDataTank() : null }

        </div>
      </div>
    );
    
    
    return( <div className='card is-unselectable'>
              
              { HEADER }
        
              { (this.state.dataExpanded) ? TABS : null }
        
              { (this.state.dataExpanded) ? CONTENT : null }
        
            </div>);
  }
  editorDataFilters() {
    
    const TIERS = this.state.filters.filter((x) => x.type === 'tier').map((x) => {
      return( <a className={ 'tag' + (x.active ? ' is-success' : '') }
                 onClick={ () => this.switchFilter(x.id) }
                 key={ x.id } >
                { x.label }
              </a>);
    });
    
    const TYPES = this.state.filters.filter((x) => x.type === 'type').map((x) => {
      return( <a className={ 'tag' + (x.active ? ' is-success' : '') }
                 onClick={ () => this.switchFilter(x.id) }
                 key={ x.id } >
                { x.label }
              </a>);
    });
    
//    return( <div className='columns'>
//              <div className='column is-5 is-offset-1'>
//                <div className='tags'>
//                  { TIERS }
//                </div>
//              </div>
//              <div className='column is-4 is-offset-1'>
//                <div className='tags'>
//                  { TYPES }
//                </div>
//              </div>
//            </div>);
    
    return( <div className='columns'>
              <div className='column'>
                <div className='tags'>
                  { TIERS }
                </div>
                <div className='tags'>
                  { TYPES }
                </div>
              </div>
            </div>);
  }
  editorDataTank() {
    
    const TIER_SELECT_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      .map((x) => {
        return( <option key={ x } value={ x }>
                  { (x != 0) ? `Tier ${x}` : 'All tiers' }
                </option>);
      });
    
    const TYPE_SELECT_ITEMS = ['all', 'lightTank', 'mediumTank', 'heavyTank', 'AT-SPG', 'SPG']
      .map((x) => {
        return( <option key={ x } value={ x }>
                  { (x != 'all') ? x[0].toUpperCase() + x.slice(1).replace('Tank', ' Tank') : 'All types' }
                </option>);
      });
    
    const TANKS = this.state.playerTanks
      .filter((x) => {
        const typePass = ((this.state.dataTankType == 'all') || (this.state.dataTankType == x.type)) ? true : false;
        const tierPass = ((this.state.dataTankTier == 0) || (this.state.dataTankTier == x.tier)) ? true : false;
        return typePass && tierPass
      })
      .filter((x) => x.name.toLowerCase().includes(this.state.dataTankText))
      .map((x) => {
        return( 
          <div className='field' key={ x.tank_id }>
            <p className='control is-expanded'>
              <a className={ 'button is-small is-fullwidth' + ((this.state.dataTankID == x.tank_id) ? ' is-info' : ' is-light') }
                 onClick={ () => this.setState({dataTankID: x.tank_id}) }>
                { x.short_name }
              </a>
            </p>
          </div>
        );
      });
    
    // Limit to show as defined in state.
    const TANKS_TO_VIEW = TANKS.slice(0, this.state.dataTankMaxItems);
    
    // Splitting tanks onto 4 columns.
    function splitItems(arr) {
      let col1 = [], col2 = [], col3 = [], col4 = [];
      const floor = Math.floor(arr.length / 4);
      let remainder = arr.length % 4;
      
      if (floor > 0) {
        for (let i = 0; i < floor * 4; i += 4) {
          col1.push(arr[i]);
          col2.push(arr[i + 1]);
          col3.push(arr[i + 2]);
          col4.push(arr[i + 3]);
        }
      }    
      
      if (remainder > 0) {
        const remainderArr = arr.slice(arr.length - remainder, arr.length);
        col1.push(remainderArr[0]);
        col2.push(remainderArr[1]);
        col3.push(remainderArr[2]);
        col4.push(remainderArr[3]);
      }
      
      return [col1, col2, col3, col4];
    }
    
    let [col1, col2, col3, col4] = splitItems(TANKS_TO_VIEW);
    
    // Put extend button to column 4 if more than 12 tanks.
    if (TANKS.length > this.state.dataTankMaxItems) {
      col4[col4.length - 1] = (
        <div className='field' key='extend'>
          <p className='control is-expanded'>
            <a className='button is-small is-fullwidth'
               onClick={ () => this.setState({dataTankMaxItems: this.state.dataTankMaxItems + 12}) }>
              { '• • •' }
            </a>
          </p>
        </div>
      );
    }
    
    
    return( <div>
              <nav className='level'>

                <div className='level-left'>
                
                  <div className='level-item'>
                    <div className='field'>
                      <p className={'control has-icons-left' + ((this.state.playerTanks.length === 0) ? ' is-loading' : '') }>
                        <input className='input' type='text' placeholder='Filter by tank name'
                               onChange={ () => this.setState({dataTankText: this.refs.text.value}) }
                               ref='text' />
                        <span className='icon is-left'>
                          <i className='fa fa-search'></i>
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className='level-item'>
                    <p className='control'>
                      <button className='button is-outlined'
                              onClick={ this.resetFilters }>
                        <span className='icon is-small'>
                          <i className='fa fa-times'></i>
                        </span>
                      </button>
                    </p>
                  </div>
                  
                  <div className='level-item'>
                    <p className='subtitle is-5'>
                      <strong>{ TANKS.length }</strong> vehicles
                    </p>
                  </div>
                  
                </div>

                <div className='level-right'>

                  <div className='level-item'>
                    <div className='select'>
                      <select ref='tier' onChange={ () => this.setState({dataTankTier: this.refs.tier.value}) }>
                        { TIER_SELECT_ITEMS }
                      </select>
                    </div>
                  </div>

                  <div className='level-item'>
                    <div className='select'>
                      <select ref='type' onChange={ () => this.setState({dataTankType: this.refs.type.value}) }>
                        { TYPE_SELECT_ITEMS }
                      </select>
                    </div>
                  </div>

                </div>

              </nav>

              <div className='columns'>
                <div className='column is-3'>
                  { col1 }
                </div>

                <div className='column is-3'>
                  { col2 }
                </div>

                <div className='column is-3'>
                  { col3 }
                </div>

                <div className='column is-3'>
                  { col4 }      
                </div>
              </div>
            </div>);
  }

  render() {
    
    const CHARTBOXES = this.state.chartboxes.map((x) => {
      return( <TimeseriesChartBox
                server={ this.props.server }
                accountID={ this.props.accountID }
                timeScale={ x.timeScale } 
                formula={ x.formula }
                dataTab={ x.dataTab } 
                filters={ x.filters } 
                dataTankID={ x.dataTankID }
                tankInfo={ x.tankInfo }
                remove={ () => this.removeChartBox(x.key) }
                key={ x.key } />);
    });
    
    const DANGER_MESSAGE = (
      <article className='message is-danger'>
        <div className='message-body' onClick={ () => this.setState({dangerMsg: null}) }>
          { this.state.dangerMsg }
        </div>
      </article>
    );
    
    const INFO_MESSAGE = (
      <article className='message'>
        <div className='message-body' onClick={ () => this.setState({infoMsg: null}) }>
          { this.state.infoMsg }
        </div>
      </article>
    );
        
    return( <section className='section'>
              <div className='container' >
                
                { this.formula() }
                { (this.state.dangerMsg) ? DANGER_MESSAGE : null }
                { (this.state.infoMsg) ? INFO_MESSAGE : null }   
                { this.editorFormula() }
                { this.editorData() }

              </div>
              <div className='container' style={{marginTop: 25 + 'px'}}>
                { CHARTBOXES }
              </div>
        
            </section>);
  }
}
class SessionTracker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timestamps: null,
      timestamp: 0,
      data: null,
      tankID: 9999999
    };
    this.convertTime = this.convertTime.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.setTimestamp = this.setTimestamp.bind(this);
    this.genControls = this.genControls.bind(this);
    this.miniTable = this.miniTable.bind(this);
    this.mainBody = this.mainBody.bind(this);
  }

  convertTime(seconds) {
    if (seconds >= 60) {
      const M = parseInt(seconds / 60);
      const S = parseInt(seconds - M * 60);
      return(String(M) + 'm ' + String(S) + 's');
    } else {
      return(String(seconds) + 's');
    }
  }

  fetchData() {
    // Empty the data.
    this.setState({data: null});

    // Assembling the url.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;
    const TIMESTAMP = this.state.timestamp;
    const FILTERS = '&';
    const TYPE = 'session_tracker';
    const URL = '/api/' + TYPE + '/' + SERVER + '/' + ACCOUNT_ID + '/' + TIMESTAMP + '/' + FILTERS + '/';
    // Fetching.
    fetch(URL)
      .then(response => { return response.json() })
      .then(j => {
        if (j.status != 'ok') {
          window.alert('Server returned an error: ' + j.message)
        } else {
          this.setState({
            timestamp: j.data.timestamp,
            timestamps: j.data.timestamps,
            data: j.data.session_tanks
          });
        }
      })
      .catch(error => {
        alert('There has been a problem with your fetch operation: ' + error.message);
      });
  }

  setTimestamp(iTimestamp) {
    // Passing as a callback function so the data fetched after the state has changed.
    this.setState({timestamp: iTimestamp}, () => this.fetchData());
  }

  componentDidMount() {
    if (!this.state.data) { this.fetchData() }
  }

  genControls() {

    const TIMESTAMPS = this.state.timestamps;
    const SELECTED_TIMESTAMP = this.state.timestamp;

    // Blank if no snapshots.
    if (!TIMESTAMPS) { return(null) }

    // Message if 0 snapshots.
    if (TIMESTAMPS.length === 0) {
      return( <div className='column'>
                <div className='notification'>
                  There are currently no snapshots available for comparison, but your today's data is saved. Come back tomorrow to see how your recent performace compares to your all-time statistics.
                </div>
              </div>);
    }

    let output = [];
    TIMESTAMPS.forEach((timestamp) => {
      const DAYS_AGO = Math.round((Date.now() / 1000 - timestamp) / 60 / 60 / 24);
      let className = 'pagination-link';
      if (timestamp == SELECTED_TIMESTAMP) { className += ' is-current' }

      output.push(<li key={ timestamp }>
                    <a className={ className } onClick={ () => this.setTimestamp(timestamp) }>{ DAYS_AGO }</a>
                  </li>);
    });

    const DAYS_AGO = Math.round((Date.now() / 1000 - SELECTED_TIMESTAMP) / 60 / 60 / 24);
    return( <nav className='pagination'>
              <a className='pagination-previous' disabled>Snapshot between { DAYS_AGO } days ago and now</a>
              <ul className='pagination-list'>
                { output }
              </ul>
            </nav>);
  }

  miniTable(oTank) {

    const tank = oTank;

    let thead = tank.tank_name + ' Battles: ' + tank.session.battles + '  Wins: ' + tank.session.wins;

    let tableItems = [
      ['Accuracy',           tank.session.acc,      tank.all.acc],
      ['Damage Caused',      tank.session.dmgc,     tank.all.dmgc],
      ['Radio Assist',       tank.session.rass,     tank.all.rass],
      ['Experience',         tank.session.exp,      tank.all.exp],
      ['Damage Received',    tank.session.dmgr,     tank.all.dmgr],
      ['Lifetime',           tank.session.lifetime, tank.all.lifetime],
      ['DPM',                tank.session.dpm,      tank.all.dpm],
      ['WN8',                tank.session.wn8,      tank.all.wn8]
    ];

    let tbody = [];
    tableItems.forEach((row) => {
      switch(row[0]) {
        // Percent with 2 decimals.
        case 'Accuracy':
          row[1] = String(Math.round(row[1] * 100) / 100) + ' %';
          row[2] = String(Math.round(row[2] * 100) / 100) + ' %';
          break;
        case 'Lifetime':
          row[1] = this.convertTime(row[1]);
          row[2] = this.convertTime(row[2]);
          break;
        // Integer.
        default:
          row[1] = Math.round(row[1]);
          row[2] = Math.round(row[2]);
          break;
      }
      tbody.push( <tr key={ row[0] }>
                    <td>{ row[0] }</td><td>{ row[1] }</td><td>{ row[2] }</td>
                  </tr>);
    });

    return( <table className='table'>
              <thead>
                <tr>
                  <th colSpan={3}>
                    { thead }
                  </th>
                </tr>
                <tr>
                  <th>Averages</th>
                  <th>Session</th>
                  <th>All time</th>
                </tr>
              </thead>
              <tbody>
                { tbody }
              </tbody>
            </table>);
  }

  mainBody() {

    // Loading indicator if data property is null.
    if (this.state.data === null) { return(<Loading />) }

    // Message if data.length = 0 and number of timestamps more than 0.
    if ((this.state.data.length === 0) && (this.state.timestamps.length > 0)) {
      return( <div className='container'>
                <div className='notification'>
                  No tanks were played.
                </div>
              </div>);
    }

    // Blank if data.length = 0.
    if (this.state.data.length === 0) { return(null); }

    // Assuming property exists and length > 0
    const TANKS = this.state.data;
    let tankID = this.state.tankID;
    let selectedTank = TANKS.filter((x) => x.tank_id == this.state.tankID)[0];

    // If no tanks selected in the array.
    if (!selectedTank) {
      selectedTank = TANKS[0];
      tankID = selectedTank.tank_id;
    }

    // Menu elements.
    let menu = [];
    TANKS.forEach((tank) => {
      let className = '';
      if (tank.tank_id == tankID) { className = 'is-active' }

      menu.push(  <li key={ tank.tank_id }>
                    <a className={ className }
                       onClick={ () => this.setState({tankID: tank.tank_id }) }>
                      { tank.tank_name }
                    </a>
                  </li>);
    });

    return( <div className='container'>
              <div className='tile is-ancestor'>

                <div className='tile is-parent is-2'>
                  <div className='tile is-child box'>
                    <aside className='menu'>
                      <p className='menu-label'>Tanks</p>
                      <ul className='menu-list'>
                        { menu }
                      </ul>
                    </aside>
                  </div>
                </div>

                <div className='tile is-parent is-5'>
                  <div className='tile is-child box is-12'>
                    <STRadarChart all_time={ selectedTank.all.radar }
                                  recent={ selectedTank.session.radar } />
                  </div>
                </div>

                <div className='tile is-parent is-5'>
                  <div className='tile is-child box is-12'>
                    { this.miniTable(selectedTank) }
                  </div>
                </div>

              </div>
            </div>);
  }

  render() {

    return( <div>

              <div className='container' style={{marginTop: 15 + 'px', marginBottom: 15 + 'px'}}>
                { this.genControls() }
              </div>

              { this.mainBody() }

            </div>);
  }
}
class Estimates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      typeFilter: null,
      textFilter: '',

      playerTanks: [],
      selectedTankIDs: [],

      limit: 10
    }
    this.fetchTanks = this.fetchTanks.bind(this);
    this.toggleSelect = this.toggleSelect.bind(this);
  }

  componentDidMount() {
    if (this.state.playerTanks.length === 0) { this.fetchTanks() }
  }

  fetchTanks() {
    // Get props and states.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;

    // Assemble the url.
    const ARGS = `?server=${ SERVER }&account_id=${ ACCOUNT_ID }`;
    const URL = '/newapi/general/get-player-tanks/' + ARGS;

    // Fetching.
    fetch(URL)
    .then(response => { return response.json() })
    .then(j => {
      this.setState({loading: false});
      if (j.status != 'ok') {
        window.alert(j.message);
        return;
      }
      if (j.data.length === 0) {
        window.alert('No tanks on the account.');
        return;
      }
      this.setState({playerTanks: j.data});
    })
    .catch(error => {
      alert('There has been a problem with your fetch operation: ' + error.message);
    });
  }

  toggleSelect(iTankID) {

    let selectedTankIDs = this.state.selectedTankIDs;
    let index = selectedTankIDs.indexOf(iTankID);

    if (index === -1) {
      selectedTankIDs.push(iTankID);
    } else {
      selectedTankIDs.splice(index, 1);
    }

    this.setState({selectedTankIDs: selectedTankIDs});
  }

  panel() {

    // Filters.
    const TEXT_FILTER = this.state.textFilter;
    const TYPE_FILTER = this.state.typeFilter;

    const PLAYER_TANKS = this.state.playerTanks;
    const SELECTED_TANKS = this.state.selectedTankIDs;

    // Adding tanks to the panel & filtering.
    let body = [];
    let counter = 0;
    for (let tank of PLAYER_TANKS) {

      // Filters.
      if ((TYPE_FILTER) && (TYPE_FILTER != tank.type)) { continue }
      if (!tank.name.toLowerCase().includes(TEXT_FILTER)) { continue }

      const IS_ACTIVE = SELECTED_TANKS.includes(tank.tank_id);

      body.push(<a className={ 'panel-block' + ((IS_ACTIVE) ? ' is-active' : '') }
                   onClick={ () => this.toggleSelect(tank.tank_id) }
                   key={ tank.tank_id }>
                  <span className='panel-icon'>
                    <i className={ (IS_ACTIVE) ? 'fa fa-check' : 'fa fa-minus' }></i>
                  </span>
                  <span className='tag is-rounded' style={{'marginRight': 4}}>Tier { tank.tier }</span>
                  <span className='tag is-rounded' style={{'marginRight': 4}}>{ tank.nation.toUpperCase() }</span>
                  { tank.name }
                </a>);

      // Adding 'show more' button if hitting the limit.
      counter += 1
      if (counter >= this.state.limit) {
        body.push(<p className='panel-tabs' key={ 'addmore' }>
                    <a onClick={ () => this.setState({limit: this.state.limit + 10}) }>
                      <span className='icon'><i className='fa fa-ellipsis-h'></i></span>
                    </a>
                  </p>);
        break;
      }
    }

    return( <nav className='panel'>
              <p className='panel-heading'>Tanks</p>
              <div className='panel-block'>
                <p className={ 'control has-icons-left' + ((this.state.playerTanks.length === 0) ? ' is-loading' : '') }>
                  <input className='input' type='text' placeholder='Filter by tank name'
                         onChange={ () => this.setState({textFilter: this.refs.textFilter.value}) }
                         ref='textFilter' />
                  <span className='icon is-small is-left'>
                    <i className='fa fa-search'></i>
                  </span>
                </p>
              </div>
              <p className='panel-tabs'>
                <a onClick={ () => this.setState({typeFilter: null}) }
                   className={ (this.state.typeFilter === null) ? 'is-active' : '' }>All
                </a>
                <a onClick={ () => this.setState({typeFilter: 'lightTank'}) }
                   className={ (this.state.typeFilter === 'lightTank') ? 'is-active' : '' }>LT
                </a>
                <a onClick={ () => this.setState({typeFilter: 'mediumTank'}) }
                   className={ (this.state.typeFilter === 'mediumTank') ? 'is-active' : '' }>MT
                </a>
                <a onClick={ () => this.setState({typeFilter: 'heavyTank'}) }
                   className={ (this.state.typeFilter === 'heavyTank') ? 'is-active' : '' }>HT
                </a>
                <a onClick={ () => this.setState({typeFilter: 'AT-SPG'}) }
                   className={ (this.state.typeFilter === 'AT-SPG') ? 'is-active' : '' }>AT-SPG
                </a>
                <a onClick={ () => this.setState({typeFilter: 'SPG'}) }
                   className={ (this.state.typeFilter === 'SPG') ? 'is-active' : '' }>SPG
                </a>
              </p>
        
              { body }

              <div className='panel-block'>
                <a className='button is-primary is-outlined is-fullwidth'
                   onClick={ () => this.setState({selectedTankIDs: []}) }>
                  <span className='icon'><i className='fa fa-trash-o'></i></span>
                </a>
              </div>
            </nav>);
  }

  emptyTanksField() {
    return( <article className='media box'>
              <div className='media-content'>
                <div className='content has-text-centered'>
                  <h4>No tanks selected</h4>

                  <p>
                    Click on a tank in the left panel to view damage targets necessary to achieve a certain WN8 score.
                    <br />
                    The targets are calculated precisely for your account data with WN8 expected values extracted from WoT Console player base.
                  </p>
                </div>
              </div>
            </article>);
  }

  render() {

    const SELECTED_IDS = this.state.selectedTankIDs;
    const PLAYER_TANKS = this.state.playerTanks.filter((x) => SELECTED_IDS.includes(x.tank_id));

    let outputTanks = []

    SELECTED_IDS.forEach((tankID) => {
      const TANK = PLAYER_TANKS.filter((x) => x.tank_id == tankID)[0];
      outputTanks.push(<EstimatesTank accountID={ this.props.accountID }
                                      server={ this.props.server }
                                      tankID={ TANK.tank_id }
                                      tankName={ TANK.name }
                                      tankTier={ TANK.tier }
                                      tankType={ TANK.type }
                                      tankNation={ TANK.nation }
                                      key={ TANK.tank_id }
                                      remove={ this.toggleSelect }/>);
    });

    if (SELECTED_IDS.length === 0) { outputTanks = this.emptyTanksField() }

    return( <section className='section'>
              <div className='container'>
                <div className='columns'>
                  <div className='column is-4'>
                    { this.panel() }
                  </div>
                  <div className='column'>
                    { outputTanks }
                  </div>
                </div>
              </div>
            </section> );
  }
}

// Smaller components.
class Hero extends React.Component {
  constructor(props) {
    super(props);
    this.logout = this.logout.bind(this);
  }

  logout() {
    // Empty browser local storage.
    if (window.localStorage) {
      window.localStorage.clear();
    }
    // Updating root component.
    this.props.updateRootInfo({
      server: null,
      nickname: null,
      accountID: null
    });
  }

  genHeroFoot() {

    let pages = [];
    const CURRENT_PAGE = this.props.pages.filter((x) => x.active).map((x) => x.label)[0];

    this.props.pages.forEach((page) => {
      let isActive = '';
      if (CURRENT_PAGE == page.label) {
        isActive = 'is-active';
      }
      pages.push( <li className={ isActive }
                      onClick={ () => this.props.switchPage(page.label) }
                      key={ page.label }>
                    <a>
                      <span className='icon'><i className={ page.iconClass }></i></span>
                      <span>{ page.label }</span>
                    </a>
                  </li>);
    });
    return( <div className='hero-foot'>
              <nav className='tabs is-boxed'>
                <div className='container'>
                  <ul>
                    {pages}
                  </ul>
                </div>
              </nav>
            </div>);
  }

  genHeroHead() {
    return( <div className='hero-head'>
              <header className='nav'>
                <div className='container'>

                  <div className='nav-left'>
                    <span className='nav-item'>
                      <strong>
                        {this.props.nickname}
                      </strong>
                    </span>
                  </div>

                  <div className='nav-right'>
                    <span className='nav-item'>
                      <a className='button is-primary is-inverted' onClick={ this.logout }>
                        Logout
                      </a>
                    </span>
                  </div>

                </div>
              </header>
            </div>);
  }

  render() {
    return( <section className='hero is-primary'>
              { this.genHeroHead() }
              { this.genHeroFoot() }
            </section>);
  }
}
class Nav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let tabs = [];

    this.props.tabs.forEach((tab) => {
      let className = 'nav-item is-tab';
      if (tab.active) {
        className += ' is-active';
      }
      tabs.push( <a className={ className }
                    onClick={ () => this.props.switchTab(tab.label) }
                    key={ tab.label }>
                    { tab.label }
                  </a>);
    });

    return( <nav className='nav has-shadow'>
              <div className='container'>
                <div className='nav-left'>

                  { tabs }

                </div>
              </div>
            </nav>);
  }
}
class Loading extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return( <section className='section is-medium'>
                <div className='columns'>
                  <div className='column is-4 is-offset-4'>
                    <a className='button is-large is-white is-loading is-fullwidth'></a>
                  </div>
                </div>
            </section>);
  }
}
class EstimatesTank extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      view:      'chart',

      wn8:       null,
      actValues: null,
      expValues: null,
      estimates: null,
      tankData:  null
    }
    this.fetchData = this.fetchData.bind(this);
  }

  fetchData() {
    // Get props and states.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;
    const TANK_ID = this.props.tankID;

    // Assemble the url.
    const ARGS = `?server=${ SERVER }&account_id=${ ACCOUNT_ID }&tank_id=${ TANK_ID }`;
    const URL = '/newapi/estimates/get-tank/' + ARGS;

    // Start loading indication.
    this.setState({loading: true});

    // Fetching.
    fetch(URL)
    .then(response => { return response.json() })
    .then(j => {
      this.setState({loading: false});
      if (j.status != 'ok') {
        alert(j.message);
        return;
      }
      this.setState({
        wn8:       j.data.wn8_score,
        actValues: j.data.wn8_act_values,
        expValues: j.data.wn8_exp_values,
        estimates: j.data.wn8_estimates,
        tankData:  j.data.tank_data
      });
    })
    .catch(error => {
      this.setState({loading: false});
      alert('There has been a problem with your fetch operation: ' + error.message);
    });
  }

  componentDidMount() {
    // Fetchng the data only once.
    if (!this.state.tankData) { this.fetchData() }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return(this.state != nextState);
  }

  loading() {
    return( <article className='media'>
              <div className='media-content'>
                <div className='content'>

                  <div className='columns'>
                    <div className='column is-4 is-offset-4'>
                      <a className='button is-large is-white is-loading is-fullwidth'></a>
                    </div>
                  </div>

                </div>
              </div>
              <div className='media-right'>
                <button className='delete' onClick={ () => this.props.remove(this.props.tankID) }></button>
              </div>
            </article>);
  }

  table() {
    const A_VALS = this.state.actValues;
    const E_VALS = this.state.expValues;

    // Damage targets.
    const LABELS = this.state.estimates.map((x) => x.label);
    const VALUES = this.state.estimates.map((x) => x.value);

    return( <div>
              <table className='table is-narrow is-bordered is-fullwidth'>
                <thead>
                  <tr>{ LABELS.map((x) => (<th key={ x }>{ x }</th>)) }</tr>
                </thead>
                <tbody>
                  <tr>{ VALUES.map((x) => (<td key={ x }>{ x }</td>)) }</tr>
                </tbody>
              </table>
              <table className='table is-narrow is-bordered is-fullwidth'>
                <thead>
                  <tr>
                    <th></th>
                    <th>Damage</th>
                    <th>Def</th>
                    <th>Frag</th>
                    <th>Spot</th>
                    <th>WinRate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Your values</td>
                    <td>{ A_VALS.Damage }</td>
                    <td>{ A_VALS.Def }</td>
                    <td>{ A_VALS.Frag }</td>
                    <td>{ A_VALS.Spot }</td>
                    <td>{ A_VALS.WinRate }</td>
                  </tr>
                  <tr>
                    <td>Expected values</td>
                    <td>{ E_VALS.expDamage }</td>
                    <td>{ E_VALS.expDef }</td>
                    <td>{ E_VALS.expFrag }</td>
                    <td>{ E_VALS.expSpot }</td>
                    <td>{ E_VALS.expWinRate }</td>
                  </tr>
                </tbody>
              </table>
            </div>);
  }

  render() {
    
    // Loading if no tank data.
    if (!this.state.tankData) { return(this.loading()) }

    // Chart or table.
    let body = (<EstimatesBarChart estimates={ this.state.estimates }
                                   wn8={ this.state.wn8 } />);
    if (this.state.view === 'table') { body = this.table() }

    return( <article className='media'>
              <div className='media-content'>
                <div className='content'>

                  <strong>{ this.props.tankName }</strong>
                  <span className='tag is-rounded' style={{'marginLeft': 4}}>
                    Tier { this.props.tankTier }
                  </span>
                  <span className='tag is-rounded' style={{'marginLeft': 4}}>
                    { this.props.tankType[0].toUpperCase() + this.props.tankType.slice(1).replace('Tank', ' Tank') }
                  </span>
                  <span className='tag is-rounded' style={{'marginLeft': 4}}>
                    { this.props.tankNation.toUpperCase() }
                  </span>

                </div>

                <nav className='level is-mobile'>
                  <div className='level-left'>

                    <a className='level-item' onClick={ () => this.setState({view: 'chart'}) }>
                      <span className='icon is-small'><i className='fa fa-bar-chart'></i></span>
                    </a>
                    <a className='level-item' onClick={ () => this.setState({view: 'table'}) }>
                      <span className='icon is-small'><i className='fa fa-table'></i></span>
                    </a>
                    <small>Current WN8: { this.state.wn8 }</small>

                  </div>
                </nav>

                { body }

              </div>
              <div className='media-right'>
                <button className='delete' onClick={ () => this.props.remove(this.props.tankID) }></button>
              </div>
            </article>);
  }
}
class TimeseriesChartBox extends React.Component {
  //this.props.server
  //this.props.accountID
  //this.props.timeScale
  //this.props.formula
  //this.props.dataTab
  //this.props.filters
  //this.props.dataTankID
  //this.props.tankInfo
  //this.props.remove -- remove func
  constructor(props) {
    super(props)
    this.state = {
      timestamps: null,
      totals: null,
      change: null,
      
      showFormula: false
    }
    this.fetchData = this.fetchData.bind(this);
    this.findSequences = this.findSequences.bind(this);
  }

  fetchData() {
    
    fetch('/newapi/timeseries/get-data/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        server:     this.props.server,
        account_id: this.props.accountID,
        time_scale: this.props.timeScale,
        formula:    this.props.formula,
        filter_by:  this.props.dataTab,
        filters:    this.props.filters.filter((x) => x.active).map((x) => x.id),
        tank_id:    this.props.dataTankID
      })
    })
      .then(response => { return response.json() })
      .then(j => {
      
        if (j.status != 'ok') {
          alert(j.message);
          return;
        }
        
        this.setState({
          timestamps: j.timestamps,
          totals:     j.data_totals,
          change:     j.data_change
        });
      })
      .catch(error => {
        alert('There has been a problem with your fetch operation: ' + error.message);
      });
  }

  componentDidMount() {
    // Fetchng the data only once.
    if (!this.state.tankData) { this.fetchData() }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return(this.state != nextState);
  }
  
  findSequences(arr) {
    // Find sequences of numbers in the array of ints.
    // Returns: [[1, 2], [4, 4], [6, 10]]    
    
    let beg, end, output = [];
    let min = Math.min(...arr), max = Math.max(...arr);
    
    for (let i = min; i <= max; i++) {
      // If no beginning value.
      if (!beg && arr.includes(i)) { beg = i }
      // If beginning value exists but i not in the array.
      if (beg && !arr.includes(i)) {
        output.push([beg, i - 1]);
        beg = null;
      }
      // If last item in the array.
      if (beg && arr.includes(i) && (i == max)) { output.push([beg, i]) }
    }
    return output;
  }
  
  dropdownContent() {
    
    if (this.props.dataTab == 'filters') {
      const TIER_NUMBERS = this.props.filters
        .filter(x => x.active && (x.type == 'tier'))
        .map(x => parseInt(x.id));
      
      const TIER_ITEMS = this.findSequences(TIER_NUMBERS)
        .map(x => {
          // x[0] must be unique for every item.
          if (x[0] == x[1]) {
            return(<div className='tag is-rounded' key={ x[0] }>{ `T${x[0]}` }</div>);
          }
          return(<div className='tag is-rounded' key={ x[0] }>{ `T${x[0]}-T${x[1]}` }</div>);
        });
      
      const TYPES = this.props.filters
        .filter(x => x.active && (x.type == 'type'))
        .map(x => x.id)
        .map(x => (x.includes('Tank')) ? (x[0].toUpperCase() + 'T') : x)
        .map(x => (<div className='tag is-rounded' key={x}>{x}</div>));
      
      return (
        <div className='dropdown-content'>
          <div className='dropdown-item'>
            <div className='tags'>
              { TIER_ITEMS }
              { TYPES }
            </div>
          </div>
        </div>
      );
    } 
    
    if (this.props.dataTab == 'tank') {
      return (
        <div className='dropdown-content'>
          <div className='dropdown-item'>
            <div className='tags'>
              <div className='tag is-rounded'>
                { 'T' + this.props.tankInfo.tier }
              </div>
              <div className='tag is-rounded'>
                {  (this.props.tankInfo.type.includes('Tank')) ? this.props.tankInfo.type[0].toUpperCase() + 'T' : this.props.tankInfo.type }
              </div>
              <div className='tag is-rounded'>
                { this.props.tankInfo.nation.toUpperCase() }
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
  
  loading() {
    return( <article className='media'>
              <div className='media-content'>
                <div className='content'>

                  <div className='columns'>
                    <div className='column is-4 is-offset-4'>
                      <a className='button is-large is-white is-loading is-fullwidth'></a>
                    </div>
                  </div>

                </div>
              </div>
              <div className='media-right'>
                <button className='delete' onClick={ () => this.props.remove() }></button>
              </div>
            </article>);
  }

  render() {
    
    // Loading if no tank data.
    if (!this.state.timestamps) { return(this.loading()) }
    
    const FORMULA_ITEMS = this.props.formula.map((x, index) => {
      return( <span className={ 'tag' + ((x.type == 'op') ? ' is-warning' : ' is-primary') } key={ index }>
                { x.label }
              </span>);
    });
    
    const FORMULA = ( <div className='field'>
                        <div className='tags'>
                          { FORMULA_ITEMS }
                        </div>
                      </div>);
     
    return( <article className='media'>
        
              <div className='media-content'>
                
                <div className='field is-grouped'>
                  
                  <div className='control dropdown is-hoverable'>
                    <div className='dropdown-trigger'>
                      <button className='button is-info is-small' aria-haspopup='true' aria-controls='dropdown-menu4'>
                        <span>{ (this.props.dataTab == 'filters') ? 'Filters' : this.props.tankInfo.short_name }</span>
                        <span className='icon is-small'>
                          <i className='fa fa-angle-down' aria-hidden='true'></i>
                        </span>
                      </button>
                    </div>
                    <div className='dropdown-menu' role='menu'>
                      { this.dropdownContent() }
                    </div>
                  </div>
                         
                  <p className='control'>
                    <a className='button is-small' 
                       onClick={ () => this.setState({showFormula: !this.state.showFormula}) }>
                      { ((this.state.showFormula) ? 'Hide' : 'View') + ' formula' }
                    </a>
                  </p>
                  
                </div>
                
                { (this.state.showFormula) ? FORMULA : null }  
                
                <TimeseriesLineChart timestamps={ this.state.timestamps } 
                                     totals={ this.state.totals }
                                     change={ this.state.change } />
                
              </div>
              <div className='media-right'>
                <button className='delete' onClick={ () => this.props.remove() }></button>
              </div>
            </article>);
  }
}



//// Charts
// Profile
class Wn8LineChart extends React.Component {
  constructor(props) {
    super(props);
    this.OpenChart = this.OpenChart.bind(this);
  }

  componentDidMount() {
    this.OpenChart();
  }

  componentDidUpdate() {
    this.OpenChart();
  }

  OpenChart() {

    if (!this.props.data) return;

    // Do nothing if previous data same as current data.
    if ((this.previousData) && (this.props.data == this.previousData)) return;

    // Assigning previous data if empty.
    if (!this.previousData) {
      this.previousData = this.props.data;
    }

    if (this.Wn8LineChart) this.Wn8LineChart.destroy();
    let ctx = this.refs.Wn8LineChart;
    const DATA = this.props.data;

    this.Wn8LineChart = new Chart(ctx, {
      type: 'line',
      data:  {
        labels: DATA.xlabels,
        datasets: [{
          label: 'WN8',
          fill: true,
          backgroundColor: 'hsla(200, 25%, 63%, 0.1)',
          borderColor: 'hsl(200, 25%, 63%)',
          pointBackgroundColor: 'hsl(200, 25%, 63%)',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: 'hsl(200, 25%, 63%)',
          data: DATA.wn8_totals,
        }]
      },
      options: {
        legend: {
          display: false
        },
        scales: {
          yAxes: [{
            ticks: {
              callback: function(label, index, labels) {
                return Math.round(label);
              }
            }
          }]
        }
      }
    });
  }

  render() {
    return(<canvas ref='Wn8LineChart' width='100' height='40'></canvas>);
  }
}
class PercLineChart extends React.Component {
  constructor(props) {
    super(props);
    this.OpenChart = this.OpenChart.bind(this);
  }

  componentDidMount() {
    this.OpenChart();
  }

  componentDidUpdate() {
    this.OpenChart();
  }

  OpenChart() {

    if (!this.props.data) return;

    // Do nothing if previous data same as current data.
    if ((this.previousData) && (this.props.data == this.previousData)) return;

    // Assigning previous data if empty.
    if (!this.previousData) {
      this.previousData = this.props.data;
    }

    if (this.PercLineChart) this.PercLineChart.destroy();
    let ctx = this.refs.PercLineChart;
    const DATA = this.props.data;

    this.PercLineChart = new Chart(ctx, {
      type: 'line',
      data:  {
        labels: DATA.xlabels,
        datasets: [{
          label: 'Total Percentile',
          fill: true,
          backgroundColor: 'hsla(130, 25%, 63%, 0.1)',
          borderColor: 'hsl(130, 25%, 63%)',
          pointBackgroundColor: 'hsl(130, 25%, 63%)',
          pointBorderColor: '#ffffff',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: 'hsl(130, 25%, 63%)',
          data: DATA.percentiles_totals,
        }],
      },
      options: {
        legend: {
          display: false,
        },
        scales: {
          yAxes: [{
            ticks: {
              callback: function(label, index, labels) {
                return Math.round(label * 100) / 100;
              }
            },
          }],
        },
      },
    });
  }

  render() {
    return(<canvas ref='PercLineChart' width='100' height='40'></canvas>);
  }
}
class RadarChart extends React.Component {
  constructor(props) {
    super(props);
    this.OpenRadChart = this.OpenRadChart.bind(this);
  }

  componentDidMount() {
    this.OpenRadChart();
  }

  componentDidUpdate() {
    this.OpenRadChart();
  }

  OpenRadChart() {
    if (!this.props.data) return;
    // Do nothing if previous data same as current data.
    if ((this.previousData) && (this.props.data == this.previousData)) return;
    // Assigning previous data if empty.
    if (!this.previousData) {
      this.previousData = this.props.data;
    }

    if (this.RadChart) this.RadChart.destroy();
    let ctx = this.refs.RadarChart;
    const DATA = this.props.data;

    this.RadChart = new Chart(ctx, {
      type: 'radar',
      data:  {
        labels: ['Accuracy', 'Damage Caused', 'Radio Assist', 'WinRate', 'Damage Received (inv)'],
        datasets: [
          {
            label: 'Recent Percentiles',
            fill: true,
            backgroundColor: 'hsla(0, 35%, 63%, 0.2)',
            borderColor: 'hsl(0, 35%, 63%)',
            pointBackgroundColor: 'hsl(0, 35%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(0, 35%, 63%)',
            data: [
              DATA.recent.percentiles.acc,
              DATA.recent.percentiles.dmgc,
              DATA.recent.percentiles.rass,
              DATA.recent.percentiles.wr,
              DATA.recent.percentiles.dmgr
            ],
          },
          {
            label: 'All Time Percentiles',
            fill: true,
            backgroundColor: 'hsla(200, 25%, 63%, 0.1)',
            borderColor: 'hsl(200, 25%, 63%)',
            pointBackgroundColor: 'hsl(200, 25%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(200, 25%, 63%)',
            data: [
              DATA.all_time.percentiles.acc,
              DATA.all_time.percentiles.dmgc,
              DATA.all_time.percentiles.rass,
              DATA.all_time.percentiles.wr,
              DATA.all_time.percentiles.dmgr
            ],
          }
        ]
      },
      options: {
        scale: {
          ticks: {
            beginAtZero: true
          }
        }
      }
    });
  }

  render() {
      return(<canvas ref='RadarChart' width='100' height='70'></canvas>);
  }
}
// Session Tracker (basic)
class STRadarChart extends React.Component {
  constructor(props) {
    super(props);
    this.openChart = this.openChart.bind(this);
  }

  componentDidMount() {
    this.openChart();
  }

  componentDidUpdate() {
    this.openChart();
  }

  componentWillUnmount() {
    if (this.Chart) { this.Chart.destroy() }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return(this.props != nextProps);
  }

  openChart() {

    // Destroying the chart and picking the reference.
    if (this.Chart) this.Chart.destroy();
    let ctx = this.refs.chart;


    const ALL_TIME = this.props.all_time;
    const RECENT = this.props.recent;
    const DATA = this.props.data;

    this.Chart = new Chart(ctx, {
      type: 'radar',
      data:  {
        labels: ['Accuracy', 'Damage Caused', 'Radio Assist', 'Experience', 'Damage Received (inv)'],
        datasets: [
          {
            label: 'Selected period',
            fill: true,
            backgroundColor: 'hsla(0, 35%, 63%, 0.2)',
            borderColor: 'hsl(0, 35%, 63%)',
            pointBackgroundColor: 'hsl(0, 35%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(0, 35%, 63%)',
            data: RECENT,
          },
          {
            label: 'All time',
            fill: true,
            backgroundColor: 'hsla(200, 25%, 63%, 0.1)',
            borderColor: 'hsl(200, 25%, 63%)',
            pointBackgroundColor: 'hsl(200, 25%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(200, 25%, 63%)',
            data: ALL_TIME,
          }
        ]
      },
      options: {
        scale: {
          ticks: {
            beginAtZero: true
          }
        }
      }
    });
  }

  render() {
      return(<canvas ref='chart' width='100' height='100'></canvas>);
  }
}
// Time Series
class TimeseriesLineChart extends React.PureComponent {
  //this.props.timestamps
  //this.props.totals
  //this.props.change
  constructor(props) {
    super(props);
    this.openChart = this.openChart.bind(this);
  }

  componentDidMount() {
    this.openChart();
  }

  componentDidUpdate() {
    this.openChart();
  }

  componentWillUnmount() {
    if (this.Chart) { this.Chart.destroy() }
  }

  openChart() {

    // Destroying the chart and picking the reference.
    if (this.Chart) this.Chart.destroy();
    let ctx = this.refs.chart;

    // Pulling the data from props.
    const LABELS = this.props.timestamps.map(x => x * 1000);
    const TOTALS = this.props.totals;
    const CHANGE = this.props.change.map(x => (x == 0) ? null : x);

    // Creating the chart.
    this.Chart = new Chart(ctx, {
      type: 'line',
      data:  {
        labels: LABELS,
        datasets: [
          {
            label: 'Change',
            fill: false,
            spanGaps: true,
            hidden: true,
            backgroundColor: 'hsla(0, 35%, 63%, 0.2)',
            borderColor: 'hsl(0, 35%, 63%)',
            pointBackgroundColor: 'hsl(0, 35%, 63%)',
            pointBorderColor: '#ffffff',
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'hsl(0, 35%, 63%)',
            data: CHANGE
           },
           {
             label: 'Total',
             fill: true,
             backgroundColor: 'hsla(195, 20%, 63%, 0.1)',
             borderColor: 'hsl(195, 20%, 63%)',
             pointBackgroundColor: 'hsl(195, 20%, 63%)',
             pointBorderColor: '#ffffff',
             pointHoverBackgroundColor: '#ffffff',
             pointHoverBorderColor: 'hsl(195, 20%, 63%)',
             data: TOTALS
          }
        ]
      },
      options: {
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM D'
              }
            }
          }],
          yAxes: [
            {
              scaleLabel: {
                display: true
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            // Format for x axis.
            title: function(tooltipItem, data) {
              const DATE = new Date(tooltipItem[0].xLabel);
              const MONTH = DATE.toLocaleString('en-us', { month: 'long' });
              return `${ MONTH } ${ DATE.getDate() }, ${ DATE.getFullYear() }`;
            },
            // Format for y axis.
            label: function(tooltipItem, data) {
              return Math.round(tooltipItem.yLabel * 1000) / 1000;
            }
          }
        }
      }
    });
  }

  render() {
      return(<canvas ref='chart' width='100' height='25'></canvas>);
  }
}
// Estimates
class EstimatesBarChart extends React.Component {
  constructor(props) {
    super(props);
    this.openChart = this.openChart.bind(this);
  }

  componentDidMount() {
    this.openChart();
  }

  componentDidUpdate() {
    this.openChart();
  }

  componentWillUnmount() {
    if (this.Chart) { this.Chart.destroy() }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return(this.props != nextProps);
  }

  openChart() {

    // Destroying the chart and picking the reference.
    if (this.Chart) this.Chart.destroy();
    let ctx = this.refs.chart;


    // Pulling the data from props.
    const LABELS = this.props.estimates.map((x) => x.label);
    const VALUES = this.props.estimates.map((x) => x.value);
    const WN8_SCORE = this.props.wn8;


    // Making colors arrays. Highlighting user WN8 score.
    let scoreIndex = null;
    for (let i = 0; i < LABELS.length; i++) {
      if (WN8_SCORE >= LABELS[i]) { scoreIndex = i }
    }
    let backgroundColors = [];
    let borderColors = [];
    for (let i = 0; i < LABELS.length; i++) {
      if (scoreIndex === i) {
        backgroundColors.push('hsla(0, 35%, 63%, 0.2)');
        borderColors.push('hsl(0, 35%, 63%)');
      } else {
        backgroundColors.push('hsla(200, 25%, 63%, 0.1)');
        borderColors.push('hsl(200, 25%, 63%)');
      }
    }


    // Creating the chart.
    this.Chart = new Chart(ctx, {
      type: 'bar',
      data:  {
        labels: LABELS,
        datasets: [
          {
            label: 'Expected DMG',
            fill: true,
            borderWidth: 2,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            data: VALUES
          }
        ]
      },
      options: {
        title: {
          display: true,
          text: 'Damage Targets' },
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            ticks: {
              callback: function(value, index, values) {
                  return(value + ' WN8');
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: 'Dmg needed'
            }
          }]
        }
      }
    });
  }

  render() {
      return(<canvas ref='chart' width='100' height='25'></canvas>);
  }
}

ReactDOM.render(
  <div>
    <App />
  </div>, document.getElementById('root'));