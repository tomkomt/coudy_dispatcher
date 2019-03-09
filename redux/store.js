const {compose} = require('redux');
const {createStore} = require('redux');
const {applyMiddleware} = require('redux');
const { createLogger } = require('redux-logger');
const thunk = require('redux-thunk').default;

const rootReducer = require('./reducers');
const middlewares = [];

middlewares.push(thunk);

const store = compose(applyMiddleware(...middlewares))(createStore)(rootReducer);

module.exports = store;