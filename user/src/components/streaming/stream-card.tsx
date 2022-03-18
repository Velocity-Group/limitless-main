import {
  Card, Avatar, Divider, Space, message, Button, Modal
} from 'antd';
import { UsergroupAddOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { IStream, IUser } from 'src/interfaces';
import {
  shortenLargeNumber,
  videoDuration,
  getResponseError
} from '@lib/index';
import Router from 'next/router';
import './index.less';
import { Player } from 'src/agora';
import useSubscriber from 'src/agora/useSubscriber';
import { useState } from 'react';

interface IProps {
  stream: IStream;
  user: IUser;
  loading: boolean;
}

const StreamCard = ({ stream, user, loading }: IProps) => {
  const { join, tracks, client } = useSubscriber({
    localUId: user._id,
    remoteUId: stream.performerId,
    conversationId: stream.conversationId
  });
  const [showModal, setModalShow] = useState(false);
  const handleClick = () => {
    if (!user._id) {
      message.error('Please log in or register!', 5);
      Router.push('/');
      return;
    }
    if (user.isPerformer) return;
    if (!stream?.isSubscribed) {
      message.error('Please subscribe to join live chat!', 5);
      Router.push(
        {
          pathname: '/model/profile',
          query: {
            username:
              stream?.performerInfo?.username || stream?.performerInfo?._id
          }
        },
        `/${stream?.performerInfo?.username || stream?.performerInfo?._id}`
      );
      return;
    }
    Router.push(
      {
        pathname: '/streaming/details',
        query: {
          performer: JSON.stringify(stream?.performerInfo),
          username:
            stream?.performerInfo?.username || stream?.performerInfo?._id
        }
      },
      `/streaming/${
        stream?.performerInfo?.username || stream?.performerInfo?._id
      }`
    );
  };

  const watchNow = async () => {
    try {
      // TODO check supscription
      join();
      setModalShow(true);
    } catch (err) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  };

  const stopWatch = async () => {
    if (client && client.uid) {
      await client.leave();
    }
    setModalShow(false);
  };

  return (
    <Card
      hoverable
      className="stream-card"
      loading={loading}
    >
      <Card.Meta
        title={stream?.title}
        description={stream?.description}
        avatar={(
          <Avatar
            src={stream?.performerInfo?.avatar || '/static/no-avatar.png'}
          />
        )}
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
        {!stream?.isFree && (
          <img src="/static/coin-ico.png" width="15px" alt="coin" />
        )}
        {stream?.isFree ? 'Free' : (stream?.price || 0).toFixed(2)}
      </span>
      <Button onClick={handleClick}>Join Chat</Button>
      <Button onClick={watchNow}>Watch Now</Button>
      <Modal visible={showModal} onCancel={stopWatch}>
        <Player tracks={tracks} />
      </Modal>
    </Card>
  );
};

export default StreamCard;
