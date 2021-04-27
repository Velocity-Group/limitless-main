/* eslint-disable no-nested-ternary */
/* eslint-disable react/destructuring-assignment */
import { PureComponent } from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import { IPerformer, IUIConfig } from 'src/interfaces';
import Link from 'next/link';
import { connect } from 'react-redux';
import moment from 'moment';
import './performer.less';

interface IProps {
  performer: IPerformer;
  ui: IUIConfig
}

class PerformerCard extends PureComponent<IProps> {
  render() {
    const { performer, ui } = this.props;
    const { countries } = ui;
    const country = countries && countries.length && countries.find((c) => c.code === performer.country);

    return (
      <div
        className="model-card"
        style={{
          backgroundImage: `url(${performer?.cover || '/static/banner-image.jpg'})`
        }}
      >
        <div className="hovering">
          <Link
            href={{
              pathname: '/profile',
              query: { username: performer?.username }
            }}
            as={`/${performer?.username}`}
          >
            <a>
              {performer?.isFreeSubscription && (
              <div className="card-stat">
                <span>Free</span>
              </div>
              )}
              {country && (
              <span className="card-country">
                <img alt="performer-country" src={country?.flag} />
              </span>
              )}
              <span className="card-age">
                {moment().diff(moment(performer.dateOfBirth), 'years') > 0 && `${moment().diff(moment(performer.dateOfBirth), 'years')}+`}
              </span>
              <div className="card-img">
                <img alt="" src={performer?.avatar || '/static/no-avatar.png'} />
              </div>
              {performer?.isOnline ? (
                <span className="online-status" />
              ) : (
                <span className="online-status off" />
              )}
              <div className="model-name">
                <div>
                  {performer?.name || 'N/A'}
                  {' '}
                  {performer?.verifiedAccount && <CheckCircleOutlined />}
                </div>
                <p>
                  {`@${performer?.username || 'n/a'}`}
                </p>
              </div>
            </a>
          </Link>
        </div>
      </div>
    );
  }
}

const mapStates = (state: any) => ({
  ui: { ...state.ui }
});
export default connect(mapStates)(PerformerCard);
