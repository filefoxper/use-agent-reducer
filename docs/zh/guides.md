# 引导

## 什么是模型共享

模型共享特性是 `agent-reducer@3.2.0` 新加入的特性。该特性声明：所有建立在同一`对象模型`基础上的 `Agent` 代理共享 state 数据更新（state数据同步）。

也就是说，不同组件中的`Agent`只要使用了同一个`对象化模型`，那么它们的数据更新就是同步的。这与 redux 的 subscribe 行为非常类似。

该特性与 redux 表现得非常类似，需要注意的是，如果使用的是普通对象模型，或者通过 `agent-reducer` API `sharing` 产生的模型，那模型将是持久存在的，它并不会随着 `Agent` 代理被一并销毁；如果你需要的是一份弱持久化的模型，可通过 `agent-reducer` 另一个 API `weakSharing` 来生成，当弱持久化模型的所有 `Agent` 代理全被销毁时，整个模型将被重置。

#### sharing
```typescript
function sharing<
    S,
    T extends OriginAgent<S> = OriginAgent<S>
    >(
  factory:()=>T|{new ():T},
):{current:T}
```

* factory - 生成共享模型的工厂方法，通过该方法返回一个被共享的模型（class 或 object）
  
该方法返回一个持久化共享模型包装，从返回值的 `current` 属性中可取出模型。

#### weakSharing

```typescript
function weakSharing<
    S,
    T extends OriginAgent<S> = OriginAgent<S>
    >(
  factory:()=>T|{new ():T},
):{current:T}
```

* factory - 生成共享模型的工厂方法，通过该方法返回一个被共享的模型（class 或 object）
  
该方法返回一个弱持久化共享模型包装，从返回值的 `current` 属性中可取出模型，当模型生成的 `Agent` 代理全被销毁时，模型会通过传入的  factory 工厂方法进行模型重置。

您可以查看教程中关于模型共享的[例子](/zh/tutorial?id=使用模型共享)，进一步理解如何使用这一特性。

## 关键词 this

在 ES6 class 或 object 的方法中，关键词 `this` 指代的对象会随着不同的用法发生改变，当直接使用对象来调用方法时，`this` 指代的是对象本身。如果将方法赋予其他对象，并由其他对象来调用时，`this` 就成了其他对象。

但是，在 `Agent` 代理中，关键词 `this` 是稳定的，它永远指代 `Agent` 模型对象。所以，在我们的例子中经常见到从一个 `Agent` 代理中提取一个方法，并赋予其他对象来调用的现象。（在 `agent-reducer@3.0.0` 之前，`Agent` 方法中的 `this` 锁定为 `Agent` 代理对象本身）

## 关于 MiddleWare 的覆盖现象

目前为止，我们有三种添加 `MiddleWare` 的方式。

