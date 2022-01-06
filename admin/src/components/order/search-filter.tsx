import { PureComponent } from 'react';
import {
  Row, Col, Select, DatePicker
} from 'antd';

const { RangePicker } = DatePicker;

const deliveryStatuses = [
  {
    key: '',
    text: 'Delivery Status'
  },
  {
    key: 'processing',
    text: 'Processing'
  },
  {
    key: 'shipping',
    text: 'Shipped'
  },
  {
    key: 'delivered',
    text: 'Delivered'
  },
  {
    key: 'refunded',
    text: 'Refunded'
  }
];

interface IProps {
  onSubmit?: Function;
}

export class OrderSearchFilter extends PureComponent<IProps> {
  state = {
    deliveryStatus: '',
    fromDate: '',
    toDate: ''
  };

  render() {
    const { onSubmit } = this.props;
    return (
      <Row gutter={24}>
        <Col lg={6} md={12} xs={12}>
          <Select
            onChange={(val) => this.setState({ deliveryStatus: val }, () => onSubmit(this.state))}
            style={{ width: '100%' }}
            placeholder="Select delivery status"
            defaultValue=""
          >
            {deliveryStatuses.map((s) => (
              <Select.Option key={s.key} value={s.key}>
                {s.text || s.key}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col lg={8} md={12} xs={12}>
          <RangePicker
            onChange={(dates: [any, any], dateStrings: [string, string]) => this.setState({
              fromDate: dateStrings[0],
              toDate: dateStrings[1]
            }, () => onSubmit(this.state))}
          />
        </Col>
      </Row>
    );
  }
}
