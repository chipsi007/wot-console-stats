import React from 'react';


// Input field with dropdown.


export default class InputDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false
    };
    this.activate = this.activate.bind(this);
    this.deactivate = this.deactivate.bind(this);
  }
  
  
  activate() {
    this.setState({active: true});
  }
  
  
  deactivate() {
    this.setState({active: false});
  }
  
  
  render() {
    return(
      <div className={ 'dropdown' + ((this.state.active) ? ' is-active' : '') }>
        <div className="dropdown-trigger">
          <div className="field has-addons">
            <p className="control has-icons-left">
              <input className="input" 
                type="text" 
                placeholder="Text input" 
                onBlur={ this.deactivate } 
                onFocus={ this.activate } />
              <span className="icon is-small is-left">
                <i className="fa fa-search"></i>
              </span>
            </p>
            <p className="control">
              <a className="button">
                <span className="icon">
                  <i className="fa fa-times"></i>
                </span>
              </a>
            </p>
          </div>
        </div>
        
        <div className="dropdown-menu" id="dropdown-menu" role="menu">
          <div className="dropdown-content">
            <a href="#" className="dropdown-item">
              Dropdown item
            </a>
            <a className="dropdown-item">
              Other dropdown item
            </a>
            <a href="#" className="dropdown-item is-active">
              Active dropdown item
            </a>
            <a href="#" className="dropdown-item">
              Other dropdown item
            </a>
            <hr className="dropdown-divider" />
            <a href="#" className="dropdown-item">
              Remove all
            </a>
          </div>
        </div>
      </div>
    );
  }
}
