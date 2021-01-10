import React from 'react';
import Router from './src/Router.js';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    process.nextTick = setImmediate;
  }

  render() {
    return <Router />;
  }
}
