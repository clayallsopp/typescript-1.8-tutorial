import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { User } from './User';

class MyComponent extends React.Component {
  render() {
    return <div>{ this.props.user.handle }</div>;
  }
}

let user = new User('@clayallsopp');

let node = document.getElementById('container');
ReactDOM.render(<MyComponent user={ user } />, node);
