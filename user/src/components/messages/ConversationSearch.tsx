import React from 'react';
import './ConversationSearch.less';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl } from 'react-intl';

interface IProps {
  onSearch: any;
}

const ConversationSearch = ({ onSearch }: IProps) => {
  const intl = useIntl();

  return (
    <div className="conversation-search">
      <SearchOutlined />
      <input
        onChange={onSearch}
        type="search"
        className="conversation-search-input"
        placeholder={intl.formatMessage({ id: 'searchContact', defaultMessage: 'Search Contact...' })}
      />
    </div>
  );
};

export default ConversationSearch;
