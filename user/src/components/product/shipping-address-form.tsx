import {
  Button, Form, Input, message, Select, Row, Col
} from 'antd';
import { ICountry } from '@interfaces/index';
import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';

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
  const intl = useIntl();

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
      onFinishFailed={() => message.error(intl.formatMessage({ id: 'pleaseCompleteTheRequiredFields', defaultMessage: 'Please complete the required fields' }))}
      name="form-address"
      className="account-form"
    >
      <Row>
        <Col md={24} xs={24}>
          <Form.Item
            name="name"
            label={intl.formatMessage({ id: 'addressName', defaultMessage: 'Address Name' })}
            rules={[
              {
                required: true, message: `${intl.formatMessage({ id: 'pleaseEnterAddressName!', defaultMessage: 'Please enter address name!' })}`
              }
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'schoolHomeWork', defaultMessage: 'School, home, Work,...' })} />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="country"
            label={intl.formatMessage({ id: 'country', defaultMessage: 'Country' })}
            rules={[
              {
                required: true, message: `${intl.formatMessage({ id: 'pleaseSelectYourCountry', defaultMessage: 'Please select your country!' })}`
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
            label={intl.formatMessage({ id: 'state', defaultMessage: 'State' })}
            rules={[
              {
                required: true, message: `${intl.formatMessage({ id: 'pleaseSelectYourState', defaultMessage: 'Please select your state!' })}`
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
            label={intl.formatMessage({ id: 'city', defaultMessage: 'City' })}
            rules={[
              {
                required: true, message: `${intl.formatMessage({ id: 'pleaseSelectYourCity', defaultMessage: 'Please select your city!' })}`
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
            label={intl.formatMessage({ id: 'district', defaultMessage: 'District' })}
            rules={[
              {
                required: true, message: `${intl.formatMessage({ id: 'pleaseEnterYourDistrict', defaultMessage: 'Please enter your district!' })} `
              }
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'district', defaultMessage: 'District' })} />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="ward"
            label={intl.formatMessage({ id: 'ward', defaultMessage: 'Ward' })}
            rules={[
              {
                required: true, message: `${intl.formatMessage({ id: 'pleaseEnterYourWard', defaultMessage: 'Please enter your ward!' })}`
              }
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'ward', defaultMessage: 'Ward' })} />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="streetAddress"
            label={intl.formatMessage({ id: 'streetAddress', defaultMessage: 'Street Address' })}
            rules={[
              {
                required: true, message: `${intl.formatMessage({ id: 'pleaseSelectYourStreetAddress', defaultMessage: 'Please select your street address!' })}`
              }
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'streetAddress', defaultMessage: 'Street Address' })} />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="streetNumber"
            label={intl.formatMessage({ id: 'streetNumber', defaultMessage: 'Street Number' })}
            rules={[
              {
                required: true, message: `${intl.formatMessage({ id: 'pleaseSelectYourStreetNumber', defaultMessage: 'Please select your street number!' })}`
              }
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'streetNumber', defaultMessage: 'Street Number' })} />
          </Form.Item>
        </Col>
        <Col md={12} xs={12}>
          <Form.Item
            name="zipCode"
            label={intl.formatMessage({ id: 'zipCode', defaultMessage: 'Zip Code' })}
            rules={[
              { required: true, message: `${intl.formatMessage({ id: 'pleaseProvideYourZipCode', defaultMessage: 'Please provide your zip code' })}` },
              {
                pattern: new RegExp(/^\d{2,10}$/g), message: `${intl.formatMessage({ id: 'pleaseProvideValidDigitNumbers', defaultMessage: 'Please provide valid digit numbers' })}`
              }
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: 'zipCode', defaultMessage: 'Zip Code' })} />
          </Form.Item>
        </Col>
        <Col md={24} xs={24}>
          <Form.Item
            name="description"
            label={intl.formatMessage({ id: 'description', defaultMessage: 'Description' })}
          >
            <Input.TextArea placeholder={intl.formatMessage({ id: 'description', defaultMessage: 'Description' })} />
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
          {intl.formatMessage({ id: 'save', defaultMessage: 'Save' })}
        </Button>
        <Button
          className="secondary"
          onClick={() => onCancel()}
        >
          {intl.formatMessage({ id: 'Cancel', defaultMessage: 'Cancel' })}
        </Button>
      </div>
    </Form>
  );
};
