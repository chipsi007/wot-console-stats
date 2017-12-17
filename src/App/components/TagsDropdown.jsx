import React from 'react';


// Tags with dropdown.


export default class TagsDropdown extends React.PureComponent {
  //this.props.tags         :arr
  //this.props.toggle       :func arg1:str - "id" of the item.
  //this.props.toggleAllOn  :func 
  //this.props.toggleAllOff :func
  //this.props.buttonMsg    :str
  constructor(props) {
    super(props);
    this.state = {
      active: false
    };
    this.activate = this.activate.bind(this);
    this.deactivate = this.deactivate.bind(this);
    this.toggle = this.toggle.bind(this);
    this.switchAllOn = this.switchAllOn.bind(this);
    this.switchAllOff = this.switchAllOff.bind(this);
  }
  
  
  /* dropdown control */
  
  
  activate() {
    this.setState({active: true});
  }
  
  
  deactivate() {
    if (this.state.active) {
      this.setState({active: false});
    }
  }
  
  
  toggle() {
    this.setState({active: !this.state.active});
  }
  
  
  /* tag control */
  
  
  switchAllOn() {
    this.props.toggleAllOn();
    this.deactivate();
  }
  
  
  switchAllOff() {
    this.props.toggleAllOff();
    this.deactivate();
  }
  
  
  /* render */
  
  
  activeTags() {
    return this.props.tags
      .filter((x) => x.active)
      .map((x) => {
        return(
          <div className="control" key={ x.id }>
            <div className="tags has-addons">
              <span className="tag is-primary">
                { x.label }
              </span>
              <a className="tag is-delete is-primary"
                onClick={ () => this.props.toggle(x.id) }>
              </a>
            </div>
          </div>
        );
      });
  }
  
  
  inactiveTags() {
    return this.props.tags
      .filter((x) => !x.active)
      .map((x) => {
        return(
          <a className="dropdown-item"
            key={ x.id }
            onClick={ () => this.props.toggle(x.id) }>
            { x.label }
          </a>
        );
      });
  }
  
  
  buttonWithTags(activeTags) {
    return(
      <button className="button is-fullwidth is-light" 
        style={ {height: '100%'} }
        onClick={ this.deactivate }
        aria-haspopup="true" 
        aria-controls="dropdown-menu">
        <div className="field is-grouped is-grouped-multiline">
          { activeTags }
          <div className="control">
            <a className="tag is-success"
              onClick={ this.toggle }>
              { this.props.buttonMsg }
            </a>
          </div>
        </div>
      </button>
    );
  }
  
  
  buttonNoTags() {
    return(
      <button className="button is-fullwidth is-light" 
        style={ {height: '100%'} }
        onClick={ this.toggle }
        aria-haspopup="true" 
        aria-controls="dropdown-menu">
        { this.props.buttonMsg }
      </button>
    );
  }
  
  
  render() {
    
    const ACTIVE_TAGS = this.activeTags();
    const INACTIVE_TAGS = this.inactiveTags();
    
    return(
      <div className={ 'dropdown' + ((this.state.active) ? ' is-active' : '') }
        style={ {width: '100%', height: '100%'} }>
        <div className="dropdown-trigger" style={ {width: '100%'} }>
          { (ACTIVE_TAGS.length > 0) ? this.buttonWithTags(ACTIVE_TAGS) : this.buttonNoTags() }
        </div>
        <div className="dropdown-menu" id="dropdown-menu" role="menu">
          <div className="dropdown-content">
            { INACTIVE_TAGS }
            { (INACTIVE_TAGS.length > 0) ? (<hr className="dropdown-divider" />) : null }
            <a className="dropdown-item" onClick={ this.switchAllOn }>
              Add all
            </a>
            <a className="dropdown-item" onClick={ this.switchAllOff }>
              Remove all
            </a>
          </div>
        </div>
      </div>
    );
  }
}
