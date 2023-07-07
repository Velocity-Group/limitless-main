import moment from 'moment';
import {
  Button, message, Image, Avatar, Dropdown, Menu
} from 'antd';
import {
  EllipsisOutlined, KeyOutlined, FileImageOutlined, VideoCameraAddOutlined
} from '@ant-design/icons';
import { IMessage, IUser } from '@interfaces/index';
import { VideoStatusPlayer } from '@components/common/video-player3';
import { TranscodeVideoPlayer } from '@components/common/video-player2';
import { VideoPlayer } from '@components/common/video-player';
import {
  videoDuration, replaceURLs
} from '@lib/index';
// import { deleteMessageSuccess } from '@redux/message/actions';
import { AudioPlayer } from '@components/common/audio-player';
import { useState } from 'react';
import { tokenTransactionService } from '@services/index';
import { useDispatch, useSelector } from 'react-redux';
import Router from 'next/router';
import { updateBalance } from '@redux/user/actions';
import { messageService } from '@services/message.service';
import { ImagesViewer } from '../photo/images-slider-view';
import './Message.less';

interface IProps {
  data: IMessage;
  isMine: boolean;
  startsSequence: boolean;
  endsSequence: boolean;
  showTimestamp: boolean;
  currentUser: IUser;
  recipient: IUser;
  isSubscribed: boolean;
}

