import { IStream } from '@interfaces/stream';
import { IUser } from '@interfaces/user';
import { message } from 'antd';
import Router from 'next/router';
import { useDispatch } from 'react-redux';
import { setSubscription } from '@redux/subscription/actions';

type Props = {
  stream: IStream;
  user: IUser;
}

export default function StreamListItem({ stream, user }: Props) {
  const dispatch = useDispatch();
  const handleClick = () => {
    if (!user._id) {
      message.error('Please log in or register!', 5);
      Router.push('/auth/login');
      return;
    }
    if (user.isPerformer) return;
    if (!stream?.isSubscribed) {
      message.error('Please subscribe to join live chat!', 5);
      dispatch(setSubscription({ showModal: true, performer: stream?.performerInfo }));
      return;
    }
    Router.push(
      {
        pathname: '/streaming/details',
        query: {
          username:
            stream?.performerInfo?.username || stream?.performerInfo?._id
        }
      },
      `/streaming/${
        stream?.performerInfo?.username || stream?.performerInfo?._id
      }`
    );
  };

  return (
    <div
      aria-hidden
      onClick={handleClick}
      key={stream?._id}
      className="story-per-card"
      title={stream?.performerInfo?.name || stream?.performerInfo?.username || 'N/A'}
    >
      <div className="blink-border" />
      <img className="per-avatar" alt="avatar" src={stream?.performerInfo?.avatar || '/static/no-avatar.png'} />
      <div className="live-tag">LIVE</div>
    </div>
  );
}
