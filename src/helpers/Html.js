import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom/server';
import serialize from 'serialize-javascript';
import Helmet from 'react-helmet';
import {LoadingPage} from 'components';

function fixURL(url) {
  let result = url;
  if (__DEVELOPMENT__) {
    result = url.replace('3000', '3001').replace('main-dll.js', 'app.js');
  }
  return result;
}

/**
 * Wrapper component containing HTML metadata and boilerplate tags.
 * Used in server-side code only to wrap the string output of the
 * rendered route component.
 *
 * The only thing this component doesn't (and can't) include is the
 * HTML doctype declaration, which is added to the rendered output
 * by the server.js file.
 */
export default class Html extends Component {
  static propTypes = {
    assets: PropTypes.object,
    component: PropTypes.node,
    store: PropTypes.object
  };

  render() {
    const {assets: {styles, javascript}, component, store} = this.props;
    const {vendor, main} = javascript;
    const content = component ? ReactDOM.renderToString(component) : '';
    const head = Helmet.rewind();
    return (
      <html lang="zh-cn" >
      <head>
        <meta charSet="utf-8" />
        {head.base.toComponent()}
        {head.title.toComponent()}
        {head.meta.toComponent()}
        {head.link.toComponent()}
        {head.script.toComponent()}

        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* styles (will be present only in production with webpack extract text plugin) */}
        {Object.keys(styles).map((style, key) =>
          <link href={styles[style]} key={key} media="screen, projection"
                rel="stylesheet" type="text/css" charSet="UTF-8" />
        )}

        {/* (will be present only in development mode) */}
        {/* outputs a <style/> tag with all bootstrap styles + it could be CurrentPage.scss. */}
        {/* can smoothen the initial style flash (flicker) on page load in development mode. */}
        {/* ideally one could also include here the style for the current page (Home.scss, About.scss, etc) */}
        { Object.keys(styles).length === 0 ?
          <style dangerouslySetInnerHTML={{__html: require('../theme/bootstrap.config.js')}} /> : null }
      </head>
      <body>
      <LoadingPage />
      <div id="content" dangerouslySetInnerHTML={{__html: content}} />
      <script dangerouslySetInnerHTML={{__html: `window.__data=${serialize(store.getState())};`}} charSet="UTF-8" />
      {vendor && <script src={vendor} charSet="UTF-8" />}
      <script src={fixURL(main)} charSet="UTF-8" />
      </body>
      </html>
    );
  }
}
