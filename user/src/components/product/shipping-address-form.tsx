import {
  Button, Form, Input, message, Select, Row, Col
} from 'antd';
import { ICountry } from '@interfaces/index';
import { useRef, useState } from 'react';

const citystatejson = require('countrycitystatejson');

interface IProps {
  submiting: boolean;
  onFinish: Function;
  countries: ICountry[];
  onCancel: Function;
}

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

export const ShippingAddressForm = ({
  submiting, onFinish, countries, onCancel
}: IProps) => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const formRef = useRef() as any;

  const handleGetStates = async (countryCode: string) => {
    if (!countryCode) return;
    const data = await citystatejson.getStatesByShort(countryCode);
    setStates(data);
  };

  const handleGetCities = async (state: string, countryCode: string) => {
    if (!state || !countryCode) return;
    const data = await citystatejson.getCities(countryCode, state);
    setCities(data);
  };

  return (
    <Form
      ref={formRef}
      {...layout}
      onFinish={(data) => onFinish(data)}
      onFinishFailed={() => message.error('Please complete the required fields')}
      name="form-address"
      className="account-form"
    >
      <Row>
        <Col md={24} xs={24}>
          <Form.Item
            name="name"
            label="Address Name"
            rules={[
              {
                required: true, message: 'Please enter address name!'
              }
            ]}
          >
            <Input placeholder="School, home, Work,..." />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="country"
            label="Country"
            rules={[
              {
                required: true, message: 'Please select your country!'
              }
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              onChange={(code: string) => handleGetStates(code)}
            >
              {countries.map((c) => (
                <Select.Option value={c.code} label={c.name} key={c.code}>
                  <img alt="country_flag" src={c.flag} width="25px" />
                  {' '}
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="state"
            label="State"
            rules={[
              {
                required: true, message: 'Please select your state!'
              }
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              onChange={(s: string) => handleGetCities(s, formRef.current.getFieldValue('country'))}
              placeholder="State/country/province"
            >
              <Select.Option value="n/a" key="N/A">
                N/A
              </Select.Option>
              {states.map((s) => (
                <Select.Option value={s} label={s} key={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="city"
            label="City"
            rules={[
              {
                required: true, message: 'Please select your city!'
              }
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="City"
            >
              <Select.Option value="n/a" key="N/A">
                N/A
              </Select.Option>
              {cities.map((c) => (
                <Select.Option value={c} label={c} key={c}>
                  {c}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="district"
            label="District"
            rules={[
              {
                required: true, message: 'Please enter your district!'
              }
            ]}
          >
            <Input placeholder="District" />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="ward"
            label="Ward"
            rules={[
              {
                required: true, message: 'Please enter your ward!'
              }
            ]}
          >
            <Input placeholder="Ward" />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="streetAddress"
            label="Street Address"
            rules={[
              {
                required: true, message: 'Please select your street address!'
              }
            ]}
          >
            <Input placeholder="Street Address" />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="streetNumber"
            label="Street Number"
            rules={[
              {
                required: true, message: 'Please select your street number!'
              }
            ]}
          >
            <Input placeholder="Street Number" />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="zipCode"
            label="Zip Code"
            rules={[
              { required: true, message: 'Please provide your zip code' },
              {
                pattern: new RegExp(/^\d{2,10}$/g), message: 'Please provide valid digit numbers'
              }
            ]}
          >
            <Input placeholder="Zip code" />
          </Form.Item>
        </Col>
        <Col md={24} xs={24}>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Description" />
          </Form.Item>

        </Col>
      </Row>
      <div className="text-center">
        <Button
          htmlType="submit"
          className="primary"
          type="primary"
          loading={submiting}
          disabled={submiting}
        >
          Save
        </Button>
        <Button
          className="secondary"
          onClick={() => onCancel()}
        >
          Cancel
        </Button>
      </div>
    </Form>
  );
};