1. `useAgentReducer`，这是当前库的基础接口，通过它，我们可以添加基本的 `MiddleWare` 。使用如 `useAgentReducer( OriginAgent, MiddleWare )`。
2. `middleWare`，这是来自核心库[agent-reducer api](https://github.com/filefoxper/agent-reducer/blob/master/documents/en/api/middle_ware.md)的接口，通过它我们可以直接在模型方法上添加不同的 MiddleWare ，这些 MiddleWare 会在 `Agent` 代理调用相关方法时被唤醒。通过该接口添加的 MiddleWare 会覆盖通过 `useAgentReducer` 统一添加的 MiddleWare 。
3. `useMiddleWare`，这是当前库的一个 react hook 接口，通过这个接口可以复制一个 `Agent` 代理，并添加只作用与该复制代理方法的 MiddleWare ，而这些 MiddleWare 在 `Agent` 复制品中拥有最高执行级别，会屏蔽掉通过前两个接口添加的所有 MiddleWare 。

[关于 MiddleWare 覆盖现象的单元测试 middleWare.override.spec.ts](https://github.com/filefoxper/use-agent-reducer/blob/master/test/zh/middleWare.override.spec.tsx). 

```typescript
import {middleWare, MiddleWarePresets, OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer, useMiddleWare} from "use-agent-reducer";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe('MiddleWare 覆盖现象', () => {

    // 管理 User 数据的模型
    class UserModel implements OriginAgent<User> {

        // 默认 User 数据
        state: User = {id: null, name: null, role: 'GUEST'};

        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): User {
            return {...this.state, role};
        }

        // 通过 `agent-reducer` 接口 `middleWare` 添加的 MiddleWare
        @middleWare(MiddleWarePresets.takePromiseResolveAssignable())
        async fetchUser(): Promise<Partial<User>> {
            return {id: 1, name: 'Jimmy'};
        }
    }

    it('通过 `agent-reducer` 接口 `middleWare` 添加的 MiddleWare 会覆盖通过 api `useAgentReducer` 添加的 MiddleWare', async () => {
        // MiddleWarePresets.takePromiseResolveAssignable 会覆盖
        // `MiddleWarePresets.takePromiseResolve`
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve()));
        const agent = result.current;
        await act(async () => {
            await agent.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy', role: 'GUEST'});
    });

    it('通过 API `useMiddleWare` 添加的 MiddleWare 会在复制版中覆盖通过所有 MiddleWare', async () => {
        // `agent-reducer` API middleWare 添加的 MiddleWarePresets.takePromiseResolveAssignable 
        // 会覆盖 useAgentReducer 添加的 `MiddleWarePresets.takePromiseResolve`，
        // 而 API useMiddleWare 添加的 MiddleWarePresets.takePromiseResolve 会覆盖
        // API middleWare 添加的 MiddleWarePresets.takePromiseResolveAssignable
        const {result} = renderHook(() => useAgentReducer(UserModel, MiddleWarePresets.takePromiseResolve(), {nextExperience: true}));
        const agent = result.current;
        const {result: copyResult} = renderHook(() => useMiddleWare(agent, MiddleWarePresets.takePromiseResolve()));
        const copy = copyResult.current;
        await act(async () => {
            await copy.fetchUser();
        });
        expect(agent.state).toEqual({id: 1, name: 'Jimmy'});
    });

});
```

## 关于运行环境配置 RunEnv

RunEnv 是 `Agent` 代理运行是的环境配置。通过修改该参数，你可以提前体验下一版本新特性，也可以让每次 state 修改变成立即运行的实时更新。

配置结构如下:
```typescript
// 运行环境配置
export interface RunEnv {
  // 默认 'true',
  // 当这个参数被设置成 'false' 时，
  // 每次 `Agent` 方法调用产生的 state 修改都会立即生效，
  // 这种行为看似非常有用，但实则破坏了代码中数据更新的一致性，
  // 并造成 `Agent` state 与 react state 不同步的问题。
  // 所以，我们并不推荐关闭它 
  strict?: boolean;
  // 默认 'false',
  // 如果设置为 'true',
  // 'agent-reducer' 会引入下一版本的体验特性
  nextExperience?:boolean;
}
```
你可以在`此`查看如何配置运行环境。 [此](https://github.com/filefoxper/use-agent-reducer/blob/master/test/zh/setEnv.spec.tsx)。

```typescript
import {OriginAgent} from "agent-reducer";
import {act, renderHook} from "@testing-library/react-hooks";
import {useAgentReducer} from "agent-reducer";

type Role = 'GUEST' | 'USER' | 'MASTER';

type User = {
    id: number | null,
    name: string | null,
    role: Role
}

describe("设置运行环境 RunEnv",()=>{

    // User 模型
    class UserModel implements OriginAgent<User> {

        // 初始化数据
        state: User = {id: null, name: null, role: 'GUEST'};

        // 方法返回值可被更新为最新 state
        changeUserName(name: string): User {
            return {...this.state, name};
        }

        changeUserRole(role: Role): User {
            return {...this.state, role};
        }
    }

    it("不修改 strict，当我们在 react 事件回调中连续两次修改 state ，第一次修改将被第二次覆盖",()=>{
        const {result, rerender} = renderHook(() => useAgentReducer(UserModel));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
            agent.changeUserName('Jimmy');
        });
        expect(agent.state.role).toBe('GUEST');
    });

    it("设置 strict 为 false，当我们在 react 事件回调中连续两次修改 state ，第一次修改会与被第二次累积起来",()=>{
        const {result, rerender} = renderHook(() => useAgentReducer(UserModel,{strict:false}));
        const agent = result.current;
        act(() => {
            agent.changeUserRole('MASTER');
            agent.changeUserName('Jimmy');
        });
        expect(agent.state.role).toBe('MASTER');
    });

});
```

当心 `strict` 配置，我们不认为实时更新 state 是一件好事，你也应该有同样的觉悟。

## 模型共享优化

通过使用 `agent-reducer` 的模型共享特性，我们可以很容易地在不同组件间同步渲染数据，但这也给我们的组件带来了一定的负担，因为只要模型 state 有变更，无论变更数据是否对当前组件有用，必然会引起渲染行为，这不是我们愿意看到的。自 `use-agent-reducer@3.2.5` 起，我们提供了相关的性能优化接口：`useAgentSelector` 、 `useAgentMethods`。

API 接口 [useAgentSelector](/zh/api?id=useagentselector)  ，可用于提取当前组件需要的部分数据，如果该部分数据没有发生改变，则不会触发当前组件的渲染。通过使用 `equalityFn` 对前后两次 state 提取数据进行对比，可进一步优化渲染性能，若对比返回值为 `true` ，则忽略提取数据的改变状况，不触发当前组件的渲染。

```typescript
import {weakSharing} from 'agent-reducer';
import {useAgentSelector, shallowEqual} from 'use-agent-reducer';

// 共享模型引用
const sharingRef = weakSharing(()=> Model);

......

// 使用共享模型实例，通过 callback 从 state 中提取当前组件需的要数据，
// 如果提取数据保持不变，则不会触发组件渲染
const renderNeeds = useAgentSelector(sharingRef.current, (state)=> state.renderNeeds);

// 提取数据对比器，若返回 true ，则不触发组件渲染
function equalityFn<R>(prev:R, current:R):boolean{
    // 浅对比 API，方便使用者，
    // 可直接用在 useAgentSelector 上
    return shallowEqual(prev, current);
}

const renderNeeds = useAgentSelector(sharingRef.current, (state)=> state.renderNeeds,equalityFn);
```

API 接口 [useAgentMethods](/zh/api?id=useagentmethods) ， 不会触发当前组件渲染，该接口只提供了当前组件需要使用的模型方法。

```typescript
import {weakSharing, MiddleWarePresets} from 'agent-reducer';
import {useAgentMethods} from 'use-agent-reducer';

// 共享模型引用
const sharingRef = weakSharing(()=> Model);

......

// 使用共享模型实例，获取模型方法，不会触发当前组件重渲染
const {fetchState} = useAgentMethods(sharingRef.current, MiddleWarePresets.takePromiseResolve());
```
