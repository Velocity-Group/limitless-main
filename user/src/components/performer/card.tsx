import { PureComponent } from 'react';
import { Avatar, message, Tooltip } from 'antd';
import { TickIcon } from 'src/icons';
import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { IPerformer, ICountry, IUser } from 'src/interfaces';
import Link from 'next/link';
import moment from 'moment';
import { connect } from 'react-redux';
import Router from 'next/router';
import { followService } from 'src/services';
import './performer.less';

interface IProps {
  performer: IPerformer;
  countries: ICountry[];
  user: IUser;
  onFollow?: Function;
}

class PerformerCard extends PureComponent<IProps> {
  state = {
    isFollowed: false,
    requesting: false
  };

  componentDidMount(): void {
    const { performer } = this.props;
    this.setState({ isFollowed: !!performer?.isFollowed });
  }

  handleJoinStream = (e) => {
    e.preventDefault();
    const { user, performer } = this.props;
    if (!user._id) {
      message.error('Please log in or register!');
      return;
    }
    if (user.isPerformer) return;
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

  handleFollow = async () => {
    const { performer, user, onFollow } = this.props;
    const { isFollowed, requesting } = this.state;
    if (requesting || user.isPerformer) return;
    if (!user._id) {
      message.error('Please log in or register!');
      return;
    }
    try {
      this.setState({ requesting: true });
      if (!isFollowed) {
        await followService.create(performer?._id);
        this.setState({ isFollowed: true, requesting: false });
      } else {
        await followService.delete(performer?._id);
        this.setState({ isFollowed: false, requesting: false });
      }
      onFollow && onFollow();
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
  };

  render() {
    const { performer, countries, user } = this.props;
    const { isFollowed } = this.state;
    const country = countries && countries.length && countries.find((c) => c.code === performer.country);

    return (
      <div
        className="model-card"
        style={{
          backgroundImage: `url(${performer?.cover || '/static/banner-image.jpg'})`
        }}
      >
        <div className="hovering">
          {performer?.isFreeSubscription && (
          <span className="card-free">Free</span>
          )}
          {performer?.live > 0 && <span className="live-status" aria-hidden onClick={this.handleJoinStream.bind(this)}>Live</span>}

          <span className="card-age">
            {moment().diff(moment(performer.dateOfBirth), 'years') > 0 && `${moment().diff(moment(performer.dateOfBirth), 'years')}+`}
          </span>
          <div className="card-img">
            <Avatar alt="avatar" src={performer?.avatar || '/static/no-avatar.png'} />
          </div>
          <span className={performer?.isOnline > 0 ? 'online-status active' : 'online-status'} />
          <Link
            href={{
              pathname: '/model/profile',
              query: { username: performer?.username || performer?._id }
            }}
            as={`/${performer?.username || performer?._id}`}
          >
            <a>
              <div className="model-name">
                <div className="name">
                  {performer?.name || 'N/A'}
                  {' '}
                  {country && (
                  <img alt="performer-country" className="model-country" src={country?.flag} />
                  )}
                  {' '}
                  {performer?.verifiedAccount && <TickIcon />}
                </div>
                <p>
                  {`@${performer?.username || 'n/a'}`}
                </p>
              </div>

            </a>
          </Link>
          {!user?.isPerformer && (
            <a aria-hidden onClick={() => this.handleFollow()} className={!isFollowed ? 'follow-btn' : 'follow-btn active'}>
              {isFollowed ? <Tooltip title="Following"><HeartFilled /></Tooltip> : <Tooltip title="Follow"><HeartOutlined /></Tooltip>}
            </a>
          )}
        </div>
      </div>
    );
  }
}

const maptStateToProps = (state) => ({ user: { ...state.user.current } });
export default connect(maptStateToProps)(PerformerCard);
