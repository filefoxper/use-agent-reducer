import React, {useContext, useEffect, useReducer, useRef, useState} from "react";
import {
    createAgentReducer,
    MiddleWare,
    OriginAgent,
    useMiddleActions as useAgentMiddleActions,
    useMiddleWare as useAgentMiddleWare
} from "agent-reducer";
import {ReactNodeLike} from "prop-types";
import {LifecycleMiddleWare} from "agent-reducer/libs/global.type";
import {MiddleActions} from "agent-reducer/libs/middleActions";
import {Action, AgentReducer} from "agent-reducer/libs/reducer.type";

export type Listener = (agent: OriginAgent) => any;

class AgentShipping {

    private listeners: Listener[] = [];

    private agent: OriginAgent;

    constructor(agent: OriginAgent) {
        this.agent = agent;
    }

    getAgent(): OriginAgent {
        return this.agent;
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.findIndex((l) => l === listener);
            if (index < 0) {
                return;
            }
            this.listeners.splice(index, 1);
        }
    }

    update(agent: OriginAgent) {
        this.agent = agent;
        this.listeners.forEach((listener) => {
            listener(agent);
        });
    }

}

const AgentContext = React.createContext<AgentShipping | null>(null);

export type RunEnv = {
    strict?: boolean,
    nextExperience?: boolean
};

export function useAgentReducer<T extends OriginAgent<S>, S>(entry: T | { new(): T }, middleWareOrEnv?: MiddleWare | RunEnv, env?: Omit<RunEnv, 'legacy'>): T {

    const runEnv = typeof middleWareOrEnv !== 'function' ? middleWareOrEnv : env;

    const middleWare = typeof middleWareOrEnv === 'function' ? middleWareOrEnv : undefined;

    let reducerRef = useRef<null | AgentReducer<S, Action, T>>(null);

    if (reducerRef.current === null) {
        reducerRef.current = createAgentReducer(entry, middleWare, {
            ...runEnv,
            ...env,
            legacy: false,
            expired: false,
            updateBy: 'manual'
        });
    }

    let {current: reducer} = reducerRef;

    const [state, dispatch] = useReducer(reducer, reducer.initialState);

    reducer.update(state, dispatch);

    useEffect(() => {
        return () => {
            const {current: red} = reducerRef;
            if (!red) {
                return;
            }
            red.env.expired = true;
            if (!red.destroy) {
                return;
            }
            red.destroy();
        }
    }, []);

    return reducer.agent;
}

export function useAgent<T extends OriginAgent<S>, S>(entry: T | { new(): T }, middleWareOrEnv?: MiddleWare | RunEnv, env?: RunEnv): T {

    const runEnv = typeof middleWareOrEnv !== 'function' ? middleWareOrEnv : env;

    const middleWare = typeof middleWareOrEnv === 'function' ? middleWareOrEnv : undefined;

    let reducerRef = useRef<null | AgentReducer<S, Action, T>>(null);

    if (reducerRef.current === null) {
        reducerRef.current = createAgentReducer(entry, middleWare, {
            ...runEnv,
            ...env,
            expired: false,
            updateBy: 'manual'
        });
    }

    const {current: reducer} = reducerRef;

    const [state, dispatch] = useReducer(reducer, reducer.initialState);

    reducer.update(state, dispatch);

    useEffect(() => {
        return () => {
            const {current: red} = reducerRef;
            if (!red) {
                return;
            }
            red.env.expired = true;
            if (!red.destroy) {
                return;
            }
            red.destroy();
        }
    }, []);

    return reducer.agent;

}

export function useMiddleActions<T extends OriginAgent<S>, P extends MiddleActions<T, S>, S = any>(
    middleActions: { new(agent: T): P; } | P,
    ...middleWare: (MiddleWare | LifecycleMiddleWare)[]
): P {
    const ref = useRef(useAgentMiddleActions(middleActions, ...middleWare) as P);
    return ref.current;
}

export function useMiddleWare<T extends OriginAgent<S>, S>(agent: T, ...middleWare: (MiddleWare | LifecycleMiddleWare)[]): T {
    const {current} = useRef(useAgentMiddleWare(agent, ...middleWare));
    return current;
}

/**
 * @deprecated
 * @param agent
 * @param middleWare
 */
export function useBranch<T extends OriginAgent<S>, S>(agent: T, middleWare: MiddleWare | LifecycleMiddleWare) {
    return useMiddleWare(agent, middleWare);
}

export function AgentProvider<T extends OriginAgent<S>, S>({value, children}: { readonly value: T, readonly children?: ReactNodeLike }) {
    let ref = useRef(new AgentShipping(value));
    useEffect(() => {
        ref.current.update(value);
    }, [value.state]);
    return React.createElement(AgentContext.Provider, {value: ref.current}, children);
}

export function useAgentContext<T extends OriginAgent>(): T {

    const shipping = useContext(AgentContext);

    let ref = useRef<OriginAgent | null>(shipping ? shipping.getAgent() : null);

    const [, setState] = useState<null | any>(ref.current ? ref.current.state : null);

    useEffect(() => {
        if (!shipping) {
            return;
        }
        return shipping.subscribe((agent: OriginAgent) => {
            ref.current = agent;
            setState(() => agent.state);
        });
    }, [shipping]);

    return ref.current as T;
}

/**
 * @deprecated
 */
export function useParent<T extends OriginAgent>(): T {
    return useAgentContext<T>();
}