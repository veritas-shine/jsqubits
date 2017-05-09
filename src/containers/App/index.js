import React, {Component} from 'react';
import Helmet from 'react-helmet';
import config from '../../config';

export default
class App extends Component {
  componentDidMount() {
    if (typeof document !== 'undefined') {
      document.body.className += ' loaded';
      setTimeout(() => {
        const element = document.getElementById('loader-wrapper');
        element.parentNode.removeChild(element);
      }, 100);
    }
  }

  render() {
    const appStyle = {
      position: 'absolute',
      boxSizing: 'border-box',
      width: '100%',
      minHeight: '100%',
      boxShadow: '0 3px 20px #000',
      backgroundClip: 'content-box',
      height: '100%',
      overflow: 'hidden',
      zIndex: 0
    };
    return (
      <div style={appStyle}>
        <Helmet {...config.app.head} />
        {this.props.children}
      </div>
    );
  }
}
