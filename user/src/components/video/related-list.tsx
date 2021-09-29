import { PureComponent } from 'react';
import { Row, Col } from 'antd';
import { IVideo } from 'src/interfaces/video';
import { VideoCard } from './video-card';

interface IProps {
  videos: any;
}

export class RelatedListVideo extends PureComponent<IProps> {
  render() {
    const { videos } = this.props;
    return (
      <Row>
        {videos.length > 0
          ? videos.map((video: IVideo) => (
            <Col xs={12} sm={12} md={6} lg={6} key={video._id}>
              <VideoCard video={video} />
            </Col>
          )) : <p>No video was found</p>}
      </Row>
    );
  }
}
