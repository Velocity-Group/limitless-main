import { PureComponent } from 'react';
import { Avatar } from 'antd';
import { TickIcon } from 'src/icons';
import { IPerformer, ICountry } from 'src/interfaces';
import Link from 'next/link';
import moment from 'moment';
import './performer.less';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
}

export default class PerformerCard extends PureComponent<IProps> {
  render() {
    const { performer, countries } = this.props;
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
              pathname: '/model/profile',
              query: { username: performer?.username || performer?._id }
            }}
            as={`/${performer?.username || performer?._id}`}
          >
            <a>
              {performer?.isFreeSubscription && (
              <div className="card-stat">
                <span>Free</span>
              </div>
              )}
              {performer?.live > 0 && <span className="live-status">Live</span>}
              {country && (
              <span className="card-country">
                <img alt="performer-country" src={country?.flag} />
              </span>
              )}
              <span className="card-age">
                {moment().diff(moment(performer.dateOfBirth), 'years') > 0 && `${moment().diff(moment(performer.dateOfBirth), 'years')}+`}
              </span>
              <div className="card-img">
                <Avatar alt="avatar" src={performer?.avatar || '/static/no-avatar.png'} />
              </div>
              <span className={performer?.isOnline > 0 ? 'online-status active' : 'online-status'} />
              <div className="model-name">
                <div className="name">
                  {performer?.name || 'N/A'}
                  {' '}
                  {performer?.verifiedAccount && <TickIcon />}
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
