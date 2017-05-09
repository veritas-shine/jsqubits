import React from 'react';
import {IndexRoute, Route} from 'react-router';

import {
  App,
  Playground
} from 'containers';

export default (store, req) => {
  /**
   * Please keep routes in alphabetical order
   */
  return (
    <Route path="/" component={App}>
      <IndexRoute component={Playground} />
    </Route>
  );
};
