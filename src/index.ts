import React, {
  createElement,
  memo, NamedExoticComponent, ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  create,
  MiddleWare,
  withMiddleWare,
  LifecycleMiddleWare,
  Action,
  AgentReducer,
  DefaultActionType,
  Model,
  weakSharing,
  Factory,
  SharingRef,
  getSharingType,
  Reducer,
  ReducerPadding,
  addEffect,
  EffectWrap,
  EffectCallback,
} from 'agent-reducer';

export function useAgentReducer<T extends Model<S>, S>(
  entry: T | { new(): T },
  ...mdws: MiddleWare[]
): T {
  const reducerRef = useRef<null | AgentReducer<S, T>>(null);

  const initialed = reducerRef.current !== null;

  if (!initialed) {
    reducerRef.current = create(entry, ...mdws);
  }

  const reducer = reducerRef.current as Reducer<S, Action>&ReducerPadding<S, T>;

  const [state, dispatch] = useReducer(reducer, reducer.agent.state);

  const dispatcher = (action:Action) => {
    dispatch({ ...action, state: reducer.agent.state });
  };

  useLayoutEffect(
    () => {
      if (reducer) {
        reducer.connect(dispatcher);
      }
      if (reducer.agent.state !== state) {
        dispatcher({ type: DefaultActionType.DX_MUTE_STATE, state: reducer.agent.state });
      }
      return () => {
        const { current: red } = reducerRef;
        if (!red) {
          return;
        }
        red.disconnect();
      };
    },
    [],
  );

  return reducer.agent;
}

export function useMiddleWare<T extends Model<S>, S>(
  agent: T,
  ...middleWare: (MiddleWare | LifecycleMiddleWare)[]
): T {
  const { current } = useRef(withMiddleWare(agent, ...middleWare));
  return current;
}

export function useAgentSelector<T extends Model<S>, S, R>(
  entry: T,
  mapStateCallback: (state: T['state']) => R,
  equalityFn?: (prev: R, current: R) => boolean,
): R {
  const reducerRef = useRef<null | AgentReducer<S, T>>(null);

  const initialed = reducerRef.current !== null;

  if (!initialed) {
    reducerRef.current = create(entry);
  }

  const reducer = reducerRef.current as Reducer<S, Action>&ReducerPadding<S, T>;

  const [state, dispatch] = useReducer(reducer, reducer.agent.state);

  const current = useMemo(() => mapStateCallback(state), [state]);

  const weakDispatch = (action: Action) => {
    const modelState = reducer.agent.state;
    const next = mapStateCallback(modelState);
    if (current === next || (equalityFn && equalityFn(current, next))) {
      return;
    }
    dispatch({ ...action, state: modelState });
  };

  const dispatchRef = useRef(weakDispatch);

  dispatchRef.current = weakDispatch;

  const dispatchWrap = (action: Action) => {
    dispatchRef.current(action);
  };

  useLayoutEffect(
    () => {
      if (reducer) {
        reducer.connect(dispatchWrap);
      }
      dispatchRef.current({ type: DefaultActionType.DX_MUTE_STATE, state: reducer.agent.state });
      return () => {
        const { current: red } = reducerRef;
        if (!red) {
          return;
        }
        red.disconnect();
      };
    },
    [],
  );

  return current;
}

export function useAgentMethods<T extends Model<S>, S>(
  entry: T,
  ...middleWares: MiddleWare[]
): Omit<T, 'state'> {
  const reducerRef = useRef<null | AgentReducer<S, T>>(null);

  const initialed = reducerRef.current !== null;

  if (!initialed) {
    reducerRef.current = create(entry, ...middleWares);
  }

  const reducer = reducerRef.current as Reducer<S, Action>&ReducerPadding<S, T>;

  useLayoutEffect(
    () => {
      if (reducer) {
        reducer.connect();
      }
      return () => {
        const { current: red } = reducerRef;
        if (!red) {
          return;
        }
        red.disconnect();
      };
    },
    [],
  );

  return reducer.agent;
}

type ContextValue={
  parent:ContextValue|null,
  currents?:Record<string, Model>
};

const ModelContext = React.createContext<ContextValue|null>(null);

