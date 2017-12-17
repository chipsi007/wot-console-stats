import React from 'react';


export default class Hero extends React.Component {
  //this.props.pages
  //this.props.nickname
  //this.props.switchPage
  //this.props.updateRootInfo
  constructor(props) {
    super(props);
    this.state = {
      menuVisible: false 
    };
    this.logout = this.logout.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
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

  
  toggleMenu() {
    this.setState({menuVisible: !this.state.menuVisible});
  }
  
  
  /* render */
  
  
  genHeroFoot() {

    let pages = [];
    const CURRENT_PAGE = this.props.pages.filter((x) => x.active).map((x) => x.label)[0];

    this.props.pages.forEach((page) => {
      pages.push(
        <li className={ (CURRENT_PAGE == page.label) ? 'is-active' : '' }
          onClick={ () => this.props.switchPage(page.label) }
          key={ page.label }>
          <a>
            <span className='icon'>
              <i className={ page.iconClass }></i>
            </span>
            <span>{page.label}</span>
          </a>
        </li>
      );
    });
    
    return(
      <div className='hero-foot'>
        <nav className='tabs is-boxed'>
          <div className='container'>
            <ul>
              {pages}
            </ul>
          </div>
        </nav>
      </div>
    );
  }
  
  
  genHeroHead() {
    return(
      <div className='hero-head'>
        <nav className='navbar'>
          <div className='container'>

            <div className='navbar-brand'>
              <div className='navbar-item'>
                <strong>
                  WoT Console Stats
                </strong>
              </div>
              
              <div className={ 'navbar-burger burger' + ((this.state.menuVisible) ? ' is-active' : '') }
                onClick={ this.toggleMenu }>
                <span></span>
                <span></span>
                <span></span>
              </div>
              
            </div>

            <div className={ 'navbar-menu' + ((this.state.menuVisible) ? ' is-active' : '') }>
              <div className='navbar-end'>
                
                <div className='navbar-item'>
                  <div className='field is-grouped is-grouped-right'>
                    
                    <p className='control'>
                      <span className='button is-primary' disabled>
                        <span className='icon'>
                          <i className='fa fa-user'></i>
                        </span>
                        <span>
                          <strong>{this.props.nickname}</strong>
                        </span>
                      </span>
                    </p>
                    
                    <p className='control'>
                      <a className='button is-primary' onClick={ this.logout }>
                        <span className='icon'>
                          <i className='fa fa-sign-out'></i>
                        </span>
                        <span>Logout</span>
                      </a>
                    </p>
                  </div>
                </div>
                
              </div>
            </div>

          </div>
        </nav>
      </div>
    );
  }

  
  render() {
    return(
      <section className='hero is-primary'>
        {this.genHeroHead()}
        {this.genHeroFoot()}
      </section>
    );
  }
}