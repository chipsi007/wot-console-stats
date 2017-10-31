import React from 'react';


export default class Nav extends React.Component {
  //this.state.tabs
  //this.switchTab
  constructor(props) {
    super(props);
  }

  
  render() {

    let tabs = [];

    this.props.tabs.forEach((tab) => {
      tabs.push(
        <a
          className={ 'nav-item is-tab' + ((tab.active) ? ' is-active' : '') }
          onClick={ () => this.props.switchTab(tab.label) }
          key={ tab.label }
        >
          {tab.label}
        </a>
      );
    });

    return( <nav className='nav has-shadow'>
      <div className='container'>
        <div className='nav-left'>
          {tabs}
        </div>
      </div>
    </nav>);
  }
}