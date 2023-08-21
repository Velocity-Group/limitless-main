import { Input, Select } from 'antd';
import { debounce } from 'lodash';
import './index.less';
import { IntlShape, useIntl } from 'react-intl';

interface IProps {
  onFilter: Function;
  onSearch: Function;
  searching: boolean
}
const { Search } = Input;

export function FilterBar({ onFilter, onSearch: handleSearch, searching }: IProps) {
  const intl: IntlShape = useIntl();

  const onSearch = debounce(async (e) => {
    const value = (e.target && e.target.value) || '';
    handleSearch({
      q: value
    });
  }, 500);

  const handleSelect = (value: string) => {
    onFilter({
      time: value
    });
  };

  return (
    <div className="filter-option">
      <Select defaultValue="" onChange={handleSelect}>
        <Select.Option value="">{intl.formatMessage({ id: 'allTime', defaultMessage: 'All Time' })}</Select.Option>
        <Select.Option value="month">{intl.formatMessage({ id: 'thisMonth', defaultMessage: 'This Month' })}</Select.Option>
        <Select.Option value="week">{intl.formatMessage({ id: 'thisWeek', defaultMessage: 'This Week' })}</Select.Option>
      </Select>
      <Search
        placeholder={`${intl.formatMessage({ id: 'typeToSearch', defaultMessage: 'Type to search' })}...`}
        onChange={(e) => {
          e.persist();
          onSearch(e);
        }}
        loading={searching}
        allowClear
        enterButton
      />
    </div>
  );
}
