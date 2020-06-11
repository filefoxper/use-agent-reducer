import {useEffect, useReducer, useRef} from "react";
import {OriginAgent, createAgentReducer, Env} from "agent-reducer";

export function useAgent<S, T extends OriginAgent<S>>(entry: T | { new(): T }, env?: Env): T {

    let {current: reducer} = useRef(createAgentReducer(entry, {
        ...env,
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
