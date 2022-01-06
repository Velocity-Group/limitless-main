import { PureComponent } from 'react';
import { Select, message, Avatar } from 'antd';
import { debounce } from 'lodash';
import { userService } from '@services/user.service';

interface IProps {
  placeholder?: string;
  style?: Record<string, string>;
  onSelect: Function;
  defaultValue?: string;
  disabled?: boolean;
  showAll?: boolean;
}

export class SelectUserDropdown extends PureComponent<IProps> {
  state = {
    loading: false,
    data: [],
    isFirstLoaded: false
  };

  loadUsers = debounce(async (q) => {
    try {
      await this.setState({ loading: true });
      const resp = await (await userService.search({
        q,
        limit: 99
      })).data;
      this.setState({
        data: resp.data,
        isFirstLoaded: true,
        loading: false
      });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured');
      this.setState({ loading: false, isFirstLoaded: true });
    }
  }, 500);

  componentDidMount() {
    this.loadUsers('');
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
          placeholder="Type to search user here"
          style={style}
          onSearch={this.loadUsers.bind(this)}
          onChange={(val) => onSelect(val)}
          loading={loading}
          optionFilterProp="children"
          disabled={disabled}
        >
          <Select.Option value="" key="default" disabled={showAll}>
            {showAll ? 'Select a user' : 'All users'}
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
