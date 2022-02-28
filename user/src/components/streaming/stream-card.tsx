import {
  Card, Avatar, Divider, Space, message
} from 'antd';
import { UsergroupAddOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { IStream, IUser } from 'src/interfaces';
import { shortenLargeNumber, videoDuration } from '@lib/index';
import Router from 'next/router';
import './index.less';

interface IProps {
  stream: IStream;
  user: IUser;
  loading: boolean;
}

const StreamCard = ({ stream, user, loading }: IProps) => {
  const handleClick = () => {
    if (!user._id) {
      message.error('Please log in or register!', 5);
      Router.push('/');
      return;
    }
    if (user.isPerformer) return;
    if (!stream?.isSubscribed) {
      message.error('Please subscribe to join live chat!', 5);
      Router.push({
        pathname: '/model/profile',
        query: {
          username: stream?.performerInfo?.username || stream?.performerInfo?._id
        }
      }, `/${stream?.performerInfo?.username || stream?.performerInfo?._id}`);
      return;
    }
    Router.push({
      pathname: '/streaming/details',
      query: {
        performer: JSON.stringify(stream?.performerInfo),
        username: stream?.performerInfo?.username || stream?.performerInfo?._id
      }
    }, `/streaming/${stream?.performerInfo?.username || stream?.performerInfo?._id}`);
  };

  return (
    <Card hoverable className="stream-card" onClick={handleClick} loading={loading}>
      <Card.Meta
        title={stream?.title}
        description={stream?.description}
        avatar={<Avatar src={stream?.performerInfo?.avatar || '/static/no-avatar.png'} />}
      />
      <div className="card-stat">
        <Space>
          <UsergroupAddOutlined />
          {shortenLargeNumber(stream?.stats?.members || 0)}
        </Space>
        <Divider type="vertical" />
        <Space>
          <ClockCircleOutlined />
          {videoDuration(stream?.streamingTime)}
        </Space>
      </div>
      <span className="live-status">
        <span className="live" />
      </span>
      <span className="price-tag">
        {!stream?.isFree && <img src="/static/coin-ico.png" width="15px" alt="coin" />}
        {stream?.isFree ? 'Free' : (stream?.price || 0).toFixed(2)}
      </span>
    </Card>
  );
};

export default StreamCard;
