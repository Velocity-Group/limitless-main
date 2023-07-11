import { PureComponent } from 'react';
import {
  Input, Button, Select
} from 'antd';
import { omit } from 'lodash';
import { ArrowUpOutlined, ArrowDownOutlined, FilterOutlined } from '@ant-design/icons';
import { ICountry, IBody } from '@interfaces/index';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  onSubmit: Function;
  countries: ICountry[];
  bodyInfo: IBody;
  intl: IntlShape
}

class PerformerAdvancedFilter extends PureComponent<IProps> {
  state = {
    showMore: false
  };

  handleSubmit() {
    const { onSubmit } = this.props;
    onSubmit(omit(this.state, ['showMore']));
  }

  render() {
    const { countries, bodyInfo, intl } = this.props;
    const { showMore } = this.state;
    const {
      heights = [], weights = [], bodyTypes = [], genders = [], sexualOrientations = [], ethnicities = [],
      hairs = [], eyes = [], butts = [], ages = []
    } = bodyInfo;

    return (
      <div style={{ width: '100%' }}>
        <div className="filter-block custom">
          <div className="filter-item custom">
            <Input
              placeholder={intl.formatMessage({ id: 'enterKeyword', defaultMessage: 'Enter keyword' })}
              onChange={(evt) => this.setState({ q: evt.target.value })}
              onPressEnter={this.handleSubmit.bind(this)}
            />
          </div>
          <div className="filter-item">
            <Select style={{ width: '100%' }} defaultValue="live" onChange={(val) => this.setState({ sortBy: val }, () => this.handleSubmit())}>
              <Select.Option value="" disabled>
                <FilterOutlined />
                {' '}
                {intl.formatMessage({ id: 'sortBy', defaultMessage: 'Sort by' })}
              </Select.Option>
              <Select.Option value="popular">
                {intl.formatMessage({ id: 'popular', defaultMessage: 'Popular' })}
              </Select.Option>
              <Select.Option label="" value="latest">
                {intl.formatMessage({ id: 'latest', defaultMessage: 'Latest' })}
              </Select.Option>
              <Select.Option value="oldest">
                {intl.formatMessage({ id: 'oldest', defaultMessage: 'Oldest' })}
              </Select.Option>
              <Select.Option value="online">
                {intl.formatMessage({ id: 'online', defaultMessage: 'Online' })}
              </Select.Option>
              <Select.Option value="live">
                {intl.formatMessage({ id: 'live', defaultMessage: 'Live' })}
              </Select.Option>
            </Select>
          </div>
          <div className="filter-item">
            <Button
              className="primary"
              style={{ width: '100%' }}
              onClick={() => this.setState({ showMore: !showMore })}
            >
              {intl.formatMessage({ id: 'advancedSearch', defaultMessage: 'Advanced search' })}
              {' '}
              {showMore ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            </Button>
          </div>
        </div>
        <div className={!showMore ? 'filter-block hide' : 'filter-block custom'}>
          <div className="filter-item">
            <Select
              // eslint-disable-next-line no-nested-ternary
              onChange={(val: any) => this.setState({ isFreeSubscription: val === 'false' ? false : val === 'true' ? true : '' }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allSubscriptions', defaultMessage: 'All Subscriptions' })}
              </Select.Option>
              <Select.Option key="false" value="false">
                {intl.formatMessage({ id: 'nonFreeSubscription', defaultMessage: 'Non-free Subscription' })}
              </Select.Option>
              <Select.Option key="true" value="true">
                {intl.formatMessage({ id: 'freeSubscription', defaultMessage: 'Free Subscription' })}
              </Select.Option>
            </Select>
          </div>
          {countries && countries.length > 0 && (
            <div className="filter-item">
              <Select
                onChange={(val) => this.setState({ country: val }, () => this.handleSubmit())}
                style={{ width: '100%' }}
                placeholder={intl.formatMessage({ id: 'countries', defaultMessage: 'Countries' })}
                defaultValue=""
                showSearch
                optionFilterProp="label"
              >
                <Select.Option key="All" label="" value="">
                  {intl.formatMessage({ id: 'allCountries', defaultMessage: 'All countries' })}
                </Select.Option>
                {countries.map((c) => (
                  <Select.Option key={c.code} label={c.name} value={c.code}>
                    <img alt="flag" src={c.flag} width="25px" />
                    &nbsp;
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ gender: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allGenders', defaultMessage: 'All genders' })}
              </Select.Option>
              {genders.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ sexualOrientation: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allSexualOrientations', defaultMessage: 'All sexual orientations' })}
              </Select.Option>
              {sexualOrientations.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ age: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'age', defaultMessage: 'Age' })}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allAges', defaultMessage: 'All ages' })}
              </Select.Option>
              {ages.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ eyes: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'eyeColor', defaultMessage: 'Eye color' })}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allEyeColors', defaultMessage: 'All eye colors' })}
              </Select.Option>
              {eyes.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ hair: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'hairColor', defaultMessage: 'Hair color' })}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allHairColors', defaultMessage: 'All hair colors' })}
              </Select.Option>
              {hairs.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ butt: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'buttSize', defaultMessage: 'Butt size' })}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allButtSizes', defaultMessage: 'All butt sizes' })}
              </Select.Option>
              {butts.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ height: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'height', defaultMessage: 'Height' })}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allHeights', defaultMessage: 'All heights' })}
              </Select.Option>
              {heights.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ weight: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'weight', defaultMessage: 'Weight' })}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allWeights', defaultMessage: 'All weights' })}
              </Select.Option>
              {weights.map((i) => (
                <Select.Option key={i.value} value={i.value}>
                  {intl.formatMessage({ id: i.value, defaultMessage: i.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ ethnicity: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'ethnicity', defaultMessage: 'Ethnicity' })}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allEthnicities', defaultMessage: 'All ethnicities' })}
              </Select.Option>
              {ethnicities.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ bodyType: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              placeholder={intl.formatMessage({ id: 'bodyType', defaultMessage: 'Body type' })}
              defaultValue=""
            >
              <Select.Option key="all" value="">
                {intl.formatMessage({ id: 'allBodyTypes', defaultMessage: 'All body types' })}
              </Select.Option>
              {bodyTypes.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {intl.formatMessage({ id: s.value, defaultMessage: s.text })}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="filter-item">
            <Select
              onChange={(val) => this.setState({ streamingStatus: val }, () => this.handleSubmit())}
              style={{ width: '100%' }}
              defaultValue=""
            >
              <Select.Option key="streaming-all" value="">
                {intl.formatMessage({ id: 'allStreamingStatus', defaultMessage: 'All streaming status' })}
              </Select.Option>
              <Select.Option key="streaming-live" value="public">
                {intl.formatMessage({ id: 'live', defaultMessage: 'Live' })}
              </Select.Option>
            </Select>
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(PerformerAdvancedFilter);
