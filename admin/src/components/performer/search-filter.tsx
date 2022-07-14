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
        <Col lg={4} xs={12}>
          <Select
            defaultValue={status}
            style={{ width: '100%' }}
            onChange={(val) => this.setState({ status: val }, () => onSubmit(this.state))}
          >
            <Select.Option value="">All Statuses</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Col>
        <Col lg={4} xs={12}>
          <Select
            defaultValue={verifiedDocument}
            style={{ width: '100%' }}
            onChange={(val) => this.setState({ verifiedEmail: val }, () => onSubmit(this.state))}
          >
            <Select.Option value="">All Email Verification</Select.Option>
            <Select.Option key="verified" value="true">
              Verified Email
            </Select.Option>
            <Select.Option key="notVerified" value="false">
              Not Verified Email
            </Select.Option>
          </Select>
        </Col>
        <Col lg={4} xs={12}>
          <Select
            defaultValue=""
            style={{ width: '100%' }}
            onChange={(val) => this.setState({ verifiedDocument: val }, () => onSubmit(this.state))}
          >
            <Select.Option value="">All ID Verification</Select.Option>
            <Select.Option key="verified" value="true">
              Verified ID
            </Select.Option>
            <Select.Option key="notVerified" value="false">
              Not Verified ID
            </Select.Option>
          </Select>
        </Col>
        <Col lg={4} xs={12}>
          <Select
            defaultValue=""
            style={{ width: '100%' }}
            onChange={(val) => this.setState({ verifiedAccount: val }, () => onSubmit(this.state))}
          >
            <Select.Option value="">All Account Verification</Select.Option>
            <Select.Option key="verified" value="true">
              Verified Account
            </Select.Option>
            <Select.Option key="notVerified" value="false">
              Not Verified Account
            </Select.Option>
          </Select>
        </Col>
      </Row>
    );
  }
}
