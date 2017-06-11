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
    this.setState({ server: Obj.server,
      nickname: Obj.nickname,
      accountID: Obj.accountID
    });
  }

  render() {

    if (this.state.accountID === null || this.state.server === null) {
      return React.createElement(Login, { updateRootInfo: this.updateRootInfo });
    } else {
      return React.createElement(Main, { nickname: this.state.nickname,
        accountID: this.state.accountID,
        server: this.state.server,
        updateRootInfo: this.updateRootInfo });
    }
  }
}

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      server: null,
      loading: false
    };
  }

  fetchAccountID() {

    let nickname = this.refs.nickname.value;

    // Validation.
    if (this.state.server === null) {
      alert('Server is not selected');
      return;
    }
    if (nickname == '') {
      alert('Please enter your playername');
      return;
    }

    // Loading indicator.
    this.setState({ loading: true });

    // Preparing the url for the request.
    let url;
    if (this.state.server == 'xbox') {
      url = 'https://api-xbox-console.worldoftanks.com/wotx/account/list/?application_id=demo&search=' + nickname;
    } else {
      url = 'https://api-ps4-console.worldoftanks.com/wotx/account/list/?application_id=demo&search=' + nickname;
    }

    // Requesting the info.
    fetch(url).then(response => {
      return response.json();
    }).then(j => {
      // Disable loading indicator.
      this.setState({ loading: false });
      // Conditions.
      if (j.status == 'ok' && j.meta.count > 0) {
        const OBJ = { nickname: j.data[0].nickname,
          accountID: j.data[0].account_id,
          server: this.state.server };
        this.props.updateRootInfo(OBJ);
      } else if (j.status == 'ok' && j.meta.count === 0) {
        alert('No such player found');
      } else if (j.status == 'error') {
        alert(j.error.message);
      }
    }).catch(error => {
      // Disable loading indicator.
      this.setState({ loading: false });
      alert('Failed to contact Wargaming API services, error message: ' + error.message);
    });
  }

  render() {
    // Assigning classnames for buttons based on state.
    let xboxCls = 'button is-fullwidth';
    let ps4Cls = 'button is-fullwidth';
    if (this.state.server == 'xbox') xboxCls += ' is-active';
    if (this.state.server == 'ps4') ps4Cls += ' is-active';

    // Loading indication for login button.
    let loginButtonClassName = 'button is-primary is-fullwidth';
    if (this.state.loading) loginButtonClassName += ' is-loading';

    return React.createElement(
      'section',
      { className: 'section is-large' },
      React.createElement(
        'div',
        { className: 'columns' },
        React.createElement(
          'div',
          { className: 'column is-4 is-offset-4' },
          React.createElement(
            'div',
            { className: 'card' },
            React.createElement(
              'div',
              { className: 'card-content' },
              React.createElement(
                'div',
                { className: 'field' },
                React.createElement(
                  'p',
                  { className: 'control' },
                  React.createElement('input', { ref: 'nickname', className: 'input has-text-centered', type: 'text', placeholder: 'Playername' })
                )
              ),
              React.createElement(
                'div',
                { className: 'field is-grouped' },
                React.createElement(
                  'p',
                  { className: 'control is-expanded' },
                  React.createElement(
                    'a',
                    { className: xboxCls, onClick: () => {
                        this.setState({ server: 'xbox' });
                      } },
                    'XBOX'
                  )
                ),
                React.createElement(
                  'p',
                  { className: 'control is-expanded' },
                  React.createElement(
                    'a',
                    { className: ps4Cls, onClick: () => {
                        this.setState({ server: 'ps4' });
                      } },
                    'PLAYSTATION'
                  )
                )
              ),
              React.createElement(
                'div',
                { className: 'field' },
                React.createElement(
                  'p',
                  { className: 'control' },
                  React.createElement(
                    'a',
                    { className: loginButtonClassName, onClick: () => this.fetchAccountID() },
                    'Login'
                  )
                )
              )
            )
          ),
          React.createElement(
            'article',
            { className: 'message is-light' },
            React.createElement(
              'div',
              { className: 'message-body has-text-centered' },
              'Stable version: wot.pythonanywhere.com'
            )
          )
        )
      )
    );
  }
}

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

      pages: [{ label: 'Profile', active: true }, { label: 'Vehicles', active: false }, { label: 'Time Series', active: false }, { label: 'Session Tracker', active: false }, { label: 'WN8 Estimates', active: false }, { label: 'About', active: false }],
      tabs: [{ label: 'Dashboard', active: true }, { label: 'In-Detail', active: false }],

      loading: false,
      timestamp: 0,
      filterBy50: false,

      profile: null,
      vehicles: null,
      timeSeries: null,
      sessionTracker: null,
      wn8Estimates: null,

      filters: [{ label: 'Tier 1', type: 'tiers', active: true, id: '1' }, { label: 'Tier 2', type: 'tiers', active: true, id: '2' }, { label: 'Tier 3', type: 'tiers', active: true, id: '3' }, { label: 'Tier 4', type: 'tiers', active: true, id: '4' }, { label: 'Tier 5', type: 'tiers', active: true, id: '5' }, { label: 'Tier 6', type: 'tiers', active: true, id: '6' }, { label: 'Tier 7', type: 'tiers', active: true, id: '7' }, { label: 'Tier 8', type: 'tiers', active: true, id: '8' }, { label: 'Tier 9', type: 'tiers', active: true, id: '9' }, { label: 'Tier 10', type: 'tiers', active: true, id: '10' }, { label: 'Light Tanks', type: 'class', active: true, id: 'lightTank' }, { label: 'Medium Tanks', type: 'class', active: true, id: 'mediumTank' }, { label: 'Heavy Tanks', type: 'class', active: true, id: 'heavyTank' }, { label: 'AT-SPG', type: 'class', active: true, id: 'AT-SPG' }, { label: 'SPG', type: 'class', active: true, id: 'SPG' }],
      selectors: [{ label: 'WinRate', active: true, id: 'wr' }, { label: 'Battles', active: false, id: 'battles' }, { label: 'WN8', active: true, id: 'wn8' }, { label: 'Avg Dmg', active: false, id: 'avg_dmg' }, { label: 'Avg Frags', active: false, id: 'avg_frags' }, { label: 'Avg Exp', active: false, id: 'avg_exp' }, { label: 'Avg DPM', active: true, id: 'avg_dpm' }, { label: 'Avg FPM', active: false, id: 'avg_fpm' }, { label: 'Avg EPM', active: false, id: 'avg_epm' }, { label: 'Dmg Percentile', active: false, id: 'dmg_perc' }, { label: 'WR Percentile', active: true, id: 'wr_perc' }, { label: 'Exp Percentile', active: false, id: 'exp_perc' }, { label: 'Penetrated/Hits caused', active: false, id: 'pen_hits_ratio' }, { label: 'Bounced/Hits received', active: false, id: 'bounced_hits_ratio' }, { label: 'Survived', active: false, id: 'survived' }, { label: 'Total Lifetime', active: false, id: 'total_time_m' }, { label: 'Average Lifetime', active: false, id: 'avg_lifetime_s' }, { label: 'Last battle time', active: false, id: 'last_time' }]
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

    let newPages = this.state.pages;

    newPages.forEach(row => {
      row.active = false;
      if (row.label == sPage) row.active = true;
    });

    this.setState({ pages: newPages });

    // Setting tabs.
    switch (sPage) {
      case 'Profile':
        this.setState({ tabs: [{ label: 'Dashboard', active: true }, { label: 'In-Detail', active: false }] });
        break;
      case 'Time Series':
        this.setState({ tabs: [{ label: 'Daily Percentiles', active: true }, { label: 'WN8', active: false }] });
        break;
      case 'WN8 Estimates':
        this.setState({ tabs: [{ label: 'WN8 Target Damage', active: true }, { label: 'WN8 Player Values', active: false }] });
        break;
      default:
        this.setState({ tabs: [] });
        break;
    }
  }
  switchTab(sTab) {

    let newTabs = this.state.tabs;

    newTabs.forEach(row => {
      row.active = false;
      if (row.label == sTab) row.active = true;
    });

    this.setState({ tabs: newTabs });
  }
  switchFilter(sFilterID) {

    let filters = this.state.filters;

    filters.forEach(item => {
      if (item.id == sFilterID) item.active = !item.active;
    });

    this.setState({ filters: filters });
  }
  switchSelector(sSelectorID) {

    let selectors = this.state.selectors;

    selectors.forEach(item => {
      if (item.id == sSelectorID) item.active = !item.active;
    });

    this.setState({ selectors: selectors });
  }
  switchFilterBy50() {
    const OUTPUT = !this.state.filterBy50;
    this.setState({ filterBy50: OUTPUT });
  }
  resetFilters() {
    let filters = this.state.filters;
    filters.forEach(item => item.active = true);
    this.setState({ filters: filters });
  }
  setTimestamp(iTimestamp) {
    // Passing as a callback so the data fetched after the state has changed.
    this.setState({ timestamp: iTimestamp }, () => this.fetchData());
  }

  // Ajax
  fetchData() {
    // Get props and states.
    const SERVER = this.props.server;
    const ACCOUNT_ID = this.props.accountID;

    const CURRENT_PAGE = this.state.pages.filter(x => x.active === true).map(x => x.label)[0];
    const TIMESTAMP = this.state.timestamp;

    const TEMP_FILTERS = this.state.filters.filter(x => x.active === true).map(x => x.id);
    const FILTERS = '&' + TEMP_FILTERS.join('&');

    // Obtain the type of request.
    let type;
    switch (CURRENT_PAGE) {
      case 'Profile':
        type = 'profile';
        this.setState({ profile: null });
        break;
      case 'Vehicles':
        type = 'vehicles';
        this.setState({ vehicles: null });
        break;
      case 'Time Series':
        type = 'time_series';
        this.setState({ timeSeries: null });
        break;
      case 'Session Tracker':
        type = 'session_tracker';
        this.setState({ sessionTracker: null });
        break;
      case 'WN8 Estimates':
        type = 'wn8_estimates';
        this.setState({ wn8Estimates: null });
        break;
    }

    // Assembling the url.
    let url = '/api/' + type + '/' + SERVER + '/' + ACCOUNT_ID + '/' + TIMESTAMP + '/' + FILTERS + '/';

    // Fetching.
    this.setState({ loading: true });
    fetch(url).then(response => {
      return response.json();
    }).then(j => {
      this.setState({ loading: false });
      const RESULT = j.data;
      switch (CURRENT_PAGE) {
        case 'Profile':
          this.setState({ profile: RESULT });
          break;
        case 'Vehicles':
          this.setState({ vehicles: RESULT });
          break;
        case 'Time Series':
          this.setState({ timeSeries: RESULT });
          break;
        case 'Session Tracker':
          this.setState({ sessionTracker: RESULT });
          break;
        case 'WN8 Estimates':
          this.setState({ wn8Estimates: RESULT });
          break;
        default:
          break;
      }
    }).catch(error => {
      this.setState({ loading: false });
      alert('There has been a problem with your fetch operation: ' + error.message);
    });
  }

  // Controls
  genFilters(sType) {
    // sType is either 'class' or 'tiers'

    const ITEMS = this.state.filters.filter(item => item.type == sType);

    let list = [];
    ITEMS.forEach(item => {
      let className = 'button is-small is-light is-fullwidth';
      if (item.active === true) {
        className += ' is-active';
      }
      list.push(React.createElement(
        'div',
        { className: 'column', key: item.id },
        React.createElement(
          'a',
          { className: className,
            onClick: () => this.switchFilter(item.id) },
          item.label
        )
      ));
    });

    return React.createElement(
      'div',
      { className: 'columns is-gapless is-mobile is-multiline is-marginless' },
      list
    );
  }
  genSelectors() {

    const ITEMS = this.state.selectors;

    function isActive(bool) {
      if (bool) {
        return 'button is-small is-light is-fullwidth is-active';
      } else {
        return 'button is-small is-light is-fullwidth';
      }
    }

    let list = [];
    for (let x = 0; x < ITEMS.length; x += 3) {
      list.push(React.createElement(
        'div',
        { className: 'column', key: ITEMS[x].id },
        React.createElement(
          'a',
          { className: isActive(ITEMS[x].active),
            onClick: () => this.switchSelector(ITEMS[x].id) },
          ITEMS[x].label
        ),
        React.createElement(
          'a',
          { className: isActive(ITEMS[x + 1].active),
            onClick: () => this.switchSelector(ITEMS[x + 1].id) },
          ITEMS[x + 1].label
        ),
        React.createElement(
          'a',
          { className: isActive(ITEMS[x + 2].active),
            onClick: () => this.switchSelector(ITEMS[x + 2].id) },
          ITEMS[x + 2].label
        )
      ));
    }

    return React.createElement(
      'div',
      { className: 'columns is-gapless is-mobile is-multiline' },
      list
    );
  }
  genResetButton() {
    return React.createElement(
      'div',
      { className: 'field' },
      React.createElement(
        'a',
        { className: 'button is-warning is-small is-fullwidth',
          onClick: this.resetFilters },
        'Reset Filters'
      )
    );
  }
  genFilterBy50() {

    let className = 'button is-light is-small is-fullwidth';
    if (this.state.filterBy50 === true) className += ' is-active';

    return React.createElement(
      'div',
      { className: 'field' },
      React.createElement(
        'a',
        { className: className,
          onClick: this.switchFilterBy50 },
        'Filter by at least 50 battles'
      )
    );
  }
  genRefreshButton() {
    let className = 'button is-primary is-fullwidth';
    if (this.state.loading) {
      className += ' is-loading';
    }

    return React.createElement(
      'div',
      { className: 'level' },
      React.createElement(
        'a',
        { className: className, onClick: this.fetchData },
        'Refresh'
      )
    );
  }
  genSnapshots() {

    // Return nothing if property doesnt exist.
    if (!this.state.sessionTracker) {
      return null;
    }

    const SNAPSHOTS = this.state.sessionTracker.snapshots;

    // In case there are 0 snapshots.
    if (SNAPSHOTS.length === 0) {
      return React.createElement(
        'div',
        { className: 'column' },
        React.createElement(
          'div',
          { className: 'notification' },
          'There are currently no snapshots available for comparison, but your today\'s data is saved. Come back tomorrow to see how your recent performace compares to your all-time stats in the tanks that you played.'
        )
      );
    }

    let output = [];
    SNAPSHOTS.forEach(timestamp => {
      const DAYS_AGO = Math.round((Date.now() / 1000 - timestamp) / 60 / 60 / 24);

      output.push(React.createElement(
        'div',
        { className: 'column', key: timestamp },
        React.createElement(
          'p',
          { className: 'control' },
          React.createElement(
            'a',
            { className: 'button is-light is-fullwidth', onClick: () => this.setTimestamp(timestamp) },
            DAYS_AGO + ' days ago'
          )
        )
      ));
    });

    return React.createElement(
      'div',
      { className: 'columns is-mobile is-multiline' },
      output
    );
  }

  render() {

    let body;
    const CURRENT_PAGE = this.state.pages.filter(x => x.active === true).map(x => x.label)[0];

    // Choosing body.
    switch (CURRENT_PAGE) {
      case 'Profile':
        body = React.createElement(Profile, { data: this.state.profile,
          tabs: this.state.tabs,
          fetchData: this.fetchData });
        break;
      case 'Vehicles':
        body = React.createElement(Vehicles, { data: this.state.vehicles,
          filters: this.state.filters,
          selectors: this.state.selectors,
          filterBy50: this.state.filterBy50,
          fetchData: this.fetchData });
        break;
      case 'Time Series':
        body = React.createElement(TimeSeries, { data: this.state.timeSeries,
          tabs: this.state.tabs,
          fetchData: this.fetchData });
        break;
      case 'Session Tracker':
        body = React.createElement(SessionTracker, { data: this.state.sessionTracker,
          fetchData: this.fetchData });
        break;
      case 'WN8 Estimates':
        body = React.createElement(Estimates, { data: this.state.wn8Estimates,
          tabs: this.state.tabs,
          filters: this.state.filters,
          fetchData: this.fetchData });
        break;
      case 'About':
        body = React.createElement(About, null);
        break;
      default:
        body = React.createElement(
          'div',
          null,
          'Error: page doesn\'t exist'
        );
        break;
    }

    // Choosing controls.
    let controls;
    switch (CURRENT_PAGE) {
      case 'Profile':
      case 'Time Series':
      case 'WN8 Estimates':
        controls = React.createElement(
          'div',
          { className: 'container', style: { marginTop: 15 + 'px', marginBottom: 15 + 'px' } },
          this.genFilters('tiers'),
          this.genFilters('class'),
          this.genResetButton(),
          this.genRefreshButton()
        );
        break;
      case 'Vehicles':
        controls = React.createElement(
          'div',
          { className: 'container', style: { marginTop: 15 + 'px', marginBottom: 15 + 'px' } },
          this.genSelectors(),
          this.genFilters('tiers'),
          this.genFilters('class'),
          this.genFilterBy50(),
          this.genRefreshButton()
        );
        break;
      case 'Session Tracker':
        controls = React.createElement(
          'div',
          { className: 'container', style: { marginTop: 15 + 'px', marginBottom: 15 + 'px' } },
          this.genSnapshots(),
          this.genRefreshButton()
        );
        break;
    }

    return React.createElement(
      'div',
      null,
      React.createElement(Hero, { pages: this.state.pages,
        nickname: this.props.nickname,
        switchPage: this.switchPage,
        updateRootInfo: this.props.updateRootInfo }),
      React.createElement(Nav, { tabs: this.state.tabs,
        switchTab: this.switchTab }),
      controls,
      body
    );
  }
}

