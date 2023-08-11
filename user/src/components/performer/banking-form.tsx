import { PureComponent, createRef } from 'react';
import {
  Form, Input, Button, Row, Col, Select
} from 'antd';
import { utilsService } from 'src/services';
import { IPerformer, ICountry } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';

const { Option } = Select;
const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 }
};

const validateMessages = {
  required: 'This field is required!',
  types: {
    email: 'Not a validate email!',
    number: 'Not a validate number!'
  },
  number: {
    // eslint-disable-next-line no-template-curly-in-string
    range: 'Must be between ${min} and ${max}'
  }
};

interface IProps {
  onFinish: Function;
  user: IPerformer;
  updating?: boolean;
  countries?: ICountry[];
  intl:IntlShape
}

class PerformerBankingForm extends PureComponent<IProps> {
  state = {
    states: [],
    cities: []
  };

  formRef = createRef() as any;

  componentDidMount() {
    const { user } = this.props;
    if (user?.bankingInformation?.country) {
      this.handleGetStates(user?.bankingInformation?.country);
      if (user?.bankingInformation?.state) {
        this.handleGetCities(user?.bankingInformation?.state, user?.bankingInformation?.country);
      }
    }
  }

  handleGetStates = async (countryCode: string) => {
    const { user } = this.props;
    const resp = await utilsService.statesList(countryCode);
    await this.setState({ states: resp.data });
    const eState = resp.data.find((s) => s === user?.bankingInformation?.state);
    if (eState) {
      this.formRef.setFieldsValue({ state: eState });
    } else {
      this.formRef.setFieldsValue({ state: '', city: '' });
    }
  };

  handleGetCities = async (state: string, countryCode: string) => {
    const { user } = this.props;
    const resp = await utilsService.citiesList(countryCode, state);
    await this.setState({ cities: resp.data });
    const eCity = resp.data.find((s) => s === user?.bankingInformation?.city);
    if (eCity) {
      this.formRef.setFieldsValue({ city: eCity });
    } else {
      this.formRef.setFieldsValue({ city: '' });
    }
  };

  render() {
    const {
      onFinish, user, updating, countries, intl
    } = this.props;
    const { states, cities } = this.state;
    return (
      <Form
        {...layout}
        name="nest-messages"
        onFinish={onFinish.bind(this)}
        validateMessages={validateMessages}
        initialValues={user?.bankingInformation}
        labelAlign="left"
        className="account-form"
        ref={(ref) => { this.formRef = ref; }}
      >
        <Row>
          <Col xl={12} md={12} xs={12}>
            <Form.Item
              label={intl.formatMessage({ id: 'firstName', defaultMessage: 'First name' })}
              name="firstName"
              rules={[
                { required: true, message: `${intl.formatMessage({ id: 'pleaseInputYourFirstName', defaultMessage: 'Please input your first name!' })}` }
              ]}
            >
              <Input placeholder={intl.formatMessage({ id: 'firstName', defaultMessage: 'First name' })} />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item
              name="lastName"
              label={intl.formatMessage({ id: 'lastName', defaultMessage: 'Last name' })}
              rules={[
                { required: true, message: `${intl.formatMessage({ id: 'pleaseInputYourLastName', defaultMessage: 'Please input your last name!' })}` }
              ]}
            >
              <Input placeholder={intl.formatMessage({ id: 'lastName', defaultMessage: 'Last name' })} />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item
              name="bankName"
              label={intl.formatMessage({ id: 'bankName', defaultMessage: 'Bank name' })}
              rules={[
                { required: true, message: `${intl.formatMessage({ id: 'pleaseInputYourBankName', defaultMessage: 'Please input your bank name!' })}` }
              ]}
            >
              <Input placeholder={intl.formatMessage({ id: 'bankName', defaultMessage: 'Bank name' })} />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item
              name="bankAccount"
              label={intl.formatMessage({ id: 'bankAccount', defaultMessage: 'Bank Account' })}
              rules={[
                { required: true, message: `${intl.formatMessage({ id: 'pleaseInputYourBankAccount', defaultMessage: 'Please input your bank account!' })}` }
              ]}
            >
              <Input placeholder={intl.formatMessage({ id: 'bankAccount', defaultMessage: 'Bank Account' })} />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item
              name="country"
              label={intl.formatMessage({ id: 'country', defaultMessage: 'Country' })}
              rules={[{ required: true, message: `${intl.formatMessage({ id: 'pleaseChooseCountry', defaultMessage: 'Please choose country!' })}` }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                onChange={(val: string) => this.handleGetStates(val)}
              >
                {countries.map((c) => (
                  <Option key={c.code} value={c.code} label={c.name}>
                    <img alt="flag" src={c?.flag} width="20px" />
                    {' '}
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item name="state" label={intl.formatMessage({ id: 'state', defaultMessage: 'State' })}>
              <Select
                placeholder={intl.formatMessage({ id: 'selectYourState', defaultMessage: 'Select your state' })}
                optionFilterProp="label"
                showSearch
                onChange={(val: string) => this.handleGetCities(val, this.formRef.getFieldValue('country'))}
              >
                {states.map((state) => (
                  <Option value={state} label={state} key={state}>
                    {state}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item
              name="city"
              label={intl.formatMessage({ id: 'city', defaultMessage: 'City' })}
            >
              <Select
                placeholder={intl.formatMessage({ id: 'selectYourCity', defaultMessage: 'Select your city' })}
                showSearch
                optionFilterProp="label"
              >
                {cities.map((city) => (
                  <Option value={city} label={city} key={city}>
                    {city}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item name="address" label={intl.formatMessage({ id: 'address', defaultMessage: 'Address' })}>
              <Input placeholder={intl.formatMessage({ id: 'address', defaultMessage: 'Address' })} />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item name="bankRouting" label={intl.formatMessage({ id: 'bankRouting', defaultMessage: 'Bank Routing' })}>
              <Input placeholder={intl.formatMessage({ id: 'bankRouting', defaultMessage: 'Bank Routing' })} />
            </Form.Item>
          </Col>
          <Col xl={12} md={12} xs={12}>
            <Form.Item name="bankSwiftCode" label={intl.formatMessage({ id: 'bankSwiftCode', defaultMessage: 'Bank swift code' })}>
              <Input placeholder={intl.formatMessage({ id: 'bankSwiftCode', defaultMessage: 'Bank swift code' })} />
            </Form.Item>
          </Col>
          {/* <Col xl={12} md={12} xs={12}>
            <Form.Item name="SSN" label="SSN">
              <Input placeholder="SSN" />
            </Form.Item>
          </Col> */}
        </Row>
        <Form.Item className="text-center">
          <Button
            className="primary"
            htmlType="submit"
            loading={updating}
            disabled={updating}
          >
            {intl.formatMessage({ id: 'saveChanges', defaultMessage: 'Save Changes' })}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}
export default injectIntl(PerformerBankingForm);
