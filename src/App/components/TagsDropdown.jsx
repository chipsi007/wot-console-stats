import React from 'react';


// Tags with dropdown.


export default class TagsDropdown extends React.PureComponent {
  //this.props.tags:List[Obj]        - actual items as {id:str, label:str, active:bool}
  //this.props.toggleTag:f(id:str)   - toggle item active/incactive by id.
  //this.props.activateAllTags:f()   - activate all items.
  //this.props.deactivateAllTags:f() - deactivate all items.
  //this.props.lastButtonMessage:str - message on the last button.
  constructor(props) {
    super(props);
    this.state = {
      visible: false
    };
    this.hideDropdown = this.hideDropdown.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.activateAllTags = this.activateAllTags.bind(this);
    this.deactivateAllTags = this.deactivateAllTags.bind(this);
  }
  
  
  /* dropdown control */
  
  
  showDropdown() {
    this.setState({visible: true});
  }
  
  
  hideDropdown() {
    if (this.state.visible) {
      this.setState({visible: false});
    }
  }
  
  
  toggleDropdown() {
    this.setState({visible: !this.state.visible});
  }
  
  
  /* tag control */
  
  
  activateAllTags() {
    this.props.activateAllTags();
    this.hideDropdown();
  }
  
  
  deactivateAllTags() {
    this.props.deactivateAllTags();
    this.hideDropdown();
  }


  /* funcs */


  isActive(x) {
    return x.active;
  }


  isntActive(x) {
    return !x.active;
  }


  /* render */


  makeTag(x) {
    return(
      <div className='control' key={ x.id }>
        <div className='tags has-addons'>
          <span className='tag is-primary'>
            { x.label }
          </span>
          <a className='tag is-delete is-primary'
            onClick={ () => this.props.toggleTag(x.id) }>
          </a>
        </div>
      </div>
    );
  }


  makeDropdownItem(x) {
    return(
      <a className='dropdown-item'
        key={ x.id }
        onClick={ () => this.props.toggleTag(x.id) }>
        { x.label }
      </a>
    );
  }
   
  
  buttonWithTags(activeTags) {
    return(
      <button className='button is-fullwidth is-light' 
        style={ {height: '100%'} }
        onClick={ this.hideDropdown }
        aria-haspopup='true' 
        aria-controls='dropdown-menu'>
        <div className='field is-grouped is-grouped-multiline'>
          { activeTags }
          <div className='control'>
            <a className='tag is-success'
              onClick={ this.toggleDropdown }>
              { this.props.lastButtonMessage }
            </a>
          </div>
        </div>
      </button>
    );
  }
  
  
  buttonWithoutTags() {
    return(
      <button className='button is-fullwidth is-light'
        style={{height: '100%'}}
        onClick={ this.toggleDropdown }
        aria-haspopup='true'
        aria-controls='dropdown-menu'>
        { this.props.lastButtonMessage }
      </button>
    );
  }
  
  
  render() {
    
    const ACTIVE_TAGS = this.props.tags.filter(this.isActive).map(this.makeTag, this);
    const INACTIVE_TAGS = this.props.tags.filter(this.isntActive).map(this.makeDropdownItem, this);
    
    return(
      <div className={ 'dropdown' + ((this.state.visible) ? ' is-active' : '') }
        style={{width: '100%', height: '100%'}}>

        <div className="dropdown-trigger" style={{width: '100%'}}>
          { (ACTIVE_TAGS.length > 0) ? this.buttonWithTags(ACTIVE_TAGS) : this.buttonWithoutTags() }
        </div>

        <div className='dropdown-menu' id='dropdown-menu' role='menu'>
          <div className='dropdown-content'>
            { INACTIVE_TAGS }
            { (INACTIVE_TAGS.length > 0) ? (<hr className='dropdown-divider' />) : null }
            <a className='dropdown-item' onClick={ this.activateAllTags }>Add all</a>
            <a className='dropdown-item' onClick={ this.deactivateAllTags }>Remove all</a>
          </div>
        </div>

      </div>
    );
  }
}
