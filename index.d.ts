import React, {ReactNode} from 'react';
import {MiddleWare, OriginAgent} from 'agent-reducer';
import {LifecycleMiddleWare} from 'agent-reducer/libs/global.type';
import {MiddleActions} from 'agent-reducer/libs/middleActions';

export declare type Listener = (agent: OriginAgent) => any;

declare class AgentShipping {
    private listeners;
    private agent;

    constructor(agent: OriginAgent);

    getAgent(): OriginAgent;

    subscribe(listener: Listener): () => void;

    update(agent: OriginAgent): void;
}

export declare type RunEnv = {
    strict?: boolean;
    nextExperience?: boolean;
};

export declare function useAgentReducer<T extends OriginAgent<S>, S>(entry: T | {
    new(): T;
}, middleWareOrEnv?: MiddleWare | RunEnv, env?: Omit<RunEnv, 'legacy'>): T;

export declare function useMiddleWare<T extends OriginAgent<S>, S>(
    agent: T,
    ...middleWare: (MiddleWare | LifecycleMiddleWare)[]
): T;

export declare function useAgentSelector<T extends OriginAgent<S>, S, R>(
    entry: T,
    mapStateCallback: (state: T['state']) => R,
    equalityFn?: (prev: R, current: R) => boolean
): R;

export declare function useAgentMethods<T extends OriginAgent<S>, S>(
    entry: T,
    middleWareOrEnv?: MiddleWare | RunEnv,
    env?: Omit<RunEnv, 'legacy'>
): Omit<T, 'state'>;

export declare function shallowEqual<R>(prev: R, current: R): boolean;

/** **** deprecated **** */
export declare function useAgent<T extends OriginAgent<S>, S>(entry: T | {
    new(): T;
}, middleWareOrEnv?: MiddleWare | RunEnv, env?: RunEnv): T;

export declare function useMiddleActions<T extends OriginAgent<S>, P extends MiddleActions<T, S>, S = any>(
    middleActions: {
        new(agent: T): P;
    } | P,
    ...middleWare: (MiddleWare | LifecycleMiddleWare)[]
): P;

/**
 * @deprecated
 * @param agent
 * @param middleWare
 */
export declare function useBranch<T extends OriginAgent<S>, S>(
    agent: T,
    middleWare: MiddleWare | LifecycleMiddleWare
): T;

export declare function AgentProvider<T extends OriginAgent<S>, S>(
    {value, children,}: {
        readonly value: T;
        readonly children?: ReactNode;
    }
): React.FunctionComponentElement<React.ProviderProps<AgentShipping | null>>;

export declare function useAgentContext<T extends OriginAgent>(): T;

/**
 * @deprecated
 */
export declare function useParent<T extends OriginAgent>(): T;

export {};
