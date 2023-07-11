import { PureComponent } from 'react';
import {
  Table, Button, Tag, InputNumber, message
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { ImageProduct } from '@components/product/image-product';
import { IProduct } from 'src/interfaces';
import { injectIntl, IntlShape } from 'react-intl';

interface IProps {
  dataSource: IProduct[];
  rowKey: string;
  loading?: boolean;
  pagination?: {};
  onChange?: Function;
  deleteItem?: Function;
  onChangeQuantity?: Function;
  intl: IntlShape;
  onRemoveItemCart?: Function;
}

class TableCart extends PureComponent<IProps> {
  timeout = 0;

  render() {
    const {
      dataSource,
      rowKey,
      loading,
      onRemoveItemCart,
      onChangeQuantity,
      intl
    } = this.props;
    const changeQuantity = async (item, quantity: any) => {
      if (!quantity) return;
      try {
        if (this.timeout) clearTimeout(this.timeout);
        let remainQuantity = quantity;
        this.timeout = window.setTimeout(async () => {
          if (quantity > item.stock) {
            remainQuantity = item.stock;
            message.error(intl.formatMessage({ id: 'quantityMustNotBeLargerThanQuantityInStock', defaultMessage: 'Quantity must not be larger than quantity in stock' }));
          }
          onChangeQuantity(item, remainQuantity);
        }, 300);
      } catch (error) {
        message.error(intl.formatMessage({ id: 'anErrorOccurredPleaseTryAgain', defaultMessage: 'An error occurred, please try again!' }));
      }
    };
    const columns = [
      {
        title: '',
        dataIndex: 'image',
        render(data, record) {
          return <ImageProduct product={record} />;
        }
      },
      {
        title: intl.formatMessage({ id: 'name', defaultMessage: 'Name' }),
        dataIndex: 'name'
      },
      {
        title: intl.formatMessage({ id: 'price', defaultMessage: 'Price' }),
        dataIndex: 'price',
        render(price: number) {
          return (
            <span>
              $
              {price.toFixed(2)}
            </span>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'type', defaultMessage: 'Type' }),
        dataIndex: 'type',
        render(type: string) {
          switch (type) {
            case 'physical':
              return (
                <Tag color="#7b5cbd">
                  {intl.formatMessage({ id: 'physical', defaultMessage: 'Physical' })}
                </Tag>
              );
            case 'digital':
              return <Tag color="#00dcff">{intl.formatMessage({ id: 'digital', defaultMessage: 'Digital' })}</Tag>;
            default:
              break;
          }
          return <Tag color="#00dcff">{type}</Tag>;
        }
      },
      {
        title: intl.formatMessage({ id: 'stock', defaultMessage: 'Stock' }),
        dataIndex: 'stock',
        render(stock: number, record) {
          return <span>{record.type === 'physical' && (stock || intl.formatMessage({ id: 'outOfStock', defaultMessage: 'Out of stock' }))}</span>;
        }
      },
      {
        title: intl.formatMessage({ id: 'quantity', defaultMessage: 'Quantity' }),
        dataIndex: 'quantity',
        render(quantity, record) {
          return (
            <InputNumber
              value={quantity || 1}
              onChange={(event) => changeQuantity(record, event)}
              type="number"
              min={1}
              disabled={record.type !== 'physical'}
            />
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'provisionallyCharged', defaultMessage: 'Provisionally charged' }),
        dataIndex: 'quantity',
        render(data, record) {
          return (
            <span>
              $
              {((record.quantity || 1) * record.price).toFixed(2)}
            </span>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'action', defaultMessage: 'Action' }),
        dataIndex: '',
        render(data, record) {
          return (
            <Button className="danger" onClick={() => onRemoveItemCart(record)}>
              <DeleteOutlined />
            </Button>
          );
        }
      }
    ];
    return (
      <div className="table-responsive table-cart">
        <Table
          dataSource={dataSource}
          columns={columns}
          rowKey={rowKey}
          loading={loading}
          pagination={false}
        />
      </div>
    );
  }
}
export default injectIntl(TableCart);