// Page components.
class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.getArrowTag = this.getArrowTag.bind(this);
    this.getWn8Color = this.getWn8Color.bind(this);
  }

  componentDidMount() {
    if (!this.props.data) this.props.fetchData();
  }

  // Functions.
  getArrowTag(recentNumber, alltimeNumber) {
    if (recentNumber > alltimeNumber) {
      //Arrow up.
      return React.createElement(
        'p',
        { className: 'title', style: { color: '#89b891' } },
        ' \u25B2 '
      );
    } else if (recentNumber < alltimeNumber) {
      // Arrow down.
      return React.createElement(
        'p',
        { className: 'title', style: { color: '#c28080' } },
        ' \u25BC '
      );
    } else {
      // Arrow straight.
      return React.createElement(
        'p',
        { className: 'title', style: { color: 'BLACK' } },
        ' \u25B6 '
      );
    }
  }
  getWn8Color(wn8Score) {

    let color = 'BLACK';

    const SCALE = [[-999, 299, 'DARKRED'], [300, 449, 'ORANGERED'], [450, 649, 'DARKORANGE'], [650, 899, 'GOLD'], [900, 1199, 'YELLOWGREEN'], [1200, 1599, 'LIME'], [1600, 1999, 'DEEPSKYBLUE'], [2000, 2449, 'DODGERBLUE'], [2450, 2899, 'MEDIUMSLATEBLUE'], [2900, 99999, 'REBECCAPURPLE']];

    for (let item of SCALE) {
      if (wn8Score >= item[0] && wn8Score <= item[1]) {
        color = item[2];
        break;
      }
    }

    return color;
  }

  // Tabs.
  dashboard() {
    return React.createElement(
      'div',
      { className: 'container' },
      this.level(),
      this.panels()
    );
  }
  inDetail() {

    const DATA = this.props.data;
    const TABLE_DATA = [{ label: 'Win Rate', attr: 'wr', addon: ' %' }, { label: 'WN8', attr: 'wn8', addon: '' }, { label: 'Total Percentile', attr: 'total_perc', addon: ' %' }, { label: 'Accuracy', attr: 'acc', addon: ' %' }, { label: 'Damage Caused', attr: 'dmgc', addon: '' }, { label: 'Radio Assist', attr: 'rass', addon: '' }, { label: 'Damage Received', attr: 'dmgr', addon: '' }, { label: 'Kills / Deaths', attr: 'k_d', addon: '' }, { label: 'Damage Caused / Received', attr: 'dmgc_dmgr', addon: '' }];

    let tbody = [];

    TABLE_DATA.forEach(item => {

      const RECENT = DATA.recent[item.attr];
      const ALL_TIME = DATA.all_time[item.attr];

      tbody.push(React.createElement(
        'tr',
        { key: item.attr },
        React.createElement(
          'td',
          null,
          this.getArrowTag(RECENT, ALL_TIME)
        ),
        React.createElement(
          'td',
          null,
          item.label
        ),
        React.createElement(
          'td',
          null,
          ALL_TIME + item.addon
        ),
        React.createElement(
          'td',
          null,
          RECENT + item.addon
        )
      ));
    });

    return React.createElement(
      'div',
      { className: 'container' },
      React.createElement(
        'div',
        { className: 'tile is-ancestor' },
        React.createElement(
          'div',
          { className: 'tile is-parent is-6' },
          React.createElement(
            'div',
            { className: 'tile is-child box is-12' },
            React.createElement(RadarChart, { data: this.props.data })
          )
        ),
        React.createElement(
          'div',
          { className: 'tile is-parent is-6' },
          React.createElement(
            'div',
            { className: 'tile is-child box is-12' },
            React.createElement(
              'table',
              { className: 'table' },
              React.createElement(
                'thead',
                null,
                React.createElement(
                  'tr',
                  null,
                  React.createElement('td', null),
                  React.createElement('td', null),
                  React.createElement(
                    'td',
                    null,
                    'All time'
                  ),
                  React.createElement(
                    'td',
                    null,
                    'Recent'
                  )
                )
              ),
              React.createElement(
                'tbody',
                null,
                tbody
              )
            )
          )
        )
      )
    );
  }

  // Elements.
  level() {

    const DATA = this.props.data;

    const WR_SCORE = DATA.all_time.wr;
    const WN8_SCORE = DATA.all_time.wn8;
    const PERC_SCORE = DATA.all_time.total_perc;

    const WR_TAG = this.getArrowTag(DATA.recent.wr, DATA.all_time.wr);
    const WN8_TAG = this.getArrowTag(DATA.recent.wn8, DATA.all_time.wn8);
    const PERC_TAG = this.getArrowTag(DATA.recent.total_perc, DATA.all_time.total_perc);

    return React.createElement(
      'nav',
      { className: 'level is-mobile' },
      React.createElement(
        'div',
        { className: 'level-item has-text-centered' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'p',
            { className: 'heading' },
            'WINRATE'
          ),
          React.createElement(
            'p',
            { className: 'title' },
            WR_SCORE + ' % '
          ),
          WR_TAG
        )
      ),
      React.createElement(
        'div',
        { className: 'level-item has-text-centered' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'p',
            { className: 'heading' },
            'WN8'
          ),
          React.createElement(
            'p',
            { className: 'title' },
            WN8_SCORE + ' ',
            React.createElement(
              'span',
              { style: { color: this.getWn8Color(WN8_SCORE) } },
              '\u2605'
            )
          ),
          WN8_TAG
        )
      ),
      React.createElement(
        'div',
        { className: 'level-item has-text-centered' },
        React.createElement(
          'div',
          null,
          React.createElement(
            'p',
            { className: 'heading' },
            'PERCENTILE'
          ),
          React.createElement(
            'p',
            { className: 'title' },
            PERC_SCORE + ' % '
          ),
          PERC_TAG
        )
      )
    );
  }
  panels() {
    return React.createElement(
      'div',
      { className: 'columns' },
      React.createElement(
        'div',
        { className: 'column is-6' },
        React.createElement(
          'nav',
          { className: 'panel' },
          React.createElement(
            'p',
            { className: 'panel-heading has-text-centered' },
            'WN8'
          ),
          React.createElement(
            'div',
            { className: 'panel-block' },
            React.createElement(Wn8LineChart, { data: this.props.data })
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'column is-6' },
        React.createElement(
          'nav',
          { className: 'panel' },
          React.createElement(
            'p',
            { className: 'panel-heading has-text-centered' },
            'Total Percentile'
          ),
          React.createElement(
            'div',
            { className: 'panel-block' },
            React.createElement(PercLineChart, { data: this.props.data })
          )
        )
      )
    );
  }

  render() {
    const CURRENT_TAB = this.props.tabs.filter(x => x.active).map(x => x.label)[0];

    if (!this.props.data) return null;
    if (CURRENT_TAB == 'Dashboard') return this.dashboard();
    if (CURRENT_TAB == 'In-Detail') return this.inDetail();
    return React.createElement(
      'div',
      null,
      'Error: tab doesn\'t exist'
    );
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

  // Returns sorted array based on header id, includes header ids as the first row.
  makeSortedArray() {

    const SORTING_COLUMN = this.state.sortingColumn;

    // Getting active selectors.
    const ACTIVE_SELECTORS = this.props.selectors.filter(x => x.active).map(x => x.id);
    const HEADER_IDS = ['name'].concat(ACTIVE_SELECTORS);

    // Filters.
    const ALLOWED_TIERS = this.props.filters.filter(x => x.active && x.type == 'tiers').map(x => parseInt(x.id));
    const ALLOWED_CLASSES = this.props.filters.filter(x => x.active && x.type == 'class').map(x => x.id);
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
      ACTIVE_SELECTORS.forEach(cellName => {
        row.push(tank[cellName]);
      });

      unsortedArray.push(row);
    }

    // Looking for column to sort based on header id.
    let sortIndex = 0;
    for (let h = 0; h < HEADER_IDS.length; h++) {
      if (HEADER_IDS[h] == SORTING_COLUMN) {
        sortIndex = h;
        break;
      }
    }

    // Sorting.
    let sortedArray = unsortedArray.sort(function (a, b) {
      return b[sortIndex] - a[sortIndex];
    });

    return [HEADER_IDS].concat(sortedArray);
  }

  getHeaderName(sHeaderID) {

    const HEADERS_DICT = {
      "name": "Tank",

      "wr": "WinRate",
      "battles": "Battles",
      "wn8": "WN8",

      "avg_dmg": "Avg DMG",
      "avg_frags": "Avg Frags",
      "avg_exp": "Avg EXP",

      "avg_dpm": "Avg DPM",
      "avg_fpm": "Avg FPM",
      "avg_epm": "Avg EPM",

      "dmg_perc": "DMG Perc",
      "wr_perc": "WR Perc",
      "exp_perc": "EXP Perc",

      "pen_hits_ratio": "Penned",
      "bounced_hits_ratio": "Bounced",
      "survived": "Survived",

      "total_time_m": "Total Lifetime",
      "avg_lifetime_s": "Avg Lifetime",
      "last_time": "Last Battle"
    };

    return HEADERS_DICT[sHeaderID];
  }

  formatCell(fValue, sHeaderID) {

    const MONTHS_DICT = {
      "1": "Jan",
      "2": "Feb",
      "3": "Mar",
      "4": "Apr",

      "5": "May",
      "6": "Jun",
      "7": "Jul",

      "8": "Aug",
      "9": "Sep",
      "10": "Oct",

      "11": "Nov",
      "12": "Dec"
    };

    let output;
    switch (sHeaderID) {
      // Percent with two decimals.
      case 'wr':
        output = Math.round(fValue * 100) / 100 + " %";
        return output;
      case 'pen_hits_ratio':
      case 'bounced_hits_ratio':
      case 'survived':
        output = Math.round(fValue * 1000) / 10 + " %";
        return output;
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
        return Math.round(fValue);
      // Float with two decimals.
      case 'avg_frags':
      case 'avg_fpm':
        return Math.round(fValue * 100) / 100;
      // Minutes.
      case 'total_time_m':
        return Math.round(fValue) + 'm';
      // Minutes and seconds.
      case 'avg_lifetime_s':
        let minutes = parseInt(fValue / 60);
        let seconds = parseInt(fValue - minutes * 60);
        output = minutes + 'm ' + seconds + 's';
        return output;
      // Last battle time.
      case 'last_time':
        let time = new Date(fValue * 1000);
        output = MONTHS_DICT[String(time.getMonth() + 1)] + ' ' + String(time.getDate());
        return output;
      // Default.
      default:
        return fValue;
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
      thead.push(React.createElement(
        'th',
        { key: 'header' + header },
        React.createElement(
          'a',
          { onClick: () => this.setState({ sortingColumn: header }) },
          this.getHeaderName(header)
        )
      ));
      tfoot.push(React.createElement(
        'th',
        { key: 'footer' + header },
        this.getHeaderName(header)
      ));
    }

    // Table body.
    let tbody = [];
    for (let r = 0; r < ROWS.length; r++) {
      let row = ROWS[r];
      let tempRow = [];

      for (let c = 0; c < row.length; c++) {
        tempRow.push(React.createElement(
          'td',
          { key: c },
          this.formatCell(row[c], HEADERS[c])
        ));
      }

      tbody.push(React.createElement(
        'tr',
        { key: r },
        tempRow
      ));
    }

    return React.createElement(
      'div',
      { className: 'container' },
      React.createElement(
        'table',
        { className: 'table is-bordered is-narrow is-striped' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            thead
          )
        ),
        React.createElement(
          'tbody',
          null,
          tbody
        ),
        React.createElement(
          'tfoot',
          null,
          React.createElement(
            'tr',
            null,
            tfoot
          )
        )
      )
    );
  }

  render() {

    if (this.props.data == null) return null;

    return this.genTable();
  }
}
class TimeSeries extends React.Component {
  constructor(props) {
    super(props);
    this.startChart = this.startChart.bind(this);
    this.openPercChart = this.openPercChart.bind(this);
    this.openWn8Chart = this.openWn8Chart.bind(this);
  }