export default function Message(props: IProps) {
  const {
    data, isMine, startsSequence, endsSequence, showTimestamp, isSubscribed, currentUser, recipient
  } = props;
  const {
    isBought, isSale, price, type, text, files, createdAt
  } = data;
  const friendlyTimestamp = moment(createdAt).format('LLLL');
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user.current);
  const [bought, setBought] = useState(isSale && isBought);
  const images = files ? files.filter((f) => f.type === 'message-photo') : [];
  const video = files && files.find((f) => f.type === 'message-video');
  const teaser = files && files.find((f) => f.type === 'message-teaser');
  const audio = files && files.find((f) => f.type === 'message-audio');
  const thumbnail = files && files.find((f) => f.type === 'message-thumbnail');
  const imageThumb = images[0] && images[0].thumbnails && images[0].thumbnails[0];
  const teaserBlurThumb = teaser?.thumbnails && teaser.thumbnails.find((f) => f.includes('blur'));
  const teaserThumb = teaser?.thumbnails && teaser.thumbnails.find((f) => !f.includes('blur'));
  const videoBlurThumb = video?.thumbnails && video.thumbnails.find((f) => f.includes('blur'));
  const videoThumb = video?.thumbnails && video.thumbnails.find((f) => !f.includes('blur'));
  const canView = (!isSale && isSubscribed) || (isSale && bought);

  const thumbUrl = thumbnail?.url
    || (canView ? ((images && images[0] && images[0]?.url) || videoThumb || teaserThumb)
      : imageThumb || videoBlurThumb || teaserBlurThumb || videoThumb || teaserThumb) || '/static/leaf.jpg';

  const purchaseMessage = async () => {
    if (user.balance < price) {
      message.error('Your balance is not enough');
      Router.push('/wallet');
      return;
    }
    try {
      await tokenTransactionService.purchaseMessage(data._id, {});
      setBought(true);
      dispatch(updateBalance({ token: -price }));
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'An error occurred, please try again');
    }
  };

  const removeMessage = async () => {
    if (!window.confirm('')) return;
    await messageService.deleteMessage(data._id);
    // dispatch(deleteMessageSuccess(data));
  };

  const menu = (
    <Menu>
      <Menu.Item onClick={() => removeMessage()}>Delete</Menu.Item>
    </Menu>
  );

  return (
    <div
      id={data._id}
      className={[
        'message',
        `${isMine ? 'mine' : ''}`,
        `${startsSequence ? 'start' : ''}`,
        `${endsSequence ? 'end' : ''}`
      ].join(' ')}
    >
      {['photo', 'video'].includes(type) && (
        <div className="bubble-container">
          {!isMine && <img alt="" className="avatar" src={recipient?.avatar || '/static/no-avatar.png'} />}
          <div className={['photo', 'video'].includes(type) ? 'bubble media' : 'bubble'} title={friendlyTimestamp}>
            <div className={(canView || teaser || thumbnail) ? 'media-viewer' : 'media-viewer blured'}>
              {type === 'photo' && canView && <ImagesViewer thumbSpacing={6} photos={images} />}
              {!canView && !teaser && <div className="thumbnail"><Image preview={false} src={thumbUrl} alt="thumb" /></div>}
              {type === 'video' && canView && (
                <>
                  {video?.url ? (
                    <VideoStatusPlayer
                      key={video._id}
                      videoOptions={{
                        autoplay: false,
                        controls: true,
                        playsinline: true,
                        poster: thumbUrl,
                        fluid: true
                      }}
                      type="message"
                      data={data}
                      fileId={video._id}
                    />
                  ) : (
                    <TranscodeVideoPlayer
                      key={data?._id}
                      videoOptions={{
                        autoplay: true,
                        controls: true,
                        playsinline: true,
                        poster: thumbUrl,
                        fluid: true
                      }}
                      type="message"
                      data={data}
                      fileId={video?._id}
                    />
                  )}
                </>
              )}
              {!canView && teaser && (
                <>
                  <VideoPlayer
                    key={data?._id}
                    {...{
                      autoplay: false,
                      controls: true,
                      playsinline: true,
                      poster: thumbUrl,
                      fluid: true,
                      sources: [
                        {
                          src: teaser?.url,
                          type: 'video/mp4'
                        },
                        {
                          src: '/static/sample-video.mp4',
                          type: 'video/mp4'
                        }
                      ]
                    }}
                  />
                </>
              )}
              {(!canView && !teaser && !thumbnail) && <span className="lock-ico"><KeyOutlined /></span>}
            </div>
            <div className="ms-stats">
              <span>{type === 'photo' ? 'Gallery complete' : 'Video complete'}</span>
              <span className="stat-end">
                {type === 'photo' ? <FileImageOutlined /> : <VideoCameraAddOutlined />}
                {' '}
                {type === 'photo' ? images?.length : videoDuration(video?.duration || 0)}
              </span>
            </div>
            {audio && <AudioPlayer source={audio?.url} />}
            {/* eslint-disable-next-line react/no-danger */}
            <div className="txt" dangerouslySetInnerHTML={{ __html: replaceURLs(text) }} />
            {isSale && !bought && (
              <Button block className="primary" onClick={() => purchaseMessage()}>
                Unlock by $
                {(price || 0).toFixed(2)}
              </Button>
            )}
            {!isSale && !isSubscribed && (
              <Button
                block
                className="primary"
                onClick={() => Router.push({
                  pathname: '/model/profile',
                  query: {
                    username: recipient?.username || recipient?._id
                  }
                })}
              >
                TO SIGN
              </Button>
            )}
            {isMine && !data.isDeleted && (
              <Dropdown
                className="remove-icon"
                overlay={menu}
                placement="bottomCenter"
                trigger={['click']}
              >
                <a>
                  <EllipsisOutlined style={{ transform: 'rotate(90deg)' }} />
                </a>
              </Dropdown>
            )}
          </div>
          {isMine && <img alt="" src={currentUser?.avatar || '/static/no-avatar.png'} className="avatar" />}
        </div>
      )}
      {type === 'text' && (
        <div className="bubble-container">
          {!isMine && <Avatar alt="" className="avatar" src={recipient?.avatar || '/static/no-avatar.png'} />}
          <div className="bubble" title={friendlyTimestamp}>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: replaceURLs(text) }} />
            {audio && <AudioPlayer source={audio?.url} />}
            {isMine && !data.isDeleted && (
              <Dropdown
                className="remove-icon"
                overlay={menu}
                placement="bottomCenter"
                trigger={['click']}
              >
                <a>
                  <EllipsisOutlined style={{ transform: 'rotate(90deg)' }} />
                </a>
              </Dropdown>
            )}
          </div>
          {isMine && <Avatar alt="" src={currentUser?.avatar || '/static/no-avatar.png'} className="avatar" />}
        </div>
      )}
      {text && type === 'broadcast' && (
        <div className="bubble-container">
          <div className="bubble custom" title={friendlyTimestamp}>
            {/* eslint-disable-next-line react/no-danger */}
            <div dangerouslySetInnerHTML={{ __html: replaceURLs(text) }} />
          </div>
        </div>
      )}
      {showTimestamp && <div className="timestamp">{friendlyTimestamp}</div>}
    </div>
  );
}
