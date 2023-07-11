import { DropdownAction } from '@components/common';
import {
  Input, Table, Form, Button, Space
} from 'antd';
import { ILanguage } from 'src/interfaces';
import { formatDate } from 'src/lib/date';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface IProps {
  dataSource: ILanguage[];
  rowKey?: string;
  loading?: boolean;
  onChange: Function;
  onDelete: Function;
  onUpdate: Function;
  pagination: any;
}

const LanguageSettingTable = ({
  dataSource,
  rowKey,
  loading,
  onChange,
  onDelete,
  onUpdate,
  pagination
}: IProps) => {
  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const isEditing = (id: string) => id === editingKey;

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    children,
    ...restProps
  }: any) => {
    const inputNode = <Input />;
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: `Please Input ${title}!`
              }
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  const save = async () => {
    const store = await form.validateFields();
    const record = dataSource.find((d) => d._id === editingKey);
    if (record) {
      onUpdate && onUpdate({ ...record, ...store });
      setEditingKey('');
    }
  };

  const renderAction = (record: ILanguage) => [
    {
      key: 'update',
      name: 'Update',
      children: (
        <span>
          <EditOutlined />
          {' '}
          Update
        </span>
      ),
      onClick: () => {
        form.setFieldsValue({
          key: '', value: '', locale: '', ...record
        });
        setEditingKey(record._id);
      }
      // onClick: () => [form.setFieldsValue({
      //   key: '', value: '', locale: '', ...record
      // }), setEditingKey(record._id)]
    },
    {
      key: 'delete',
      name: 'Delete',
      children: (
        <span>
          <DeleteOutlined />
          {' '}
          Delete
        </span>
      ),
      onClick: () => onDelete && onDelete(record._id)
    }
  ];
  const column = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      editable: true,
      sorter: true
    },
    {
      title: 'Locale',
      dataIndex: 'locale',
      key: 'locale',
      editable: true,
      sorter: true
    },
    {
      title: 'Text',
      dataIndex: 'value',
      key: 'value',
      editable: true,
      sorter: true
    },
    {
      title: 'Date',
      key: 'updatedAt',
      dataIndex: 'updatedAt',
      render: (createdAt: Date) => (
        <span>{formatDate(createdAt, 'DD/MM/YYYY HH:mm')}</span>
      ),
      sorter: true
    },
    {
      title: '#',
      key: 'action',
      render: (record: ILanguage) => {
        const { _id } = record;
        const editable = isEditing(_id);
        if (editable) {
          return (
            <Space>
              <Button onClick={save}>Save</Button>
              <Button onClick={() => setEditingKey('')}>Cancel</Button>
            </Space>
          );
        }
        return <DropdownAction menuOptions={renderAction(record)} />;
      }
    }
  ];
  const mergedColumns = column.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: ILanguage) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record._id)
      })
    };
  });

  return (
    <Form form={form} component={false}>
      <Table
        columns={mergedColumns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        onChange={onChange.bind(this)}
        pagination={pagination}
        scroll={{ x: 700, y: 500 }}
        components={{
          body: {
            cell: EditableCell
          }
        }}
      />
    </Form>
  );
};

LanguageSettingTable.defaultProps = {
  rowKey: '',
  loading: false
};

export default LanguageSettingTable;
