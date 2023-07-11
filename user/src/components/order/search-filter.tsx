import { PureComponent } from 'react';
import {
  Row, Col, Select, DatePicker
} from 'antd';
import { injectIntl, IntlShape } from 'react-intl';

const { RangePicker } = DatePicker;

interface IProps {
  onSubmit?: Function;
  intl: IntlShape
}

class OrderSearchFilter extends PureComponent<IProps> {
  state = {
    deliveryStatus: '',
    status: '',
    fromDate: '',
    toDate: ''
  };

  render() {
    const { onSubmit, intl } = this.props;

    const deliveryStatuses = [
      {
        key: 'processing',
        text: intl.formatMessage({ id: 'processing', defaultMessage: 'Processing' })
      },
      {
        key: 'shipping',
        text: intl.formatMessage({ id: 'shipped', defaultMessage: 'Shipped' })
      },
      {
        key: 'delivered',
        text: intl.formatMessage({ id: 'delivered', defaultMessage: 'Delivered' })
      },
      {
        key: 'refunded',
        text: intl.formatMessage({ id: 'refunded', defaultMessage: 'Refunded' })
      }
    ];

    return (
      <Row className="search-filter">
        <Col lg={6} md={8} xs={12}>
          <Select
            onChange={(val) => this.setState({ deliveryStatus: val }, () => onSubmit(this.state))}
            style={{ width: '100%' }}
            placeholder={intl.formatMessage({ id: 'selectDeliveryStatus', defaultMessage: 'Select delivery status' })}
            defaultValue=""
          >
            <Select.Option key="all" value="">
              {intl.formatMessage({ id: 'allDeliveryStatuses', defaultMessage: 'All delivery statuses' })}
            </Select.Option>
            {deliveryStatuses.map((s) => (
              <Select.Option key={s.key} value={s.key}>
                {s.text || s.key}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col lg={8} md={10} xs={12}>
          <RangePicker
            style={{ width: '100%' }}
            onChange={(dates: [any, any], dateStrings: [string, string]) => this.setState({
              fromDate: dateStrings[0],
              toDate: dateStrings[1]
            }, () => onSubmit(this.state))}
            placeholder={[intl.formatMessage({ id: 'startDate', defaultMessage: 'Start Date' }),
              intl.formatMessage({ id: 'endDate', defaultMessage: 'End Date' })]}
          />
        </Col>
      </Row>
    );
  }
}

export default injectIntl(OrderSearchFilter);
