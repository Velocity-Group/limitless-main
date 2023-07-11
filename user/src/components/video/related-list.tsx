import { PureComponent } from 'react';
import { Row, Col } from 'antd';
import { IVideo } from 'src/interfaces/video';
import { injectIntl, IntlShape } from 'react-intl';
import { VideoCard } from './video-card';

interface IProps {
  videos: any;
  intl:IntlShape
}

class RelatedListVideo extends PureComponent<IProps> {
  render() {
    const { videos, intl } = this.props;
    return (
      <Row>
        {videos.length > 0
          ? videos.map((video: IVideo) => (
            <Col xs={12} sm={12} md={6} lg={6} key={video._id}>
              <VideoCard video={video} />
            </Col>
          )) : <p>{intl.formatMessage({ id: 'noVideoWasFound', defaultMessage: ' No video was found' })}</p>}
      </Row>
    );
  }
}
export default injectIntl(RelatedListVideo);
