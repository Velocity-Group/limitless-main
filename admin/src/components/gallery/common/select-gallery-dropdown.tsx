import React, { PureComponent } from 'react';
import { Select, message } from 'antd';
import { debounce } from 'lodash';
import { galleryService } from '@services/gallery.service';

interface IProps {
  placeholder?: string;
  style?: Record<string, string>;
  onSelect: Function;
  defaultValue?: string;
  disabled?: boolean;
  performerId?: string;
}

export class SelectGalleryDropdown extends PureComponent<IProps> {
  state = {
    loading: false,
    data: [] as any
  };

  loadGalleries = debounce(async (q) => {
    const { performerId } = this.props;
    try {
      this.setState({ loading: true });
      const resp = await (await galleryService.search({ q, performerId: performerId || '', limit: 99 })).data;
      this.setState({
        data: resp.data,
        loading: false
      });
    } catch (e) {
      const err = await e;
      message.error(err?.message || 'Error occured');
      this.setState({ loading: false });
    }
  }, 500);

  componentDidMount() {
    this.loadGalleries('');
  }

  componentDidUpdate(prevProps) {
    const { performerId } = this.props;
    if (prevProps.performerId !== performerId) {
      this.loadGalleries('');
    }
  }

  render() {
    const {
      style, onSelect, defaultValue, disabled
    } = this.props;
    const { data, loading } = this.state;
    return (
      <Select
        showSearch
        defaultValue={defaultValue || ''}
        placeholder="Type to search gallery here"
        style={style}
        onSearch={this.loadGalleries.bind(this)}
        onChange={(val) => onSelect(val)}
        loading={loading}
        optionFilterProp="children"
        disabled={disabled}
      >
        <Select.Option value="" key="default" style={{ textTransform: 'capitalize' }} disabled>
          Type to search gallery
        </Select.Option>
        {data && data.length > 0 && data.map((u) => (
          <Select.Option value={u._id} key={u._id} style={{ textTransform: 'capitalize' }}>
            {`${u.title}`}
          </Select.Option>
        ))}
      </Select>
    );
  }
}
