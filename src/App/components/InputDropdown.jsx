import React from 'react';


// Input field with sigle select dropdown.


export default class InputDropdown extends React.PureComponent {
  // this.props.items:List[Obj]      - Obj is {id:str, label:str}
  // this.props.activeID:str         - id of the active item.
  // this.props.activateID:f(id:str) - activate item by ID.
  // this.props.deactivate:f()       - deactivate whatever is selected.
  constructor(props) {
    super(props);
    this.state = {
      text: '',
      active: false
    };
    this.clear = this.clear.bind(this);
    this.showDropdown = this.showDropdown.bind(this);
    this.hideDropdown = this.hideDropdown.bind(this);
  }


  clear() {
    this.props.deactivate();
    this.refinput.value = '';
  }


  /* dropdown */


  showDropdown() {
    this.clear(); 
    this.setState({active: true});
  }


  hideDropdown() {
    this.setState({active: false});
  }


  /* funcs */


  includesText(x) {
    return x.label.toLowerCase().includes(this.state.text.toLowerCase());
  }


  /* render */


  makeDropdownItem(x) {
    return(
      <a className='dropdown-item' 
        onMouseDown={ () => { this.props.activateID(x.id); this.refinput.value = x.label; } }
        key={ x.id }>
        { x.label }
      </a>
    );
  }


  makeNoTanksAvailableItem() {
    return (
      <a className='dropdown-item'>
        No tanks available
      </a>
    );
  }
  
  
  makeDropdownContent() {
    const ITEMS = this.props.items
      .filter(this.includesText, this)
      .slice(0, 5)
      .map(this.makeDropdownItem, this);

    return (
      <div className="dropdown-content">
        { (ITEMS.length > 0) ? ITEMS : this.makeNoTanksAvailableItem() }
      </div>
    );
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
                onBlur={ this.hideDropdown } 
                onFocus={ this.showDropdown }
                ref={ (x) => this.refinput = x } 
                onChange={ () => this.setState({text: this.refinput.value.toLowerCase()}) }
              />
              <span className='icon is-small is-left'>
                <i className='fa fa-search'></i>
              </span>
            </p>
            <p className='control'>
              <a className='button'
                onClick={ this.clear }>
                <span className='icon'>
                  <i className='fa fa-times'></i>
                </span>
              </a>
            </p>
          </div>
        </div>
        
        <div className="dropdown-menu" style={{'width': 'inherit'}} id="dropdown-menu" role="menu">
          { this.makeDropdownContent() }
        </div>
      </div>
    );
  }
}
