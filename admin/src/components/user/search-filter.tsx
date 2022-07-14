import React, { PureComponent } from 'react';
import {
  Button, Input, Row, Col, Select
} from 'antd';

interface IProps {
  onSubmit: Function;
  defaultStatus: string;
  defaultEmailStatus: string;
}

export class SearchFilter extends PureComponent<IProps> {
  render() {
    const { onSubmit, defaultStatus, defaultEmailStatus } = this.props;
    return (
      <Row gutter={24}>
        <Col md={5} xs={12}>
          <Input
            placeholder="Enter keyword"
            onChange={(evt) => this.setState({ q: evt.target.value })}
            onPressEnter={() => onSubmit(this.state)}
          />
        </Col>
        <Col md={5} xs={12}>
          <Select
            defaultValue=""
            style={{ width: '100%' }}
            onChange={(role) => this.setState({ role })}
          >
            <Select.Option value="">All Roles</Select.Option>
            <Select.Option value="admin">Admin</Select.Option>
            <Select.Option value="user">User</Select.Option>
          </Select>
        </Col>
        <Col md={5} xs={12}>
          <Select
            defaultValue={defaultStatus || ''}
            style={{ width: '100%' }}
            onChange={(status) => this.setState({ status })}
          >
            <Select.Option value="">All Statuses</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Col>
        <Col md={5} xs={12}>
          <Select
            defaultValue={defaultEmailStatus}
            style={{ width: '100%' }}
            onChange={(val) => this.setState({ verifiedEmail: val })}
          >
            <Select.Option key="" value="">Status</Select.Option>
            <Select.Option key="true" value="true">Verified Email</Select.Option>
            <Select.Option key="false" value="false">Not Verified Email</Select.Option>
          </Select>
        </Col>
        <Col md={4} xs={12}>
          <Button
            type="primary"
            onClick={() => onSubmit(this.state)}
          >
            Search
          </Button>
        </Col>
      </Row>
    );
  }
}
