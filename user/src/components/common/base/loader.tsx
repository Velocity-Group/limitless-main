/* eslint-disable no-nested-ternary */
import { PureComponent } from 'react';
import { Spin } from 'antd';
import { connect } from 'react-redux';
import { IUIConfig } from '@interfaces/index';
import './loader.less';

interface IProps {
  ui: IUIConfig,
  customText?: string;
}

class Loader extends PureComponent<IProps> {
  render() {
    const { ui, customText } = this.props;
    return (
      <div className="loading-screen">
        <div style={{ textAlign: 'center' }}>
          {ui.logo ? <img alt="loading-ico" src={ui.logo} /> : ui.siteName ? <span>{ui.siteName}</span> : <Spin size="large" />}
          {customText && <p>{customText}</p>}
        </div>
      </div>
    );
  }
}
const mapStatesToProps = (state) => ({
  ui: { ...state.ui }
});
export default connect(mapStatesToProps)(Loader);
