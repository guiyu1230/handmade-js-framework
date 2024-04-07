## 手写仿form form. 
http://localhost:3000/#/form

### 第一阶段：实现数据管理

- Form.tsx: Form 表单组件
- FormStore.ts: FormStore 管理公共状态的对象
- Field.tsx: Form.Item 表单字段组件

`Field`，在手写`Field`类之前需要明确其要如何处理控件：我们通过`React.cloneElement`向控件的`props`隐式混入`value`和`onChange`，从而使控件变成受控组件，当然这两个值可以分别通过`Form.Item.props`里的`valuePropName`和`trigger`设置。而`value`是注入`formStore`的`store`里对应的值，而`onChang`e 会注入一个自定义的方法，在其方法里会调用`formStore.updateValue`。

效果总结:

1. 首先可以看到，两次修改表单控件数据顺利，且点击`FieldContext`里面查看`formStore`里的`store`，数据有对应的变化(要来回切换组件才看到，因为并非用`setStat`e 或`useState`更新，所以 devtools 没有即时更新)。
2. `Form`和`Form.Item`的`initialValues`同时设置`username`的值，但刷新页面时显示`Form`中设置的值，这优先级逻辑与`Antd Form`的一致
3. 是否是管理员的勾选框所在的`Form.Item`中我们设置了`valuePropName`属性。而在运行中`formStore`里的`store`的 is_admin 值变化无误。说明该值生效。

### 第二阶段：实现数据管理

用户交互功能主要有三个：

1. 提交：点击提交按钮后，调用`Form.props.onFinish`
2. 重置：点击重置按钮后，重置表单值且调用`Form.props.onReset`
3. 监听变化：表单中控件的值发生变化时，调用`Form.props.onValuesChange`

```tsx
const Form: React.FC<FormProps> = ({
  initialValues,
  children,
  onValuesChange,
  onFinish,
  onReset,
}) => {
  return (
    <form
      onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        formStore.current.submit();
      }}
      onReset={(event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        formStore.current.resetFields();
        onReset?.(event);
      }}
    >
      {wrapperNode}
    </form>
  );
};
```

总结:

- onValuesChange 设置成功，且返回参数中有显示哪个形参发生变化。
  onFinish 设置成功。
- 重置功能成功。且点击重置时，“用户名”的值置为“123”而不是“456”。因为- Form 设置的 initialValue 比 Form.Item 的优先级高。

### 第三阶段：实现获取表单实例

获取表单实例其实就是通过`React.createRef`或者`React.useRef`创建 ref 对象。然后在`Form`实例上注入`ref`参数获取表单实例。当然在函数组件里也可以通过`Form.useForm`直接获取表单实例。

`Form.useForm`内部也是使用`React.useRef`创建对象

```js
// FormStore.ts
export function useForm(form?: FormInstance): [FormInstance] {
  const formRef = React.useRef<FormInstance>();

  if (!formRef.current) {
    // form作为参数，若form不为空，则不会创建且会把form存入formRef里
    if (form) {
      formRef.current = form;
      // 若form为空，则创建formStore且把getForm()返回的对象存入formRef里
    } else {
      const formStore: FormStore = new FormStore();
      formRef.current = formStore.getForm();
    }
  }
  // 最后返回formRef.current
  return [formRef.current];
}
```

```js
// Form.tsx
// 注意此处的Form类型不再是React.FC<FormProps>，因为要考虑到ref注入的情况，所以类型改成下面这种
const Form: React.ForwardRefRenderFunction<FormInstance, FormProps> = (
  { form, initialValues, children, onValuesChange, onFinish, onReset },
  ref,
) => {
  // 不再用new FormStore()创建formStore，而是用useForm获取
  const [formInstance] = useForm(form);

  // 如果用户是通过ref获取表单实例，则通过useImperativeHandle把formInstance返回出去
  React.useImperativeHandle(ref, () => formInstance);

  const fieldContextValue = useMemo(
    // 这里以解构又组合的做法是为了防止用户在App中乱改formInstance(例如把formInstance.submit指向null)，从而影响Form和Form.Item内部调用
    () => ({
      ...formInstance,
    }),
    [formInstance],
  );

  const wrapperNode = (
    <FieldContext.Provider value={fieldContextValue}>{children}</FieldContext.Provider>
  );

  return (
    // ... 跟以前一样，无需再次展示
  );
};
```

`useForm`方法的巧妙设计. 允许组件内外的`ref`实例为共享实例. `Form`组件外创建的实例可以传递给组件内 再传递给`useImperativeHandle`. 如果`Form`组件外未创建实例.则组件内创建实例. 再传递给`useImperativeHandle`. 从而保证`实例共享`. 符合设计模式的`单例模式`思想
