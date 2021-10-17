import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  create,
  MiddleWare,
  OriginAgent,
  withMiddleWare,
  LifecycleMiddleWare,
  Action,
  AgentReducer,
  DefaultActionType,
  Model,
} from 'agent-reducer';

export function useAgentReducer<T extends Model<S>, S>(
  entry: T | { new (): T },
  ...mdws: MiddleWare[]
): T {
  const reducerRef = useRef<null | AgentReducer<S, T>>(null);

  if (reducerRef.current === null) {
    reducerRef.current = create(entry, ...mdws);
  }

  const { current: reducer } = reducerRef;

  const [state, dispatch] = useReducer(reducer, reducer.agent.state);

  useEffect(
    () => {
      if (reducer) {
        reducer.connect(dispatch);
      }
      if (reducer.agent.state !== state) {
        dispatch({ type: DefaultActionType.DX_MUTE_STATE, state: reducer.agent.state });
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
  equalityFn?:(prev: R, current: R)=>boolean,
): R {
  const reducerRef = useRef<null | AgentReducer<S, T>>(null);

  if (reducerRef.current === null) {
    reducerRef.current = create(entry);
  }

  const { current: reducer } = reducerRef;

  const [state, dispatch] = useReducer(reducer, reducer.agent.state);

  const current = useMemo(() => mapStateCallback(state), [state]);

  const weakDispatch = (action: Action) => {
    const next = mapStateCallback(action.state as S);
    if (current === next || (equalityFn && equalityFn(current, next))) {
      return;
    }
    dispatch(action);
  };

  const dispatchRef = useRef(weakDispatch);

  dispatchRef.current = weakDispatch;

  useEffect(
    () => {
      const dispatchWrap = (action:Action) => {
        dispatchRef.current(action);
      };
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

  if (reducerRef.current === null) {
    reducerRef.current = create(entry, ...middleWares);
  }

  const { current: reducer } = reducerRef;

  useEffect(
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

function isObject<T>(data: T):boolean {
  return data && Object.prototype.toString.apply(data) === '[object Object]';
}

export function shallowEqual<R>(prev:R, current:R):boolean {
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
