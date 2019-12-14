import React from 'react';
import ReactDOM from 'react-dom';
import '../scss/main.scss';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { YMaps } from 'react-yandex-maps';
import updateReducer from './reducers';
import App from './App';
import LocalStorageProvider from './localStorageProvider';

const store = createStore(updateReducer, applyMiddleware(thunk));
store.subscribe(() => {
  LocalStorageProvider.setSettings(store.getState().appSettings);
  console.log(store.getState());
});

const app = (
  <Provider store={store}>
    <YMaps>
      <App />
    </YMaps>
  </Provider>
);

ReactDOM.render(app, document.getElementById('app'));
