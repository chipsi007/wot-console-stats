import React from 'react';


// Login page.


export default class PageLogin extends React.Component {
  //this.props.updateRootInfo
  constructor(props) {
    super(props);
    this.state = {
      errorMsg: null,
      loading: false,
      infoPresent: false,
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
        infoPresent: true,
        nickname: NICKNAME,
        server: SERVER
      }, this.fetchAccountInfo);
    }
  }
  
  
  componentDidMount() {
    // Google Analytics tracking.
    if (typeof(ga) == 'function') {
      ga('set', 'page', 'Login');
      ga('send', 'pageview');
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

    
    // If new user, getting variables from refs.
    let nickname, server;
    if (this.state.infoPresent) {
      nickname = this.state.nickname;
      server = this.state.server;
    } else {
      nickname = this.refnickname.value;
      server = this.refserver.value;
    }
    
    
    // Validation.
    if (nickname === '') {
      this.setState({errorMsg: 'Please enter your playername'});
      return;
    }
    
    
    // Start loading after validation.
    this.setState({loading: true});
    
    
    const URL = `https://api-${server}-console.worldoftanks.com/wotx/account/list/?application_id=demo&search=${nickname}`;


    fetch(URL)
      .then(response => { return response.json() })
      .then(j => {
      
        // Everythyng's OK.
        if ((j.status == 'ok') && (j.meta.count > 0)) {
          const OBJ = {
            nickname: j.data[0].nickname,
            accountID: j.data[0].account_id,
            server: server
          };
          this.updateLocalStorage(OBJ.nickname, OBJ.server);
          this.props.updateRootInfo(OBJ);
          
        // Not ok.
        } else {
          let errorMsg = null;
          // No players found.
          if ((j.status == 'ok') && (j.meta.count === 0)) { errorMsg = 'The player was not found' }
          // Error from WGAPI.
          if (j.status == 'error') { errorMsg = j.error.message }
          this.setState({
            errorMsg: errorMsg,
            loading: false
          });
        }
      
      })
      .catch(error => {

        this.setState({
          errorMsg: 'Failed to contact Wargaming API services. Error message: ' + error.message,
          infoPresent: false,
          loading: false
        });
      
        this.clearLocalStorage();
      
      });
  }
  
  
  /* render */
  
  
  fullscreenLoading() {
    return(<div className='pageloader is-active'></div>);
  }
  
  
  errorMsg() {
    
    if (!this.state.errorMsg) { return }
    
    return( 
      <div className='field'>
        <div className='control'>
          <p className='help is-danger has-text-centered'>
            {this.state.errorMsg}
          </p>
        </div>
      </div>
    );
  }

  
  render() {
    
    if (this.state.nickname && this.state.server && this.state.infoPresent) {
      return(this.fullscreenLoading());
    }
    
    return(
      <section className='hero is-fullheight is-light'>
        <div className='hero-body'>
          <div className='container has-text-centered'>
            <div className='column is-4 is-offset-4'>
              <div className='box'>
                <h4 className='title has-text-grey'>WoT Console Stats</h4>
                
                { this.errorMsg() }
                
                <div className='field'>
                  <div className='control'>
                    <input className='input is-medium' 
                      type='text' 
                      placeholder='Your Playername' 
                      ref={ (x) => this.refnickname = x } />
                  </div>
                </div>
                <div className='field'>
                  <div className='control'>
                    <div className='select is-primary is-medium is-fullwidth has-text-centered'>
                      <select ref={ (x) => this.refserver = x }>
                        <option value='xbox'>XBOX</option>
                        <option value='ps4'>PLAYSTATION</option>
                      </select>
                    </div>
                  </div>
                </div>
                <a className={ 'button is-fullwidth is-primary is-medium' + ((this.state.loading) ? ' is-loading' : '') }
                  onClick={ this.fetchAccountInfo }>
                  Login
                </a>
              </div>
              
              <p className='has-text-grey'>
                <a href='https://github.com/IDDT/wot-console-stats'
                  target='_blank'
                  rel='noopener noreferrer'>
                  Open Source
                </a>
                  &nbsp;·&nbsp;
                <a href='https://github.com/IDDT/wot-console-wn8'
                  target='_blank'
                  rel='noopener noreferrer'>
                  WN8
                </a>
                  &nbsp;·&nbsp;
                <a href='http://forum-console.worldoftanks.com/index.php?/user/turboparrot666-1076121407/'
                  target='_blank'
                  rel='noopener noreferrer'>
                  Send Feedback
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
