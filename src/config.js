require('babel-polyfill');

const environment = {
  development: {
    isProduction: false
  },
  production: {
    isProduction: true
  }
}[process.env.NODE_ENV || 'development'];

const {PORT} = process.env;

module.exports = Object.assign({
  port: PORT,
  app: {
    title: 'Q',
    description: '',
    head: {
      titleTemplate: 'UHS: %s',
    }
  }

}, environment);
