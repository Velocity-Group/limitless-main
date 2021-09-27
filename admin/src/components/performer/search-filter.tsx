import React, { PureComponent } from 'react';
import {
  Input, Row, Col, Select
} from 'antd';

interface IProps {
  onSubmit: Function;
}

export class SearchFilter extends PureComponent<IProps> {
  state = {
    q: '',
    gender: '',
    status: ''
  };

  render() {
    const { onSubmit } = this.props;
    return (
      <Row gutter={24}>
        <Col lg={8} xs={24}>
          <Input
            placeholder="Enter keyword"
            onChange={(evt) => this.setState({ q: evt.target.value })}
            onPressEnter={() => onSubmit(this.state, () => onSubmit(this.state))}
          />
        </Col>
        <Col lg={8} xs={24}>
          <Select
            defaultValue=""
            style={{ width: '100%' }}
            onChange={(status) => this.setState({ status }, () => onSubmit(this.state))}
          >
            <Select.Option value="">Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Suspend</Select.Option>
            <Select.Option value="pending-email-confirmation">
              Pending Email Confirmation
            </Select.Option>
          </Select>
        </Col>
        <Col lg={8} xs={24}>
          <Select
            defaultValue=""
            style={{ width: '100%' }}
            onChange={(gender) => this.setState({ gender }, () => onSubmit(this.state))}
          >
            <Select.Option value="">Gender</Select.Option>
            <Select.Option key="male" value="male">
              Male
            </Select.Option>
            <Select.Option key="female" value="female">
              Female
            </Select.Option>
            <Select.Option key="transgender" value="transgender">
              Transgender
            </Select.Option>
          </Select>
        </Col>
      </Row>
    );
  }
}
