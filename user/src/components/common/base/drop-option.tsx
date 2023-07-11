import { PureComponent } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Button, Menu } from 'antd';
import { IntlShape, injectIntl } from 'react-intl';

interface IProps {
  onMenuClick: any,
  menuOptions?: any[],
  buttonStyle?: any,
  dropdownProps?: any,
  intl: IntlShape;
}

class DropOption extends PureComponent<IProps> {
  render() {
    const {
      onMenuClick, menuOptions = [], buttonStyle, dropdownProps, intl
    } = this.props;
    const menu = menuOptions.map((item) => (
      <Menu.Item key={item.key}>{item.name}</Menu.Item>
    ));
    return (
      <Dropdown
        overlay={<Menu onClick={onMenuClick}>{menu}</Menu>}
        {...dropdownProps}
      >
        <Button style={{ border: 'none', ...buttonStyle }}>
          {intl.formatMessage({ id: 'sort', defaultMessage: 'Sort' })}
          <DownOutlined />
        </Button>
      </Dropdown>
    );
  }
}
export default injectIntl(DropOption);
