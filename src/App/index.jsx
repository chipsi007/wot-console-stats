import React from 'react';


import PageLogin from './PageLogin';
import Main from './Main';


// Contains root state of the app.


export default class App extends React.Component {
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
      return(<PageLogin updateRootInfo={ this.updateRootInfo } />);
    }

    return(
      <Main
        nickname={ this.state.nickname }
        accountID={ this.state.accountID }
        server={ this.state.server }
        updateRootInfo={ this.updateRootInfo }
      />
    );
  }
}
