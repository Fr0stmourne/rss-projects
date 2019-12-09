import React, { Component } from 'react';
import './App.scss';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Controls from './components/Controls/Controls';
import Search from './components/Search/Search';
import Dashboard from './components/Dashboard/Dashboard';
import WeatherMap from './components/Map/Map';
import {
  getPhotosJSON,
  setBackground,
  getWeatherJSON,
  getCoordinatesJSON,
  getUserLocation,
  getCoordsObjFromString,
} from './utils';
import { updateForecast, updateLocation, updateTime, updateTempScale } from './actions';

class App extends Component {
  onTempScaleChangeHandler = async tempScale => {
    // const coordsString = `${this.props.location.coordinates.lat},${this.props.location.coordinates.lng}`;
    this.props.onTempScaleChange(tempScale);
    // const weather = await getWeatherJSON(coordsString, this.props.appSettings.tempScale);
    // this.props.onWeatherUpdate(weather);
  };

  onSearchHandler = async town => {
    const geocodingData = await getCoordinatesJSON(town);
    const coordinatesObj = geocodingData.results[0].geometry;
    const newLocation = {
      city: geocodingData.results.find(result => Object.keys(result.components).includes('city')).components.city,
      country: geocodingData.results
        .find(result => Object.keys(result.components).includes('country_code'))
        .components.country_code.toUpperCase(),
      coordinates: geocodingData.results[0].geometry,
    };
    this.props.onLocationUpdate(newLocation);
    const coordinates = `${coordinatesObj.lat}, ${coordinatesObj.lng}`;
    const newWeather = await getWeatherJSON(coordinates, this.props.appSettings.tempScale);
    this.props.onWeatherUpdate(newWeather);
  };

  onReloadHandler = async (weather, location) => {
    const data = await getPhotosJSON(weather, location);
    const chosenPhoto = data.photos.photo[Math.round(Math.random() * data.photos.photo.length)];
    setBackground(chosenPhoto.url_h);
  };

  async componentDidMount() {
    const userLocation = await getUserLocation();
    userLocation.coordinates = getCoordsObjFromString(userLocation.loc);

    this.props.onLocationUpdate(userLocation);
    const currentLocationWeather = await getWeatherJSON(userLocation.loc, this.props.appSettings.tempScale);
    console.log(this.props.appSettings.tempScale);
    this.props.onWeatherUpdate(currentLocationWeather);
  }

  render() {
    return (
      <React.Fragment>
        <h1 className="app__title visually-hidden">Fancy Weather</h1>
        <Controls
          tempScaleChangeHandler={this.onTempScaleChangeHandler}
          reloadBtnHandler={this.onReloadHandler}
        ></Controls>
        <Search searchBtnHandler={this.onSearchHandler}></Search>
        <Dashboard
          appSettings={this.props.appSettings}
          onTimeTick={this.props.onTimeTick}
          location={this.props.location}
          todayForecast={this.props.todayForecast}
          futureForecasts={this.props.forecasts}
        ></Dashboard>
        <WeatherMap location={this.props.location}></WeatherMap>
      </React.Fragment>
    );
  }
}

function MapStateToProps(state) {
  return {
    forecasts: state.forecasts,
    todayForecast: state.todayForecast,
    location: state.location,
    appSettings: state.appSettings,
  };
}

function MapDispatchToProps(dispatch) {
  return {
    onWeatherUpdate: forecastsObj => dispatch(updateForecast(forecastsObj)),
    onLocationUpdate: location => dispatch(updateLocation(location)),
    onTimeTick: () => dispatch(updateTime()),
    onTempScaleChange: tempScale => {
      dispatch(updateTempScale(tempScale));
    },
  };
}

App.propTypes = {
  forecasts: PropTypes.array,
  onWeatherUpdate: PropTypes.func,
  onLocationUpdate: PropTypes.func,
  onTimeTick: PropTypes.func,
  onTempScaleChange: PropTypes.func,
  todayForecast: PropTypes.object,
  location: PropTypes.object,
  appSettings: PropTypes.object,
};

export default connect(MapStateToProps, MapDispatchToProps)(App);
