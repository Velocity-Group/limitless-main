import { PureComponent } from 'react';
import {
  Row, Button,
  Col, Modal
} from 'antd';
import { } from '@ant-design/icons';
import { injectIntl, IntlShape } from 'react-intl';
import './index.less';

interface IProps {
  onAddPollDuration: Function;
  openDurationPollModal: boolean;
  intl:IntlShape
}

class AddPollDurationForm extends PureComponent<IProps> {
  state = {
    limitTime: 7
  };

  async onChangePoll(value) {
    this.setState({ limitTime: value });
  }

  render() {
    const { intl, onAddPollDuration, openDurationPollModal = false } = this.props;
    const { limitTime } = this.state;

    return (
      <Modal
        title={`${intl.formatMessage({ id: 'pollDuration', defaultMessage: 'Poll duration' })} - ${!limitTime ? intl.formatMessage({ id: 'noLimit', defaultMessage: 'No limit' }) : `${limitTime} ${intl.formatMessage({ id: 'days', defaultMessage: 'days' })}`}`}
        visible={openDurationPollModal}
        onCancel={() => onAddPollDuration(7)}
        onOk={() => onAddPollDuration(limitTime)}
      >
        <Row>
          <Col span={4.5}>
            <Button type={limitTime === 1 ? 'primary' : 'default'} onClick={this.onChangePoll.bind(this, 1)}>
              1
              {' '}
              {intl.formatMessage({ id: 'day', defaultMessage: 'day' })}
            </Button>
          </Col>
          <Col span={4.5}>
            <Button type={limitTime === 3 ? 'primary' : 'default'} onClick={this.onChangePoll.bind(this, 3)}>
              3
              {' '}
              {intl.formatMessage({ id: 'days', defaultMessage: 'days' })}
            </Button>
          </Col>
          <Col span={4.5}>
            <Button type={limitTime === 7 ? 'primary' : 'default'} onClick={this.onChangePoll.bind(this, 7)}>
              7
              {' '}
              {intl.formatMessage({ id: 'days', defaultMessage: 'days' })}
            </Button>
          </Col>
          <Col span={4.5}>
            <Button type={limitTime === 30 ? 'primary' : 'default'} onClick={this.onChangePoll.bind(this, 30)}>
              30
              {' '}
              {intl.formatMessage({ id: 'days', defaultMessage: 'days' })}
            </Button>
          </Col>
          <Col span={6}>
            <Button type={limitTime === 0 ? 'primary' : 'default'} onClick={this.onChangePoll.bind(this, 0)}>{intl.formatMessage({ id: 'noLimit', defaultMessage: 'No limit' })}</Button>
          </Col>
        </Row>
      </Modal>
    );
  }
}
export default injectIntl(AddPollDurationForm);
