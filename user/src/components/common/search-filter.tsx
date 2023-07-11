import { PureComponent } from 'react';
import {
  Input, Row, Col, Select, DatePicker
} from 'antd';
import SelectPerformerDropdown from '@components/performer/common/select-performer-dropdown';
import { injectIntl, IntlShape } from 'react-intl';

const { RangePicker } = DatePicker;
interface IProps {
  onSubmit?: Function;
  statuses?: {
    key: string;
    text?: string;
  }[];
  type?: {
    key: string;
    text?: string;
  }[];
  subscriptionTypes?: {
    key: string;
    text?: string;
  }[];
  searchWithPerformer?: boolean;
  searchWithKeyword?: boolean;
  dateRange?: boolean;
  isFree?: boolean;
  intl: IntlShape;
}

class SearchFilter extends PureComponent<IProps> {
  state = {
    q: '',
    status: '',
    type: '',
    subscriptionType: '',
    performerId: '',
    isFree: '',
    fromDate: '',
    toDate: ''
  }

  render() {
    const {
      statuses = [],
      type = [],
      searchWithPerformer,
      searchWithKeyword,
      dateRange,
      isFree,
      onSubmit,
      intl,
      subscriptionTypes
    } = this.props;
    return (
      <Row className="search-filter">
        {searchWithKeyword && (
          <Col lg={8} md={8} xs={12}>
            <Input
              placeholder={intl.formatMessage({ id: 'enterKeyword', defaultMessage: 'Enter keyword' })}
              onChange={(evt) => this.setState({ q: evt.target.value })}
              onPressEnter={() => onSubmit(this.state)}
            />
          </Col>
        )}
        {statuses && statuses.length ? (
          <Col lg={8} md={8} xs={12}>
            <Select
              onChange={(val) => this.setState({ status: val }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'selectStatus', defaultMessage: 'Select status' })}
              defaultValue=""
            >
              {statuses.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {type && type.length ? (
          <Col lg={8} md={8} xs={12}>
            <Select
              onChange={(val) => this.setState({ type: val }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'selectType', defaultMessage: 'Select type' })}
              defaultValue=""
            >
              {type.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {subscriptionTypes && subscriptionTypes.length ? (
          <Col lg={8} md={8} xs={12}>
            <Select
              onChange={(val) => this.setState({ subscriptionType: val }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder="Select type"
              defaultValue=""
            >
              {subscriptionTypes.map((s) => (
                <Select.Option key={s.key} value={s.key}>
                  {s.text || s.key}
                </Select.Option>
              ))}
            </Select>
          </Col>
        ) : null}
        {searchWithPerformer && (
          <Col lg={8} md={8} xs={12}>
            <SelectPerformerDropdown
              placeholder={intl.formatMessage({ id: 'searchModel', defaultMessage: 'Search model here' })}
              style={{ width: '100%' }}
              onSelect={(val) => this.setState({ performerId: val || '' }, () => onSubmit(this.state))}
            />
          </Col>
        )}
        {dateRange && (
          <Col lg={8} md={8} xs={12}>
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
        )}
        {isFree && (
          <Col lg={8} md={8} xs={12}>
            <Select
              onChange={(val) => this.setState({ isFree: val }, () => onSubmit(this.state))}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'selectType', defaultMessage: 'Select type' })}
              defaultValue=""
            >
              <Select.Option key="" value="">
                {intl.formatMessage({ id: 'allType', defaultMessage: 'All type' })}
              </Select.Option>
              <Select.Option key="free" value="true">
                {intl.formatMessage({ id: 'free', defaultMessage: 'Free' })}
              </Select.Option>
              <Select.Option key="paid" value="false">
                {intl.formatMessage({ id: 'paid', defaultMessage: 'Paid' })}
              </Select.Option>
            </Select>
          </Col>
        )}
      </Row>
    );
  }
}

export default injectIntl(SearchFilter);
