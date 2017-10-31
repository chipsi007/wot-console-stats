import React from 'react';


export default class Hero extends React.Component {
  //this.state.pages
  //this.props.nickname
  //this.switchPage
  //this.props.updateRootInfo
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
      pages.push(
        <li 
          className={ isActive }
          onClick={ () => this.props.switchPage(page.label) }
          key={ page.label }
        >
          <a>
            <span className='icon'><i className={ page.iconClass }></i></span>
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