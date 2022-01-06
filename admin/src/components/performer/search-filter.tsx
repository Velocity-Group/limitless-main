import React, { PureComponent } from 'react';
import {
  Input, Row, Col, Select
} from 'antd';

interface IProps {
  onSubmit: Function;
  defaultValue?: {
    status?: string,
    verifiedDocument?: string
  };
}

export class SearchFilter extends PureComponent<IProps> {
  componentDidMount() {
    const { defaultValue } = this.props;
    defaultValue && this.setState({ ...defaultValue });
  }

  render() {
    const { onSubmit, defaultValue } = this.props;
    const {
      status = '', verifiedDocument = ''
    } = defaultValue;

    return (
      <Row gutter={24}>
        <Col lg={6} xs={24}>
          <Input
            placeholder="Enter keyword"
            onChange={(evt) => this.setState({ q: evt.target.value })}
            onPressEnter={() => onSubmit(this.state, () => onSubmit(this.state))}
          />
        </Col>
        <Col lg={6} xs={24}>
          <Select
            defaultValue={status}
            style={{ width: '100%' }}
            onChange={(val) => this.setState({ status: val }, () => onSubmit(this.state))}
          >
            <Select.Option value="">All Statuses</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
            <Select.Option value="pending-email-confirmation">
              Not verified email
            </Select.Option>
          </Select>
        </Col>
        <Col lg={6} xs={24}>
          <Select
            defaultValue=""
            style={{ width: '100%' }}
            onChange={(val) => this.setState({ gender: val }, () => onSubmit(this.state))}
          >
            <Select.Option value="">All Genders</Select.Option>
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
        <Col lg={6} xs={24}>
          <Select
            defaultValue={verifiedDocument}
            style={{ width: '100%' }}
            onChange={(val) => this.setState({ verifiedDocument: val }, () => onSubmit(this.state))}
          >
            <Select.Option value="">All verified ID statuses</Select.Option>
            <Select.Option key="verified" value="true">
              Verified ID
            </Select.Option>
            <Select.Option key="notVerified" value="false">
              Not Verified ID
            </Select.Option>
          </Select>
        </Col>
      </Row>
    );
  }
}
