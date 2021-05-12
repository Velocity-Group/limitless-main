/* eslint-disable dot-notation */
/* eslint-disable camelcase */
import { StreamSettings } from 'src/interfaces';
import { streamService } from 'src/services';
import Router from 'next/router';
import classnames from 'classnames';
import React, { PureComponent } from 'react';
import withAntmedia from 'src/antmedia';
import { WEBRTC_ADAPTOR_INFORMATIONS } from 'src/antmedia/constants';
import { SocketContext } from 'src/socket';
import '../../index.less';

interface IProps {
  participantId?: string;
  classNames?: string;
  webRTCAdaptor: any;
  initWebRTCAdaptor: Function;
  publish_started: boolean;
  initialized: boolean;
  leaveSession: Function;
  id?: string;
  containerClassName?: string;
  settings: StreamSettings;
}

interface States {
  conversationId: string;
  streamId?: string;
}

class GroupWebrtcPublisher extends PureComponent<IProps, States> {
  private socket;

  constructor(props) {
    super(props);
    this.state = {
      streamId: '',
      conversationId: ''
    };
  }

  componentDidMount() {
    this.socket = this.context;
    Router.events.on('routeChangeStart', this.onbeforeunload);
    window.addEventListener('beforeunload', this.onbeforeunload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onbeforeunload);
    Router.events.off('routeChangeStart', this.onbeforeunload);
  }

  async handler(info) {
    const { webRTCAdaptor, settings } = this.props;
    const { conversationId, streamId } = this.state;
    if (info === WEBRTC_ADAPTOR_INFORMATIONS.INITIALIZED) {
      const token = await streamService.getPublishToken({ streamId, settings });
      webRTCAdaptor.publish(streamId, token);
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_STARTED) {
      this.socket.emit('private-stream/join', {
        conversationId,
        streamId
      });
    } else if (info === WEBRTC_ADAPTOR_INFORMATIONS.PUBLISH_FINISHED) {
      this.socket.emit('private-stream/leave', {
        conversationId,
        streamId
      });
    }
  }

  onbeforeunload = () => {
    const { publish_started, webRTCAdaptor } = this.props;
    const { conversationId, streamId } = this.state;
    if (publish_started) {
      webRTCAdaptor && webRTCAdaptor.leaveFromRoom(conversationId);
      this.socket.emit('private-stream/leave', {
        conversationId,
        streamId
      });
    }
  };

  start(conversationId: string) {
    this.setState({ conversationId });
  }

  async publish(streamId: string) {
    const { initWebRTCAdaptor } = this.props;
    await this.setState({ streamId });
    initWebRTCAdaptor(this.handler.bind(this));
  }

  stop() {
    const { leaveSession } = this.props;
    leaveSession();
  }

  render() {
    const { publish_started, id, classNames } = this.props;
    return (
      <video
        id={id}
        className={classnames('video-js', classNames)}
        hidden={!publish_started}
        autoPlay
        playsInline
        muted
      />
    );
  }
}

GroupWebrtcPublisher.contextType = SocketContext;
export default withAntmedia(GroupWebrtcPublisher);
