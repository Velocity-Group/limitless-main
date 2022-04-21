import { PureComponent } from 'react';
import { IPerformer, IUser } from 'src/interfaces';
import Link from 'next/link';
import { StarOutlined } from '@ant-design/icons';
import { TickIcon } from 'src/icons';
import { dobToAge, shortenLargeNumber } from '@lib/index';
import './performer.less';
import { connect } from 'react-redux';
import { message } from 'antd';
import Router from 'next/router';

interface IProps {
  performer: IPerformer;
  currentUser: IUser;
}

class PerformerGridCard extends PureComponent<IProps> {
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
    const { performer } = this.props;
    return (
      <Link
        href={{
          pathname: '/model/profile',
          query: { username: performer?.username || performer?._id }
        }}
        as={`/${performer?.username || performer?._id}`}
      >
        <a>
          <div className="grid-card" style={{ backgroundImage: `url(${performer?.avatar || '/static/no-avatar.png'})` }}>
            {performer?.isFreeSubscription && <span className="free-status">Free</span>}
            <span className={performer?.isOnline > 0 ? 'online-status active' : 'online-status'} />
            {performer?.live > 0 && <div className="live-status">Live</div>}
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
            <div className="model-name">
              {performer?.name || performer?.username || 'N/A'}
              {performer?.verifiedAccount && <TickIcon />}
            </div>
          </div>
        </a>
      </Link>
    );
  }
}

const maptStateToProps = (state) => ({ currentUser: { ...state.user.current } });
export default connect(maptStateToProps)(PerformerGridCard);
