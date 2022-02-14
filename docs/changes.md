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