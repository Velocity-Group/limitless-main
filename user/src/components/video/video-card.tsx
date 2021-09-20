import { PureComponent } from 'react';
import {
  EyeOutlined, LikeOutlined, HourglassOutlined, LockOutlined, UnlockOutlined
} from '@ant-design/icons';
import { Tooltip, Button } from 'antd';
import Link from 'next/link';
import { videoDuration, shortenLargeNumber } from '@lib/index';
import { IVideo } from 'src/interfaces';
import './video.less';

interface IProps {
  video: IVideo;
}

export class VideoCard extends PureComponent<IProps> {
  render() {
    const { video } = this.props;
    const canView = (!video.isSale && video.isSubscribed) || (video.isSale && video.isBought);
    const thumbUrl = (video?.thumbnail?.thumbnails && video?.thumbnail?.thumbnails[0]) || video?.thumbnail?.url || (video?.teaser?.thumbnails && video?.teaser?.thumbnails[0]) || (video?.video?.thumbnails && video?.video?.thumbnails[0]) || '/static/no-image.jpg';
    return (
      <Link
        href={{ pathname: '/video', query: { id: video.slug || video._id } }}
        as={`/video/${video.slug || video._id}`}
      >
        <div className="vid-card">
          {video.isSale && video.price > 0 && (
          <span className="vid-price">
            <div className="label-price">
              <img alt="coin" src="/static/coin-ico.png" width="15px" />
              {(video.price || 0).toFixed(2)}
            </div>
          </span>
          )}
          <div className="vid-thumb">
            <div className="card-bg" style={canView ? { backgroundImage: `url(${thumbUrl})` } : { backgroundImage: `url(${thumbUrl})`, filter: 'blur(15px)' }} />
            <div className="vid-stats">
              <span>
                <a>
                  <EyeOutlined />
                  {' '}
                  {shortenLargeNumber(video?.stats?.views || 0)}
                </a>
                <a>
                  <LikeOutlined />
                  {' '}
                  {shortenLargeNumber(video?.stats?.likes || 0)}
                </a>
              </span>
              <a>
                <HourglassOutlined />
                {' '}
                {videoDuration(video?.video?.duration || 0)}
              </a>
            </div>
            <div className="lock-middle">
              {canView ? <UnlockOutlined /> : <LockOutlined />}
              {(!video.isSale && !video.isSubscribed) && <Button type="link">Subscribe to unlock</Button>}
              {(video.isSale && !video.isBought) && <Button type="link">Pay now to unlock</Button>}
            </div>
          </div>
          <div className="vid-info">
            <Tooltip title={video.title}>
              <a>{video.title}</a>
            </Tooltip>
          </div>
        </div>
      </Link>
    );
  }
}
