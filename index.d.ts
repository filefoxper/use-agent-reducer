import {MiddleWare, Model, LifecycleMiddleWare} from 'agent-reducer';
import {NamedExoticComponent} from "react";

export declare function useAgentReducer<T extends Model<S>, S>(entry: T | {
    new(): T;
}, ...middleWares: MiddleWare[]): T;

export declare function useMiddleWare<T extends Model<S>, S>(
    agent: T,
    ...middleWare: (MiddleWare | LifecycleMiddleWare)[]
): T;

export declare function useAgentSelector<T extends Model<S>, S, R>(
    entry: T,
    mapStateCallback: (state: T['state']) => R,
    equalityFn?: (prev: R, current: R) => boolean
): R;

export declare function useAgentMethods<T extends Model<S>, S>(
    entry: T,
    ...middleWares: MiddleWare[]
): Omit<T, 'state'>;

export declare function shallowEqual<R>(prev: R, current: R): boolean;

export declare function useModelProvider(
    models: Model|Record<string, Model>|Array<Model>,
    isRootProvider?: boolean,
):NamedExoticComponent<{ children: JSX.Element }>;

export declare function useModel<T extends Model>(
    key: string| number| { new(): T },
):T;
