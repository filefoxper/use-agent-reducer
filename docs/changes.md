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