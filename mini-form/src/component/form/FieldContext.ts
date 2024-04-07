import * as React from 'react';
import type { FormInstance } from './FormStore';

export type FieldContextValues = FormInstance;

// @ts-ignore
const Context = React.createContext<FieldContextValues>({});

Context.displayName = 'FieldContext';

export default Context;
