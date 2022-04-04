import { PureComponent } from 'react';
import { Avatar, message } from 'antd';
import { TickIcon } from 'src/icons';
import { IPerformer, ICountry, IUser } from 'src/interfaces';
import Link from 'next/link';
import moment from 'moment';
import './performer.less';
import { connect } from 'react-redux';
import Router from 'next/router';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
  currentUser: IUser;
}

class PerformerCard extends PureComponent<IProps> {
  handleJoinStream = (e) => {
    e.preventDefault();
    const { currentUser, performer } = this.props;
    if (!currentUser._id) {
      message.error('Please log in or register!');
      return;
    }
    if (currentUser.isPerformer) return;
    if (!performer?.isSubscribed) {
      message.error('Please subscribe to this model!');
      return;
    }
    Router.push({
      pathname: '/streaming/details',
      query: {
        performer: JSON.stringify(performer),
        username: performer?.username || performer?._id
      }
    }, `/streaming/${performer?.username || performer?._id}`);
  }

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
              {performer?.live > 0 && <span className="live-status" aria-hidden onClick={this.handleJoinStream.bind(this)}>Live</span>}
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

const maptStateToProps = (state) => ({ currentUser: { ...state.user.current } });
export default connect(maptStateToProps)(PerformerCard);
