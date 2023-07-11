import { PureComponent } from 'react';
import { Select, message, Avatar } from 'antd';
import { debounce } from 'lodash';
import { performerService } from '@services/performer.service';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  placeholder?: string;
  style?: Record<string, string>;
  onSelect: Function;
  defaultValue?: string;
  disabled?: boolean;
  intl: IntlShape
}

class SelectPerformerDropdown extends PureComponent<IProps> {
  state = {
    loading: false,
    data: [] as any
  };

  loadPerformers = debounce(async (q) => {
    const { intl } = this.props;
    try {
      this.setState({ loading: true });
      const resp = await (await performerService.search({ q, limit: 99 })).data;
      this.setState({
        data: resp.data,
        loading: false
      });
    } catch (e) {
      const err = await e;
      message.error(err?.message || intl.formatMessage({ id: 'errorOccured', defaultMessage: 'Error occured' }));
      this.setState({ loading: false });
    }
  }, 500);

  componentDidMount() {
    this.loadPerformers('');
  }

  render() {
    const {
      style, onSelect, defaultValue, disabled, intl
    } = this.props;
    const { data, loading } = this.state;
    return (
      <Select
        showSearch
        defaultValue={defaultValue}
        placeholder={intl.formatMessage({ id: 'typeToSearchTeacherHere', defaultMessage: 'Type to search teacher here...' })}
        style={style}
        onSearch={this.loadPerformers.bind(this)}
        onChange={(val) => onSelect(val)}
        loading={loading}
        optionFilterProp="children"
        disabled={disabled}
      >
        <Select.Option value="" key="default">
          {intl.formatMessage({ id: 'allModel', defaultMessage: 'All Model' })}
        </Select.Option>
        {data && data.length > 0 && data.map((u) => (
          <Select.Option value={u._id} key={u._id} style={{ textTransform: 'capitalize' }}>
            <Avatar size={30} src={u?.avatar || '/static/no-avatar.png'} />
            {' '}
            {`${u?.name || u?.username}`}
          </Select.Option>
        ))}
      </Select>
    );
  }
}

export default injectIntl(SelectPerformerDropdown);
