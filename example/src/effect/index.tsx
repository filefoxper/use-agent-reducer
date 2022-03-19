import React, {memo, useCallback, useEffect} from 'react';
import {
    useAgentReducer,
    useMiddleWare,
    useAgentMethods,
    useAgentSelector,
    useModelProvider,
    useModel, useAgentEffect
} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {PriorLevel, SearchParams, State} from "@/type";

const SearchParamComponent = memo(() => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(SearchParamsModel);

    const todoListModel = useModel(SimpleTodoList);

    const {search} = useAgentMethods(todoListModel);

    // In fact, only the `todoListModel.changePage` action
    // can lead the `feedback` happen.
    // So, we can use `useAgentEffect` to listen
    // the `todoListModel.changePage` method,
    // and call `feedback`.
    useAgentEffect<State>((prevState, currentState) => {
        feedback(currentState.searchParams);
    }, todoListModel, todoListModel.changePage);

    const handleSubmit = useCallback(async () => {
        search(state);
    }, [state]);

    return (
        <SearchContent>
            <label>content: </label>
            <ContentInput value={state.content} onChange={changeSearchContent}/>
            <label>prior level: </label>
            <PriorLevelSelect value={state.priorLevel} onChange={changeSearchPriorLevel}/>
            <Button type="primary" onClick={handleSubmit}>submit</Button>
        </SearchContent>
    );
});

const Search = memo(()=>{
    const SearchProvider = useModelProvider(new SearchParamsModel());
    return (
        <SearchProvider>
            <SearchParamComponent/>
        </SearchProvider>
    );
})

export default function Effect() {

    const todoListModel = new SimpleTodoList();

    const agent = useAgentReducer(todoListModel);

    const TodoListProvider = useModelProvider(todoListModel);

    const {
        state,
        search,
        changePage
    } = agent;

    useEffect(() => {
        search();
    }, []);

    const renderPriorLevel = useCallback((value: PriorLevel) => {
        return value === PriorLevel.NORMAL ? 'normal' : 'emergency';
    }, []);

    return (
        <PageContent>
            <TodoListProvider>
                <Search/>
                <Table dataSource={state.dataSource || []} pagination={false} rowKey="id">
                    <Column title="id" dataIndex="id" width={'20%'}/>
                    <Column title="content" dataIndex="content" width={'60%'}/>
                    <Column title="prior level" dataIndex="priorLevel" render={renderPriorLevel} width={'20%'}/>
                </Table>
                <Pagination
                    current={state.currentPage}
                    total={state.total}
                    pageSize={state.pageSize}
                    onChange={changePage}
                />
            </TodoListProvider>
        </PageContent>
    );

}