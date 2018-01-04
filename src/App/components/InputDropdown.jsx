import React from 'react';


// Input field with dropdown.


export default class InputDropdown extends React.Component {
  // this.props.data - [{'id': some_id, 'label': actual text}, ...]
  // this.props.activeID - id of the active item.
  // this.props.funcActivateID - function that accepts id as first positional argument.
  // this.props.functDeactivate - function that deactivates whatever is selected.
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      active: false
    };
  }
  
  
  dropdownDivider() {
    return (<hr className='dropdown-divider' />);
  }
  
  
  clearDropdownItem() {
    return (
      <a className='dropdown-item'
        onMouseDown={ () => { this.props.funcDeactivate(); this.refinput.value = ''; }}>
        Clear
      </a>
    );
  }
  
  
  getDropdownItems() {
    
    let output = [];
    for (let tank of this.props.data) {
      
      // If doesnt match the text in the input.
      if (!tank.label.toLowerCase().includes(this.state.text.toLowerCase())) {
        continue;
      }
      
      output.push(
        <a className={ 'dropdown-item' + ((tank.id === this.props.activeID) ? ' is-active' : '') } 
          onMouseDown={ () => { this.props.funcActivateID(tank.id); this.refinput.value = tank.label; } }
          key={ tank.id }>
          { tank.label }
        </a>
      );
      
      // 5 items maximum in the dropdown.
      if (output.length > 4) {
        break;
      }
    }
    
    
    if (output.length > 0) { return output }
    else {
      return (
        <a className='dropdown-item'>
          No tanks available
        </a>
      );
    }   
  }
    
  
  render() {  
    return(
      <div className={ 'dropdown' + ((this.state.active) ? ' is-active' : '') }
        style={{width: '100%', marginBottom: '24px'}}>
        
        <div className='dropdown-trigger'
          style={{width: 'inherit'}}>
          <div className='field has-addons'>
            <p className='control has-icons-left is-expanded'>
              <input className='input'
                type='text'
                placeholder='Start typing to select a tank'
                onBlur={ () => this.setState({active: false}) } 
                onFocus={ () => this.setState({active: true}) }
                ref={ (x) => this.refinput = x } 
                onChange={ () => this.setState({text: this.refinput.value}) }
              />
              <span className='icon is-small is-left'>
                <i className='fa fa-search'></i>
              </span>
            </p>
            <p className='control'>
              <a className='button'
                onClick={ () => { this.props.funcDeactivate(); this.refinput.value = ''; } } >
                <span className='icon'>
                  <i className='fa fa-times'></i>
                </span>
              </a>
            </p>
          </div>
        </div>
        
        <div className="dropdown-menu" style={{'width': 'inherit'}} id="dropdown-menu" role="menu">
          <div className="dropdown-content">
            { this.getDropdownItems() }
            { (this.props.activeID) ? this.dropdownDivider() : null }
            { (this.props.activeID) ? this.clearDropdownItem() : null }
          </div>
        </div>
      </div>
    );
  }
}
