import React from 'react';


// Login page.


export default class PageLogin extends React.Component {
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
    // Getting local storage info before mount.
    
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
    // Update local storage values.
    
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
    // Remove everything from local storage.
    
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
  
  
  /* render */
  
  
  warningMsg() {
    if (!this.state.warningMsg) { return }
    return( <p className='help is-danger has-text-centered'>
      {this.state.warningMsg}
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
          <span>{this.state.nickname}</span>
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
    return(
      <div className={ 'modal' + (this.state.openAbout ? ' is-active' : '') }>
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
                  rel="noopener noreferrer"
                  href='https://github.com/IDDT/wot-console-stats/commits/master'>
                  Changelog
                </a>
              </p>
              <p className='control'>
                <a className='button is-info is-outlined is-fullwidth'
                  target='_blank'
                  rel="noopener noreferrer"
                  href='http://forum-console.worldoftanks.com/index.php?/user/turboparrot666-1076121407/'>
                  Suggest things here
                </a>
              </p>
              <p className='control'>
                <a className='button is-info is-outlined is-fullwidth'
                  target='_blank'
                  rel="noopener noreferrer"
                  href='https://github.com/IDDT/wot-console-wn8'>
                  WN8 / percentiles calculation algorithm.
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    );
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
                        
                {this.warningMsg()}

              </div>
            </article>
                    
            {this.about()}

          </div>
        </div>
      </div>
    </section>);
  }
}
