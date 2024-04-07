import type { Callbacks, FieldEntity, Store, NotifyInfo, ValuedNotifyInfo  } from './typings';
import React from 'react';

export interface FormInstance {
  getFieldValue: typeof FormStore.prototype.getFieldValue;
  getFieldsValue: typeof FormStore.prototype.getFieldsValue;
  setFieldsValue: typeof FormStore.prototype.setFieldsValue;
  submit: typeof FormStore.prototype.submit;
  resetFields: typeof FormStore.prototype.resetFields;
  getInternalHooks: typeof FormStore.prototype.getInternalHooks;
}

export interface internalHooks {
  updateValue: typeof FormStore.prototype.updateValue;
  initEntityValue: typeof FormStore.prototype.initEntityValue;
  registerField: typeof FormStore.prototype.registerField;
  setInitialValues: typeof FormStore.prototype.setInitialValues;
  setCallbacks: typeof FormStore.prototype.setCallbacks;
}

export class FormStore {
  // 保存数据状态变量
  private store: Store = {};
  // 保存Form表单中的Form.Item实例
  private fieldEntities: FieldEntity[] = [];
  // 保存初始值, 该初始值会受Form.props.initialValues和Form.Item.props.initialValue影响
  private initialValues: Store = {};
  private callbacks: Callbacks = {};

  public getForm = (): FormInstance => ({
    getFieldValue: this.getFieldValue,
    getFieldsValue: this.getFieldsValue,
    setFieldsValue: this.setFieldsValue,
    submit: this.submit,
    resetFields: this.resetFields,
    getInternalHooks: this.getInternalHooks,
  })

  public getInternalHooks = (): internalHooks => ({
    updateValue: this.updateValue,
    initEntityValue: this.initEntityValue,
    registerField: this.registerField,
    setInitialValues: this.setInitialValues,
    setCallbacks: this.setCallbacks,
  })

  // 设置initialValues，如果init为true，则顺带更新store
  public setInitialValues = (initialValues: Store | undefined, init: boolean) => {
    this.initialValues = initialValues || {};
    if(init) {
      this.store = {...this.store, ...initialValues};
    }
  };

  // 根据name获取store中的值
  public getFieldValue = (name: string) => {
    return this.store[name];
  }

  // 获取整个store
  public getFieldsValue = () => {
    return { ...this.store };
  }

  public setFieldsValue = (store: Store) => {
    const preStore = this.store;

    if(store) {
      this.store = { ...this.store, ...store };
    }

    this.notifyObservers(preStore, undefined, {
      type: 'valueUpdate',
      source: 'external'
    });
  };

  // 内部更新store的整个函数
  public updateValue  = (name: string | undefined, value: any) => {
    if(name === undefined) return;
    const preStore = this.store;
    this.store = {...this.store, [name]: value};
    this.notifyObservers(preStore, [name], {
      type: 'valueUpdate',
      source: 'internal'
    });

    const { onValuesChange} = this.callbacks;

    if(onValuesChange) {
      const changedValues = { [name]: this.store[name] };
      onValuesChange(changedValues, this.getFieldsValue());
    }
  };

  // 获取那些带name的Form.Item实例
  private getFieldEntities = () => {
    return this.fieldEntities.filter(field => field.props.name);
  }

  // 往fieldEntities注册Form.Item实例,每次Form.Item实例在componentDidMount时,都会调用该函数把自身注册到fieldEntities上
  // 最后返回一个接触注册函数
  public registerField = (entity: FieldEntity) => {
    this.fieldEntities.push(entity);
    
    return () => {
      this.fieldEntities = this.fieldEntities.filter(item => item !== entity);
    }
  };

  // Form.Item实例化时,在执行constructor期间调用该函数以更新initialValue
  public initEntityValue = (entity: FieldEntity) => {
    const { initialValue, name } = entity.props;
    if(name !== undefined) {
      const preValue = this.store[name];

      if(preValue === undefined) {
        this.store = { ...this.store, [name]: initialValue };
      }
    }
  }

  // 生成更新信息mergedInfo且遍历所有的Form.Item实例调用其onStoreChange方法判断是否需要更新执行
  private notifyObservers = (
    preStore: Store,
    namePathList: string[] | undefined,
    info: NotifyInfo
  ) => {
    const mergedInfo: ValuedNotifyInfo  = {
      ...info,
      store: this.getFieldsValue()
    };
    this.getFieldEntities().forEach(({ onStoreChange }) => {
      onStoreChange(preStore, namePathList, mergedInfo);
    })
  }

  public setCallbacks = (callbacks: Callbacks) => {
    this.callbacks = callbacks;
  }

  public submit = () => {
    const { onFinish } = this.callbacks;
    if(onFinish) {
      onFinish(this.store);
    }
  };

  public resetFields = (nameList?: string[]) => {
    const preStore = this.store;
    if(!nameList) {
      this.store = { ...this.initialValues };
      this.resetWithFieldInitialValue();
      this.notifyObservers(preStore, undefined, { type: 'reset' });
      return;
    }
    nameList.forEach((name) => {
      this.store[name] = this.initialValues[name];
    });
    this.resetWithFieldInitialValue({ nameList });
    this.notifyObservers(preStore, nameList, { type: 'reset' });
  }

  private resetWithFieldInitialValue = (
    info: {
      entities?: FieldEntity[],
      nameList?: string[]
    } = {},
  ) => {
    const cache: Record<string, FieldEntity> = {};
    this.getFieldEntities().forEach(entity => {
      const { name, initialValue } = entity.props;
      if(initialValue !== undefined) {
        cache[name!] = entity;
      }
    });

    let requiredFieldEntities: FieldEntity[];
    if(info.entities) {
      requiredFieldEntities = info.entities;
    } else if(info.nameList) {
      requiredFieldEntities = [];
      info.nameList.forEach(name => {
        const record = cache[name];
        if(record) {
          requiredFieldEntities.push(record);
        }
      });
    } else {
      requiredFieldEntities = this.fieldEntities;
    }

    const resetWithFields = (entities: FieldEntity[]) => {
      entities.forEach(field => {
        const { initialValue, name } = field.props;
        if (initialValue !== undefined && name !== undefined) {
          const formIntialValue = this.initialValues[name];
          if(formIntialValue === undefined) {
            this.store[name] = initialValue;
          }
        }
      });
    };

    resetWithFields(requiredFieldEntities);
  }
}

export function useForm(form?: FormInstance): [FormInstance] {
  const formRef = React.useRef<FormInstance>();

  if(!formRef.current) {
    if(form) {
      formRef.current = form;
    } else {
      const formStore: FormStore = new FormStore();
      formRef.current = formStore.getForm();
    }
  }
  return [formRef.current]
}
