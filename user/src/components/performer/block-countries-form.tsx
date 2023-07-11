/* eslint-disable no-template-curly-in-string */
import { PureComponent } from 'react';
import { Form, Button, Select } from 'antd';
import { IBlockCountries, ICountry } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';

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
    range: 'Must be between ${min} and ${max}'
  }
};

interface IProps {
  onFinish: Function;
  blockCountries?: IBlockCountries;
  updating?: boolean;
  countries?: ICountry[];
  intl: IntlShape;
}

const { Option } = Select;

class PerformerBlockCountriesForm extends PureComponent<IProps> {
  render() {
    const {
      onFinish, blockCountries, updating, countries, intl
    } = this.props;
    return (
      <Form
        {...layout}
        name="nest-messages"
        onFinish={onFinish.bind(this)}
        validateMessages={validateMessages}
        initialValues={blockCountries}
        labelAlign="left"
        className="account-form"
      >
        <Form.Item
          name="countryCodes"
          label={intl.formatMessage({
            id: 'selectCountriesYouWantToBlock',
            defaultMessage: 'Select countries you want to block'
          })}
        >
          <Select showSearch optionFilterProp="label" mode="multiple">
            {countries
              && countries.length > 0
              && countries.map((c) => (
                <Option value={c.code} label={c.name} key={c.code}>
                  <img alt="country_flag" src={c.flag} width="25px" />
                  {' '}
                  {c.name}
                </Option>
              ))}
          </Select>
        </Form.Item>
        <Form.Item className="text-center">
          <Button
            type="primary"
            htmlType="submit"
            className="primary"
            loading={updating}
          >
            {intl.formatMessage({
              id: 'saveChanges',
              defaultMessage: 'Save Changes'
            })}
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default injectIntl(PerformerBlockCountriesForm);
