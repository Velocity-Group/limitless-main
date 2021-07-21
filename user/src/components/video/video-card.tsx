import { PureComponent } from 'react';
import {
  EyeOutlined,
  LikeOutlined,
  HourglassOutlined
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import Link from 'next/link';
import { videoDuration } from '@lib/index';
import { IVideo } from '../../interfaces';
import './video.less';

interface IProps {
  video: IVideo;
}

export class VideoCard extends PureComponent<IProps> {
  render() {
    const { video } = this.props;
    const thumbUrl = (video?.thumbnail?.thumbnails && video?.thumbnail?.thumbnails[0]) || video?.thumbnail?.url || (video?.teaser?.thumbnails && video?.teaser?.thumbnails[0]) || (video?.video?.thumbnails && video?.video?.thumbnails[0]) || '/static/placeholder-image.jpg';
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
              {video.price.toFixed(2)}
            </div>
          </span>
          )}
          <div className="vid-thumb" style={{ backgroundImage: `url(${thumbUrl})` }}>
            <div className="vid-stats">
              <span>
                <a>
                  <EyeOutlined />
                  {' '}
                  {video?.stats?.views || 0}
                </a>
                <a>
                  <LikeOutlined />
                  {' '}
                  {video?.stats?.likes || 0}
                </a>
              </span>
              <a>
                <HourglassOutlined />
                {' '}
                {videoDuration(video?.video?.duration || 0)}
              </a>
            </div>
          </div>
          <div className="vid-info">
            <Tooltip title={video.title}>
              <Link
                href={{ pathname: '/video', query: { id: video.slug || video._id } }}
                as={`/video/${video.slug || video._id}`}
              >
                <span>{video.title}</span>
              </Link>
            </Tooltip>
          </div>
        </div>
      </Link>
    );
  }
}
