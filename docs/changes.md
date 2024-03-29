## v3.2.5 2021-04-10

* [new] add API [useAgentSelector](/api?id=useagentselector) for optimizing the model sharing.
* [new] add API [useAgentMethods](/api?id=useagentmethods) for optimizing the model sharing.

## v3.2.7 2021-04-11

* [update] API [useAgentSelector](/api?id=useagentselector) add a new param `equalityFn` for comparing current extracted data with the previous one, and then deside if its consumer (react component) should be rerendered.
* [new] add API [shallowEqual](/api?id=shallowequal) for a shallow comparing with two data.

## v3.2.8 2021-04-11

* [build] decrease the package size

## v3.3.0 2021-05-07

* [build] decrease the package size with a `es` package. [See details](/introduction?id=installation) .

## v3.3.2 2021-05-24

* [bug] fix the problem about `useAgentMethods` can not update the state itself.

## v3.4.0 2021-06-01

* [refactor] adjust by `agent-reducer@3.4.1` . 
  
## v3.6.0 2021-06-22

* [refactor] adjust by `agent-reducer@3.6.0` . 

## v3.7.0 2021-08-25

* [bug] fix the problem about when using `react-dev-tool`, the state can not be changed.

## v3.7.1 2021-08-26

* [bug] fix the problem about when using `react-refresh`, the state can not be connected.

## v3.7.2 2021-08-27

* [bug] fix the problem about use-agent-reducer inside ts error.

## v3.8.0 2021-10-15

* [bug] fix the problem about use-agent-reducer includes an inside agent-reducer@3.7.2.
* [refactor] optimize the dependency mode of `agent-reducer`.

## v4.0.0 2021-10-25

* [refactor] use `agent-reducer@4.0.0` .
* [refactor] remove bad designs .

## v4.1.0 2021-11-16

* [new] add API [useModelProvider](/api?id=usemodelprovider) and [useModel](/api?id=usemodel).

## v4.1.1 2021-11-16

* [bug] fix typescript problem about useModelProvider.

## v4.1.2 2021-11-16

* [bug] fix the problem about useModelProvider can not link each other well, when the nested Provider's creator are not nested.

## v4.1.3 2021-11-23

* [refactor] create API [useWeakSharing](/api?id=useweaksharing).

## v4.1.4 2021-11-23

* [bug] fix the API [useModelProvider](/api?id=usemodelprovider) problem, "can not find model" error which is caused by 4.1.3.

## v4.1.5 2021-12-12

* [update] update for `agent-reducer@4.0.4`.

## v4.1.6 2022-02-14

* [bug] resolve the problem about the agent methods from parent component can't work in useEffect.

## v4.1.7 2022-02-14

* [bug] resolve the problem about typescript error to `useModel` API, when the param is a class with constructor params.

## v4.2.0 2022-03-19

* [update] create API [useAgentEffect](/api?id=useagenteffect).

## v4.3.0 2022-04-06

* [update] update for `agent-reducer@4.3.0`.

## v4.3.1 2022-04-25

* [design] add the param defaultModel for API [useModel](/api?id=usemodel)

## ~~v4.5.0 to v4.5.3~~

* [deprecated] These versions are not reasonable for trying to make switch of several components with same `weakSharing` model synchronously. The react effects always work by a global updating, not only work for a special component. Consider that, we make a decision to rollback to `4.3.1`.

## v4.5.4 2022-05-25

* [revert] rollback to 4.3.1

## v4.6.0 2022-07-05

* [bug] fix the problem about the code updating, when using react-refresh babel and webpack plugins. 

## v4.6.1 2022-07-06

* [update] fix the problem about the code updating, when using react-refresh babel and webpack plugins. refer to [react-refresh usage](/introduction?id=react-refresh).

## v4.6.2 2022-07-20

* [bug] fix the problem about `useAgentSelector` can not update immediately. This problem is caused by adjusting react-refresh from `use-agent-reducer@4.6.1`

## v4.6.3 2022-07-21

* [refactor] include the `index.d.ts` into the eslint check. 

## v4.6.4 2022-10-29

* [optmize] optmize `useAgentSelector`, add `comparators` param, and you can update selected state by the change of comparators too.

## v4.6.6 2022-11-06

* [optmize] optmize the build script, support React 18 `React.Strict` and `ReactRefresh` in normal mode.

## v4.7.0 2022-11-11

* [design] create new hooks `useAgent\useMethods\useSelector` to simplify the old hooks `useAgentReducer\useAgentMethods\useAgentSelector`, the old hooks will still be in usage.