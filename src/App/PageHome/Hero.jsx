import React from 'react';


// Hero component on PageHome.


export default class Hero extends React.PureComponent {
  //this.props.nickname
  constructor(props) {
    super(props);
  }
  

  render() {
    
    const TIME = new Date();
    const HOUR = TIME.getHours();
    
    let greeting;
    if ((HOUR >= 17) || (HOUR < 5)) { greeting = 'Good evening, ' }
    else if (HOUR >= 12) { greeting = 'Good afternoon, '}
    else if (HOUR >= 5) { greeting = 'Good morning, ' }
    else { greeting = 'Hello, ' }
        
    return(
      <section className="hero is-small is-primary is-bold"
        style={ {marginBottom: '25px'} }>
        <div className="hero-body">
          <div className="container">
            <h1 className="title">
              { greeting + this.props.nickname }
            </h1>
          </div>
        </div>        
      </section>
    );
  }
}
