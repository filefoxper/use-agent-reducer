import React, {memo, useCallback, useEffect} from 'react';
import {
    useAgentReducer,
    useMiddleWare,
    useAgentMethods,
    useAgentSelector,
    useModelProvider,
    useModel
} from "use-agent-reducer";
import SimpleTodoList, {SearchParamsModel} from "./model";
import {ContentInput, PageContent, PriorLevelSelect, SearchContent} from "@/components";
import {Button, Pagination, Table} from "antd";
import Column from "antd/lib/table/Column";
import {PriorLevel, SearchParams} from "@/type";
import {MiddleWarePresets, weakSharing} from "agent-reducer";

const SearchParamComponent = memo(() => {

    const {state, changeSearchContent, changeSearchPriorLevel, feedback} = useAgentReducer(SearchParamsModel);

    const todoListModel = useModel(SimpleTodoList);

    // `Agent` bases on object simpleTodoList,
    // If we use class `SimpleTodoList` as a model,
    // `useAgentReducer` should create a private model object inside,
    // and then, no state updating can be shared now.
    // So, model sharing only works on 'Agents' base on a same model object.
    // API `useAgentMethods` can optimize our component,
    // it never leads its consumer (component) rerender.
    const {search} = useAgentMethods(todoListModel);

    // API `useAgentSelector` can optimize our component,
    // it only leads its consumer (component) rerender, when the extracted data changes.
    const searchParams = useAgentSelector(todoListModel, ({searchParams}) => searchParams);

    useEffect(() => {
        feedback(searchParams);
    }, [searchParams]);

    const handleSubmit = useCallback(async () => {
        // submit current searchParams with model object `simpleTodoList`
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

export default function ModelProvider() {

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

    // handle page change
    const handleChangePage = useCallback(async (currentPage: number, pageSize: number = 10) => {
        // feedback searchParams with model object `searchParamsModel`.
        await changePage(currentPage, pageSize);
    }, [state]);

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
