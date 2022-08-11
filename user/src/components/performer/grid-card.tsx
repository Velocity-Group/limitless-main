import { PureComponent } from 'react';
import { ICountry, IPerformer, IUser } from 'src/interfaces';
import Link from 'next/link';
import { StarOutlined, HeartFilled, HeartOutlined } from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import { dobToAge, shortenLargeNumber } from '@lib/index';
import { connect } from 'react-redux';
import { message, Tooltip } from 'antd';
import Router from 'next/router';
import { followService } from 'src/services';
import './performer.less';

interface IProps {
  performer: IPerformer;
  user: IUser;
  countries: ICountry[];
}

class PerformerGridCard extends PureComponent<IProps> {
  state = {
    isFollowed: false,
    requesting: false
  }

  componentDidMount(): void {
    const { performer } = this.props;
    this.setState({ isFollowed: !!performer?.isFollowed });
  }

  handleFollow = async () => {
    const { performer, user } = this.props;
    const { isFollowed, requesting } = this.state;
    if (!user._id) {
      message.error('Please log in or register!');
      return;
    }
    if (requesting || user.isPerformer) return;
    try {
      this.setState({ requesting: true });
      if (!isFollowed) {
        await followService.create(performer?._id);
        this.setState({ isFollowed: true, requesting: false });
      } else {
        await followService.delete(performer?._id);
        this.setState({ isFollowed: false, requesting: false });
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occured, please try again later');
      this.setState({ requesting: false });
    }
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

  render() {
    const { performer, user, countries } = this.props;
    const { isFollowed } = this.state;
    const country = countries && countries.length && countries.find((c) => c.code === performer.country);

    return (
      <div className="grid-card" style={{ backgroundImage: `url(${performer?.avatar || '/static/no-avatar.png'})` }}>
        {/* {performer?.isFreeSubscription && <span className="free-status">Free</span>} */}
        <span className={performer?.isOnline > 0 ? 'online-status active' : 'online-status'} />
        {performer?.live > 0 && <div className="live-status">Live</div>}
        {!user?.isPerformer && (
        <a aria-hidden onClick={() => this.handleFollow()} className={!isFollowed ? 'follow-btn' : 'follow-btn active'}>
          {isFollowed ? <Tooltip title="Following"><HeartFilled /></Tooltip> : <Tooltip title="Follow"><HeartOutlined /></Tooltip>}
        </a>
        )}
        <div className="card-stat">
          <span>
            {shortenLargeNumber(performer?.score || 0)}
            {' '}
            <StarOutlined />
          </span>
          {performer?.dateOfBirth && (
          <span>
            {dobToAge(performer?.dateOfBirth)}
          </span>
          )}
        </div>
        <Link
          href={{
            pathname: '/model/profile',
            query: { username: performer?.username || performer?._id }
          }}
          as={`/${performer?.username || performer?._id}`}
        >
          <a>
            <div className="model-name">
              {country && (
              <img alt="performer-country" className="model-country" src={country?.flag} />
              )}
              {performer?.name || performer?.username || 'N/A'}
              {performer?.verifiedAccount && <TickIcon />}
            </div>

          </a>
        </Link>
      </div>
    );
  }
}

const maptStateToProps = (state) => ({ user: { ...state.user.current } });
export default connect(maptStateToProps)(PerformerGridCard);
