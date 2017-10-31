import React from 'react';


export default class Loading extends React.Component {
  constructor(props) {
    super(props);
  }

  
  render() {
    return(
      <section className='section is-medium'>
        <div className='columns'>
          <div className='column is-4 is-offset-4'>
            <a className='button is-large is-white is-loading is-fullwidth'></a>
          </div>
        </div>
      </section>
    );
  }
}

