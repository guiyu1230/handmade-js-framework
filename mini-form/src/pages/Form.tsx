import { Input, Select, Checkbox } from 'antd';
import Form from '../component/form';

const initialValues = {
  username: '123',
  is_admin: true
}

function FormPage() {

  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('finish', values);
  }

  const onValuesChange = (changedValues: any, values: any) => {
    console.log('onValuesChange', changedValues, values);
  }

  const handleClick = () => {
    console.log(form, form.getFieldsValue())
  }

  return (
    <Form 
      form={form}
      initialValues={initialValues}
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
      <Form.Item label="用户名" name="username" initialValue="345">
        <Input type="text" style={{width: 400}} />
      </Form.Item>
      <Form.Item label="品牌" name="role" initialValue="saab">
        <Select>
          <Select.Option value="volvo">Volvo</Select.Option>
          <Select.Option value="saab">Saab</Select.Option>
          <Select.Option value="mercedes">Mercedes</Select.Option>
          <Select.Option value="audi">Audi</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="是否是管理员" name="is_admin" valuePropName="checked">
        <Checkbox />
      </Form.Item>
      <Form.Item label="备注">
        <Input style={{width: 400}} />
      </Form.Item>
      <Form.Item>
        <button type="button" onClick={handleClick}>查询实例</button>
        <button type="submit">提交</button>
        <input type="reset" value="重置" />
      </Form.Item>
    </Form>
  );
}

export default FormPage;
