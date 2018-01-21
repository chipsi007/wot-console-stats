import React from 'react';


// Tags with dropdown.


export default class TagsMultiline extends React.PureComponent {
  //this.props.tags:List[Obj]        - actual items as {id:str, label:str, active:bool}
  //this.props.toggleTag:f(id:str)   - toggle item active/incactive by id.
  //this.props.activateAllTags:f()   - activate all items.
  //this.props.deactivateAllTags:f() - deactivate all items.
  constructor(props) {
    super(props);
  }


  /* render */


  makeTag(x) {
    return(
      <div className='control' key={ x.id }>
        <div className='tags has-addons'>
          <span className={'tag' + ((x.active) ? ' is-primary' : '')}>
            { x.label }
          </span>
          <a className={'tag' + ((x.active) ? ' is-primary is-delete' : ' is-add')}
            onClick={ () => this.props.toggleTag(x.id) }>
          </a>
        </div>
      </div>
    );
  }
  
   
  render() {
    return(
      <div className='notification' style={{padding: '0.75em', height: '100%'}}>   
        <div className='field is-grouped is-grouped-multiline'>
          { this.props.tags.map(this.makeTag, this) }
          <div className='control'>
            <div className='tags'>
              <span className='tag is-add is-success'
                onClick={ this.props.activateAllTags }>
              </span>
            </div>
          </div>
          <div className='control'>
            <div className='tags'>
              <span className='tag is-delete is-danger'
                onClick={ this.props.deactivateAllTags }>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
