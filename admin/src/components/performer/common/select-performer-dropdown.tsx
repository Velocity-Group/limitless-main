import { PureComponent } from 'react';
import { Select, message, Avatar } from 'antd';
import { debounce } from 'lodash';
import { performerService } from '@services/performer.service';

interface IProps {
  placeholder?: string;
  style?: Record<string, string>;
  onSelect: Function;
  defaultValue?: string;
  disabled?: boolean;
  showAll?: boolean;
}

export class SelectPerformerDropdown extends PureComponent<IProps> {
  state = {
    loading: false,
    data: [],
    isFirstLoaded: false
  };

  loadPerformers = debounce(async (q) => {
    try {
      await this.setState({ loading: true });
      const resp = await (await performerService.search({ q, limit: 99, role: 'performer' })).data;
      this.setState({
        data: resp.data,
        loading: false,
        isFirstLoaded: true
      });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured');
      this.setState({ loading: false, isFirstLoaded: true });
    }
  }, 500);

  componentDidMount() {
    this.loadPerformers('');
  }

  render() {
    const {
      style, onSelect, defaultValue, disabled, showAll
    } = this.props;
    const { data, loading, isFirstLoaded } = this.state;
    return (
      <>
        {isFirstLoaded && (
        <Select
          showSearch
          defaultValue={defaultValue}
          placeholder="Type to search model here"
          style={style}
          onSearch={this.loadPerformers.bind(this)}
          onChange={(val) => onSelect(val)}
          loading={loading}
          optionFilterProp="children"
          disabled={disabled}
        >
          <Select.Option value="" key="default" disabled={showAll}>
            {showAll ? 'Select a model' : 'All models'}
          </Select.Option>
          {data && data.length > 0 && data.map((u) => (
            <Select.Option value={u._id} key={u._id} style={{ textTransform: 'capitalize' }}>
              <Avatar size={28} src={u?.avatar || '/no-avatar.png'} />
              {' '}
              {`${u?.name || u?.username || 'no_name'}`}
            </Select.Option>
          ))}
        </Select>
        )}
      </>
    );
  }
}