  componentDidMount() {
    if (!this.props.data) this.props.fetchData();
    this.startChart();
  }

  componentDidUpdate() {
    this.startChart();
  }

  startChart() {

    // Do nothing if no data.
    if (!this.props.data) {
      return;
    }

    const TAB = this.props.tabs.filter(x => x.active).map(x => x.label)[0];
    const DATA = this.props.data;

    // If both previous properties exist.
    if (this.previousData && this.previousTab) {
      // If both previous properties same as current.
      if (this.previousData == DATA && this.previousTab == TAB) {
        return;
      }
    }

    // (Re)Opening the chart
    if (TAB == 'Daily Percentiles') {
      this.openPercChart();
    }
    if (TAB == 'WN8') {
      this.openWn8Chart();
    }

    // Updateting previous properties.
    this.previousData = DATA;
    this.previousTab = TAB;
  }

  openPercChart() {
    if (this.Chart) {
      this.Chart.destroy();
    }
    let ctx = this.refs.ChartCanvas;

    const DATA = this.props.data;
    const ACC = DATA.percentiles_change.map(x => x.acc);
    const DMGC = DATA.percentiles_change.map(x => x.dmgc);
    const RASS = DATA.percentiles_change.map(x => x.rass);
    const WR = DATA.percentiles_change.map(x => x.wr);
    const DMGR = DATA.percentiles_change.map(x => x.dmgr);

    this.Chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: DATA.xlabels.slice(1),
        datasets: [{
          label: 'Accuracy',
          fill: false,
          borderColor: 'hsl(0, 25%, 63%)',
          backgroundColor: 'hsla(0, 25%, 63%, 0.2)',
          pointBorderColor: 'hsl(0, 25%, 63%)',
          pointBackgroundColor: 'hsl(0, 25%, 63%)',
          pointRadius: 4,
          pointHoverRadius: 6,
          data: ACC
        }, {
          label: 'Damage Caused',
          fill: false,
          borderColor: 'hsl(228, 25%, 63%)',
          backgroundColor: 'hsla(228, 25%, 63%, 0.2)',
          pointBorderColor: 'hsl(228, 25%, 63%)',
          pointBackgroundColor: 'hsl(228, 25%, 63%)',
          pointRadius: 4,
          pointHoverRadius: 6,
          data: DMGC
        }, {
          label: 'Radio Assist',
          fill: false,
          borderColor: 'hsl(197, 25%, 63%)',
          backgroundColor: 'hsla(197, 25%, 63%, 0.2)',
          pointBorderColor: 'hsl(197, 25%, 63%)',
          pointBackgroundColor: 'hsl(197, 25%, 63%)',
          pointRadius: 4,
          pointHoverRadius: 6,
          data: RASS
        }, {
          label: 'WinRate',
          fill: false,
          borderColor: 'hsl(127, 25%, 63%)',
          backgroundColor: 'hsla(127, 25%, 63%, 0.2)',
          pointBorderColor: 'hsl(127, 25%, 63%)',
          pointBackgroundColor: 'hsl(127, 25%, 63%)',
          pointRadius: 4,
          pointHoverRadius: 6,
          data: WR
        }, {
          label: 'Damage Received (inv)',
          fill: false,
          borderColor: 'hsl(60, 25%, 63%)',
          backgroundColor: 'hsla(60, 25%, 63%, 0.2)',
          pointBorderColor: 'hsl(60, 25%, 63%)',
          pointBackgroundColor: 'hsl(60, 25%, 63%)',
          pointRadius: 4,
          pointHoverRadius: 6,
          data: DMGR
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              callback: function (label, index, labels) {
                return label + '%';
              }
            }
          }]
        }
      }
    });
  }

  openWn8Chart() {
    if (this.Chart) {
      this.Chart.destroy();
    }
    let ctx = this.refs.ChartCanvas;

    const DATA = this.props.data;

    this.Chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: DATA.xlabels.slice(1),
        datasets: [{
          label: "WN8 Daily",
          fill: false,
          backgroundColor: "hsla(0, 35%, 63%, 0.2)",
          borderColor: "hsl(0, 35%, 63%)",
          pointBackgroundColor: "hsl(0, 35%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(0, 35%, 63%)",
          data: DATA.wn8_change
        }, {
          label: "WN8 Total",
          fill: true,
          backgroundColor: "hsla(195, 20%, 63%, 0.1)",
          borderColor: "hsl(195, 20%, 63%)",
          pointBackgroundColor: "hsl(195, 20%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(195, 20%, 63%)",
          data: DATA.wn8_totals
        }]
      }
    });
  }

  render() {

    if (!this.props.data) return null;

    return React.createElement(
      'div',
      { className: 'container' },
      React.createElement('canvas', { ref: 'ChartCanvas', width: '400', height: '150' })
    );
  }
}
class SessionTracker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTankID: 9999999
    };
    this.convertTime = this.convertTime.bind(this);
    this.miniTable = this.miniTable.bind(this);
    this.mainBody = this.mainBody.bind(this);
  }

  convertTime(seconds) {
    if (seconds >= 60) {
      const M = parseInt(seconds / 60);
      const S = parseInt(seconds - M * 60);
      return String(M) + 'm ' + String(S) + 's';
    } else {
      return String(seconds) + 's';
    }
  }

  componentDidMount() {
    if (!this.props.data) this.props.fetchData();
  }

  miniTable(oTank) {

    const tank = oTank;

    let thead = tank.tank_name + " Battles: " + tank.session.battles + "  Wins: " + tank.session.wins;

    let tableItems = [["Accuracy", tank.session.acc, tank.all.acc], ["Damage Caused", tank.session.dmgc, tank.all.dmgc], ["Radio Assist", tank.session.rass, tank.all.rass], ["Experience", tank.session.exp, tank.all.exp], ["Damage Received", tank.session.dmgr, tank.all.dmgr], ["Lifetime", tank.session.lifetime, tank.all.lifetime], ["DPM", tank.session.dpm, tank.all.dpm], ["WN8", tank.session.wn8, tank.all.wn8]];

    let tbody = [];
    tableItems.forEach(row => {
      switch (row[0]) {
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
      tbody.push(React.createElement(
        'tr',
        { key: row[0] },
        React.createElement(
          'td',
          null,
          row[0]
        ),
        React.createElement(
          'td',
          null,
          row[1]
        ),
        React.createElement(
          'td',
          null,
          row[2]
        )
      ));
    });

    return React.createElement(
      'table',
      { className: 'table' },
      React.createElement(
        'thead',
        null,
        React.createElement(
          'tr',
          null,
          React.createElement(
            'th',
            { colSpan: 3 },
            thead
          )
        ),
        React.createElement(
          'tr',
          null,
          React.createElement(
            'th',
            null,
            'Averages'
          ),
          React.createElement(
            'th',
            null,
            'Session'
          ),
          React.createElement(
            'th',
            null,
            'All time'
          )
        )
      ),
      React.createElement(
        'tbody',
        null,
        tbody
      )
    );
  }

  mainBody() {

    const TANKS = this.props.data.session_tanks;
    let selectedTank = TANKS.filter(x => x.tank_id == this.state.selectedTankID)[0];

    // If no tanks selected in the array.
    if (!selectedTank) {
      selectedTank = TANKS[0];
    }

    const SELECTED_TANK_ID = selectedTank.tank_id;

    let menu = [];
    TANKS.forEach(tank => {
      let className = '';
      if (tank.tank_id == SELECTED_TANK_ID) {
        className = 'is-active';
      }

      menu.push(React.createElement(
        'li',
        { key: tank.tank_id },
        React.createElement(
          'a',
          { className: className,
            onClick: () => this.setState({ selectedTankID: tank.tank_id }) },
          tank.tank_name
        )
      ));
    });

    return React.createElement(
      'div',
      { className: 'container' },
      React.createElement(
        'div',
        { className: 'tile is-ancestor' },
        React.createElement(
          'div',
          { className: 'tile is-parent is-2' },
          React.createElement(
            'div',
            { className: 'tile is-child box' },
            React.createElement(
              'aside',
              { className: 'menu' },
              React.createElement(
                'p',
                { className: 'menu-label' },
                'Tanks'
              ),
              React.createElement(
                'ul',
                { className: 'menu-list' },
                menu
              )
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'tile is-parent is-5' },
          React.createElement(
            'div',
            { className: 'tile is-child box is-12' },
            React.createElement(STRadarChart, { all_time: selectedTank.all.radar,
              recent: selectedTank.session.radar })
          )
        ),
        React.createElement(
          'div',
          { className: 'tile is-parent is-5' },
          React.createElement(
            'div',
            { className: 'tile is-child box is-12' },
            this.miniTable(selectedTank)
          )
        )
      )
    );
  }

  render() {

    // Return nothing if no data.
    if (!this.props.data) {
      return null;
    }

    // Return nothing if property doesn't exist. (timestamp == 0).
    if (!this.props.data.hasOwnProperty('session_tanks')) {
      return null;
    }

    // Return message if array length == 0.
    if (this.props.data.session_tanks.length == 0) {
      return React.createElement(
        'div',
        { className: 'container' },
        React.createElement(
          'div',
          { className: 'notification' },
          'No tanks were played.'
        )
      );
    }

    return this.mainBody();
  }
}
class Estimates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortingColumn: 'unknown'
    };
    this.getFilteredData = this.getFilteredData.bind(this);
    this.genTargetDamageTab = this.genTargetDamageTab.bind(this);
    this.genPlayerValuesTab = this.genPlayerValuesTab.bind(this);
    this.genSortedTable = this.genSortedTable.bind(this);
  }

  componentDidMount() {
    if (!this.props.data) this.props.fetchData();
  }

  // Get data.
  getFilteredData() {

    const DATA = this.props.data;

    const ALLOWED_TIERS = this.props.filters.filter(x => x.active && x.type == 'tiers').map(x => parseInt(x.id));
    const ALLOWED_CLASSES = this.props.filters.filter(x => x.active && x.type == 'class').map(x => x.id);

    let output = [];
    for (let tank of DATA) {
      const A = ALLOWED_TIERS.includes(tank.tier);
      const B = ALLOWED_CLASSES.includes(tank.type);
      if (!A || !B) continue;
      output.push(tank);
    }
    return output;
  }
  // 1st tab.
  genTargetDamageTab() {

    const DATA = this.getFilteredData();
    const HEADERS = ["Tank", "300", "450", "650", "900", "1200", "1600", "2000", "2450", "2900", "Your Damage"];

    let output = [];
    for (let tank of DATA) {
      // Adding tank name by default.
      let row = [tank.short_name];
      // Iterating through "dmgTargets".
      tank.dmgTargets.forEach(target => row.push(target));
      // Adding player damage in the end.
      row.push(Math.round(tank.Damage));
      output.push(row);
    }
    return [HEADERS].concat(output);
  }
  // 2nd tab
  genPlayerValuesTab() {

    const DATA = this.getFilteredData();
    const HEADERS = ["Tank", "WinRate", "expWinRate", "Damage", "expDamage", "Frag", "expFrag", "Def", "expDef", "Spot", "expSpot"];
    const DATA_IDS = ["WinRate", "expWinRate", "Damage", "expDamage", "Frag", "expFrag", "Def", "expDef", "Spot", "expSpot"];

    let output = [];
    for (let tank of DATA) {
      // Adding tank name by default.
      let row = [tank.short_name];
      // Iterate through headers.
      DATA_IDS.forEach(id => row.push(Math.round(tank[id] * 100) / 100));
      // Adding to the output.
      output.push(row);
    }
    return [HEADERS].concat(output);
  }

  genSortedTable(oArray) {

    const HEADERS = oArray.slice(0, 1)[0];
    const ROWS = oArray.slice(1);

    // Looking for column to sort based on header id.
    const SORTING_COLUMN = this.state.sortingColumn;
    let sortIndex = 0;
    for (let h = 0; h < HEADERS.length; h++) {
      if (HEADERS[h] == SORTING_COLUMN) {
        sortIndex = h;
        break;
      }
    }

    // Sorting.
    const SORTED_ARRAY = ROWS.sort(function (a, b) {
      return b[sortIndex] - a[sortIndex];
    });

    // Preparing headers.
    let thead = [];
    HEADERS.forEach(header => {
      thead.push(React.createElement(
        'th',
        { key: header },
        React.createElement(
          'a',
          { onClick: () => this.setState({ sortingColumn: header }) },
          header
        )
      ));
    });

    // Preparing table body.
    let tbody = [];
    for (let r = 0; r < SORTED_ARRAY.length; r++) {
      const ROW = SORTED_ARRAY[r];
      let cells = [];

      for (let c = 0; c < ROW.length; c++) {
        const CELL = ROW[c];
        cells.push(React.createElement(
          'td',
          { key: [r, c].join('') },
          CELL
        ));
      }
      tbody.push(React.createElement(
        'tr',
        { key: r },
        cells
      ));
    }

    return React.createElement(
      'div',
      { className: 'container' },
      React.createElement(
        'table',
        { className: 'table' },
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            thead
          )
        ),
        React.createElement(
          'tbody',
          null,
          tbody
        )
      )
    );
  }

  render() {

    if (!this.props.data) {
      return null;
    }

    const CURRENT_TAB = this.props.tabs.filter(x => x.active).map(x => x.label)[0];

    let data;
    if (CURRENT_TAB == 'WN8 Target Damage') {
      data = this.genTargetDamageTab();
    }
    if (CURRENT_TAB == 'WN8 Player Values') {
      data = this.genPlayerValuesTab();
    }

    return this.genSortedTable(data);
  }
}
class About extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return React.createElement(
      'div',
      null,
      React.createElement(
        'section',
        { className: 'section' },
        React.createElement(
          'div',
          { className: 'container content' },
          React.createElement(
            'p',
            null,
            'Interested in the future of this website? Contribute to the development on ',
            React.createElement(
              'a',
              { href: 'https://github.com/IDDT/wot-console-stats' },
              'GitHub'
            )
          ),
          React.createElement(
            'p',
            null,
            'Interested in WN8 calculation algorithm?',
            React.createElement(
              'a',
              { href: 'https://github.com/IDDT/wot-console-playerbase-analysis' },
              'Here it is'
            ),
            React.createElement('br', null),
            React.createElement(
              'a',
              { href: 'https://github.com/IDDT/wot-console-playerbase-analysis/tree/master/wn8_results' },
              'WN8 comparison charts'
            ),
            React.createElement('br', null),
            React.createElement(
              'a',
              { href: 'https://github.com/IDDT/wot-console-playerbase-analysis/blob/master/data/processed/wn8console.json' },
              'WN8 values in JSON'
            )
          ),
          React.createElement(
            'p',
            null,
            'Latest percentiles and WN8 table update: 30 APR 2017'
          ),
          React.createElement(
            'p',
            null,
            'Have a question? Found a bug? Send a message to my',
            React.createElement(
              'a',
              { href: 'http://forum-console.worldoftanks.com/index.php?/user/turboparrot666-1076121407/' },
              'WoT Console forum profile'
            ),
            ' or open an issue in the respective repository.'
          )
        )
      )
    );
  }
}

