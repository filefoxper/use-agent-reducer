import React, {useContext, useEffect, useReducer, useRef, useState} from "react";
import {branch, BranchResolver, createAgentReducer, OriginAgent, Resolver} from "agent-reducer";
import {ReactNodeLike} from "prop-types";

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
    strict?: boolean
};

export function useAgent<S, T extends OriginAgent<S>>(entry: T | { new(): T }, resolver?: Resolver | RunEnv, env?: RunEnv): T {

    const envData = typeof resolver !== 'function' ? resolver : env;

    const resolverFunc = typeof resolver === 'function' ? resolver : undefined;

    const runEnv = envData && envData.strict !== undefined ? {strict: envData.strict} : undefined;

    let {current: reducer} = useRef(createAgentReducer(entry, resolverFunc, {
        ...runEnv,
        expired: false,
        updateBy: 'manual'
    }));

    const [state, dispatch] = useReducer(reducer, reducer.initialState);

    reducer.update(state, dispatch);

    useEffect(() => {
        return () => {
            reducer.env.expired = true;
        }
    }, []);

    return reducer.agent;
}

export function useBranch<S, T extends OriginAgent<S>>(agent: T, branchResolver: BranchResolver) {
    const {current} = useRef(branch(agent, branchResolver));
    return current;
}

export function AgentProvider<S, T extends OriginAgent<S>>({value, children}: { readonly value: T, readonly children?: ReactNodeLike }) {
    let ref = useRef(new AgentShipping(value));
    useEffect(()=>{
        ref.current.update(value);
    },[value.state]);
    return React.createElement(AgentContext.Provider, {value: ref.current}, children);
}

export function useParent<T extends OriginAgent>() {

    const shipping = useContext(AgentContext);

    let ref = useRef<OriginAgent | null>(shipping ? shipping.getAgent() : null);

    const [, setState] = useState<null | any>(ref.current?ref.current.state:null);

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