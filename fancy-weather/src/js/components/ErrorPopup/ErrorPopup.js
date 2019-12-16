import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './error-popup.module.scss';
import translations from '../../translations/translations';

class ErrorPopup extends Component {
  state = {
    isHidden: this.props.isHidden,
  };

  componentDidUpdate(prevProps) {
    if (prevProps.isHidden !== this.props.isHidden)
      this.setState({
        isHidden: this.props.isHidden,
      });
  }

  render() {
    return (
      <div
        className={classnames(styles['error-popup'], this.state.isHidden ? '' : styles['error-popup--bubble'])}
        onAnimationEnd={() => {
          this.setState({
            isHidden: true,
          });
        }}
        id="error-popup"
      >
        {translations[this.props.appSettings.language].errors.bg}
      </div>
    );
  }
}

ErrorPopup.propTypes = {
  isHidden: PropTypes.bool,
  className: PropTypes.string,
  appSettings: PropTypes.object,
};

export default ErrorPopup;