function recreateWeakSharingModel(model:Model) {
  return getSharingType(model) === 'weak' ? model : weakSharing(() => model).current;
}

export function useModelProvider(
  models: Model|Record<string, Model>|Array<Model>,
  isRootProvider?: boolean,
):NamedExoticComponent<{ children?: ReactNode }> {
  return useMemo(() => memo((
    { children }: { children?: ReactNode },
  ) => {
    const contextValue = useContext(ModelContext);
    const parent = isRootProvider ? null : contextValue;
    const value = useMemo(() => {
      const entries = Object.entries(models);
      const hasState = entries.some(([k]) => k === 'state');
      if (hasState) {
        return { parent, currents: { current: recreateWeakSharingModel(models as Model) } };
      }
      const e = entries.map(([k, v]) => {
        const current = recreateWeakSharingModel(v);
        return [k, current];
      });
      const currents = Object.fromEntries(e);
      return { parent, currents };
    }, []);
    return createElement(ModelContext.Provider, { value }, children);
  }), []);
}

function findModelBy(
  contextValue:ContextValue|null,
  call:(current:[string, Model])=>boolean,
):Model|undefined {
  if (!contextValue) {
    return undefined;
  }
  const { parent, currents } = contextValue;
  const array = currents ? Object.entries(currents) : [];
  const pair = array.find(call);
  if (pair) {
    const [, model] = pair;
    return model;
  }
  if (!parent) {
    return undefined;
  }
  return findModelBy(parent, call);
}

export function useModel<T extends Model>(
  key: string| number| { new(...args:any[]): T },
  defaultModel?:T,
):T {
  const parent = useContext(ModelContext);
  const result = useMemo(() => {
    if (typeof key !== 'function') {
      return findModelBy(parent, ([k]) => k === key.toString());
    }
    return findModelBy(parent, ([, model]) => Object.getPrototypeOf(model).constructor === key);
  }, []) as T;
  if (result) {
    return result;
  }
  if (!defaultModel) {
    throw new Error('Can not find the model.');
  }
  return defaultModel;
}

export function useAgentEffect<S, T extends Model<S>=Model<S>>(
  callback:EffectCallback<S>,
  target:T,
  ...methods:(((...args:any[])=>any)|string)[]
):void {
  const effectRef = useRef<EffectWrap<S, T>|null>(null);

  if (effectRef.current !== null) {
    effectRef.current.update(callback);
  }

  useEffect(() => {
    if (!methods || !methods.length) {
      const effect = addEffect<S, T>(callback, target);
      effectRef.current = effect;
      return () => {
        effectRef.current = null;
        effect.unmount();
      };
    }
    const effects = methods.map((method) => addEffect(callback, target, method));
    return () => {
      effects.forEach((effect) => {
        effect.unmount();
      });
    };
  }, []);
}

export function useWeakSharing<
    S,
    T extends Model<S> = Model<S>>(factory:Factory<S, T>):SharingRef<S, T> {
  const sharingRef = useRef<SharingRef<S, T>|null>(null);
  if (sharingRef.current) {
    return sharingRef.current;
  }
  sharingRef.current = weakSharing(factory);
  return sharingRef.current;
}

function isObject<T>(data: T): boolean {
  return data && Object.prototype.toString.apply(data) === '[object Object]';
}

export function shallowEqual<R>(prev: R, current: R): boolean {
  if (Object.is(prev, current)) {
    return true;
  }
  if (!isObject(prev) || !isObject(current)) {
    return false;
  }
  const prevKeys = Object.keys(prev);
  const currentKeys = Object.keys(current);
  if (prevKeys.length !== currentKeys.length) {
    return false;
  }
  const pre = (prev as Record<string, unknown>);
  const curr = (current as Record<string, unknown>);
  const hasDiffKey = prevKeys.some((key) => !Object.prototype.hasOwnProperty.call(curr, key));
  if (hasDiffKey) {
    return false;
  }
  const hasDiffValue = currentKeys.some((key) => {
    const currentValue = curr[key];
    const prevValue = pre[key];
    return !Object.is(currentValue, prevValue);
  });
  return !hasDiffValue;
}