// Smaller components.
class Hero extends React.Component {
  constructor(props) {
    super(props);
  }
  genHeroFoot() {

    let pages = [];
    const CURRENT_PAGE = this.props.pages.filter(x => x.active).map(x => x.label)[0];

    this.props.pages.forEach(page => {
      let isActive = '';
      if (CURRENT_PAGE == page.label) {
        isActive = 'is-active';
      }
      pages.push(React.createElement(
        'li',
        { className: isActive,
          onClick: () => this.props.switchPage(page.label),
          key: page.label },
        React.createElement(
          'a',
          null,
          page.label
        )
      ));
    });
    return React.createElement(
      'div',
      { className: 'hero-foot' },
      React.createElement(
        'nav',
        { className: 'tabs is-boxed' },
        React.createElement(
          'div',
          { className: 'container' },
          React.createElement(
            'ul',
            null,
            pages
          )
        )
      )
    );
  }
  genHeroHead() {
    return React.createElement(
      'div',
      { className: 'hero-head' },
      React.createElement(
        'header',
        { className: 'nav' },
        React.createElement(
          'div',
          { className: 'container' },
          React.createElement(
            'div',
            { className: 'nav-left' },
            React.createElement(
              'span',
              { className: 'nav-item' },
              React.createElement(
                'strong',
                null,
                this.props.nickname
              )
            )
          ),
          React.createElement(
            'div',
            { className: 'nav-right' },
            React.createElement(
              'span',
              { className: 'nav-item' },
              React.createElement(
                'a',
                { className: 'button is-primary is-inverted',
                  onClick: () => this.props.updateRootInfo({ server: null,
                    nickname: null,
                    accountID: null }) },
                'Logout'
              )
            )
          )
        )
      )
    );
  }
  render() {
    return React.createElement(
      'section',
      { className: 'hero is-primary is-bold' },
      this.genHeroHead(),
      this.genHeroFoot()
    );
  }
}
class Nav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let tabs = [];

    this.props.tabs.forEach(tab => {
      let className = 'nav-item is-tab';
      if (tab.active) {
        className += ' is-active';
      }
      tabs.push(React.createElement(
        'a',
        { className: className,
          onClick: () => this.props.switchTab(tab.label),
          key: tab.label },
        tab.label
      ));
    });

    return React.createElement(
      'nav',
      { className: 'nav has-shadow' },
      React.createElement(
        'div',
        { className: 'container' },
        React.createElement(
          'div',
          { className: 'nav-left' },
          tabs
        )
      )
    );
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
    if (this.previousData && this.props.data == this.previousData) return;

    // Assigning previous data if empty.
    if (!this.previousData) {
      this.previousData = this.props.data;
    }

    if (this.Wn8LineChart) this.Wn8LineChart.destroy();
    let ctx = this.refs.Wn8LineChart;
    const DATA = this.props.data;

    this.Wn8LineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: DATA.xlabels,
        datasets: [{
          label: 'WN8',
          fill: true,
          backgroundColor: "hsla(200, 25%, 63%, 0.1)",
          borderColor: "hsl(200, 25%, 63%)",
          pointBackgroundColor: "hsl(200, 25%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(200, 25%, 63%)",
          data: DATA.wn8_totals
        }]
      },
      options: {
        legend: {
          display: false
        },
        scales: {
          yAxes: [{
            ticks: {
              callback: function (label, index, labels) {
                return Math.round(label);
              }
            }
          }]
        }
      }
    });
  }

  render() {
    return React.createElement('canvas', { ref: 'Wn8LineChart', width: '100', height: '40' });
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
    if (this.previousData && this.props.data == this.previousData) return;

    // Assigning previous data if empty.
    if (!this.previousData) {
      this.previousData = this.props.data;
    }

    if (this.PercLineChart) this.PercLineChart.destroy();
    let ctx = this.refs.PercLineChart;
    const DATA = this.props.data;

    this.PercLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: DATA.xlabels,
        datasets: [{
          label: 'Total Percentile',
          fill: true,
          backgroundColor: "hsla(130, 25%, 63%, 0.1)",
          borderColor: "hsl(130, 25%, 63%)",
          pointBackgroundColor: "hsl(130, 25%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(130, 25%, 63%)",
          data: DATA.percentiles_totals
        }]
      },
      options: {
        legend: {
          display: false
        },
        scales: {
          yAxes: [{
            ticks: {
              callback: function (label, index, labels) {
                return Math.round(label * 100) / 100;
              }
            }
          }]
        }
      }
    });
  }

  render() {
    return React.createElement('canvas', { ref: 'PercLineChart', width: '100', height: '40' });
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
    if (this.previousData && this.props.data == this.previousData) return;
    // Assigning previous data if empty.
    if (!this.previousData) {
      this.previousData = this.props.data;
    }

    if (this.RadChart) this.RadChart.destroy();
    let ctx = this.refs.RadarChart;
    const DATA = this.props.data;

    this.RadChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Accuracy', 'Damage Caused', 'Radio Assist', 'WinRate', 'Damage Received (inv)'],
        datasets: [{
          label: 'Recent Percentiles',
          fill: true,
          backgroundColor: "hsla(0, 35%, 63%, 0.2)",
          borderColor: "hsl(0, 35%, 63%)",
          pointBackgroundColor: "hsl(0, 35%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(0, 35%, 63%)",
          data: [DATA.recent.percentiles.acc, DATA.recent.percentiles.dmgc, DATA.recent.percentiles.rass, DATA.recent.percentiles.wr, DATA.recent.percentiles.dmgr]
        }, {
          label: 'All Time Percentiles',
          fill: true,
          backgroundColor: "hsla(200, 25%, 63%, 0.1)",
          borderColor: "hsl(200, 25%, 63%)",
          pointBackgroundColor: "hsl(200, 25%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(200, 25%, 63%)",
          data: [DATA.all_time.percentiles.acc, DATA.all_time.percentiles.dmgc, DATA.all_time.percentiles.rass, DATA.all_time.percentiles.wr, DATA.all_time.percentiles.dmgr]
        }]
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
    return React.createElement('canvas', { ref: 'RadarChart', width: '100', height: '70' });
  }
}

// Session Tracker (basic)
class STRadarChart extends React.Component {
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
    const ALL_TIME = this.props.all_time;
    const RECENT = this.props.recent;

    if (this.RadChart) this.RadChart.destroy();
    let ctx = this.refs.STRadarChartCanvas;
    const DATA = this.props.data;

    this.RadChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Accuracy', 'Damage Caused', 'Radio Assist', 'Experience', 'Damage Received (inv)'],
        datasets: [{
          label: 'Selected period',
          fill: true,
          backgroundColor: "hsla(0, 35%, 63%, 0.2)",
          borderColor: "hsl(0, 35%, 63%)",
          pointBackgroundColor: "hsl(0, 35%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(0, 35%, 63%)",
          data: RECENT
        }, {
          label: 'All time',
          fill: true,
          backgroundColor: "hsla(200, 25%, 63%, 0.1)",
          borderColor: "hsl(200, 25%, 63%)",
          pointBackgroundColor: "hsl(200, 25%, 63%)",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: "hsl(200, 25%, 63%)",
          data: ALL_TIME
        }]
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
    return React.createElement('canvas', { ref: 'STRadarChartCanvas', width: '100', height: '100' });
  }
}

ReactDOM.render(React.createElement(
  'div',
  null,
  React.createElement(App, null)
), document.getElementById('root'));
