import {avatar, flow, Flows, middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
import {FetchParams, PriorLevel, SearchParams, State, Todo} from "@/type";
import {fetchTodoList, fetchTodoListWithDelay} from "@/service";

const defaultSearchParams={};

export class SearchParamsModel implements OriginAgent<SearchParams> {
    // set default state
    state: SearchParams = defaultSearchParams;

    // method for changing param 'content'
    changeSearchContent(content?: string): SearchParams {
        return {...this.state, content};
    };

    // method for changing param priorLevel
    changeSearchPriorLevel(priorLevel?: PriorLevel): SearchParams {
        return {...this.state, priorLevel};
    }

    // method for accept search params from 'TodoList' model
    feedback(searchParams: SearchParams): SearchParams {
        return searchParams;
    }

}

type FlowState = State&{
    loading:boolean
}

const defaultState: FlowState = {
    searchParams: defaultSearchParams,
    dataSource: null,
    currentPage: 1,
    pageSize: 10,
    total: 0,
    loading:false
};

/**
 * this is a simple todo list model
 */
export default class SimpleTodoList implements OriginAgent<FlowState> {
    // set default state
    state = defaultState;

    interactions=avatar({
        success:(word:string)=> {

        }
    })

    private async fetchDataSource(searchParams: SearchParams, currentPage: number, pageSize: number): Promise<State> {
        const fetchParams = {...searchParams, currentPage, pageSize};
        const {content: dataSource, total} = await fetchTodoListWithDelay(fetchParams, currentPage === 2 ? 3000 : 0);
        // Copy searchParams here
        return {searchParams:{...searchParams}, dataSource, currentPage, pageSize, total};
    }

    load():FlowState{
        return {...this.state,loading:true};
    }

    unload():FlowState{
        return {...this.state,loading:false};
    }

    changeDatasource(searchParams: SearchParams,dataSource:Array<Todo>,total:number, currentPage: number, pageSize: number):FlowState{
        return {...this.state,searchParams,dataSource,total,currentPage,pageSize};
    }

    @flow(Flows.latest())
    async fetch(searchParams: SearchParams, currentPage: number, pageSize: number){
        this.load();
        try{
            const fetchParams = {...searchParams, currentPage, pageSize};
            const {content: dataSource, total} = await fetchTodoListWithDelay(fetchParams, currentPage === 2 ? 3000 : 0);
            this.changeDatasource({...searchParams},dataSource,total,currentPage,pageSize);
        }finally {
            this.unload();
            this.interactions.current.success('query success');
        }
    }

    // this method should works with a page navigation
    @flow()
    async changePage(currentPage: number, pageSize: number = 10) {
        const {searchParams} = this.state;
        return this.fetch(searchParams, currentPage, pageSize);
    }

    // this method should works with a search button
    @flow()
    async search(searchParams?: SearchParams) {
        const param = searchParams || this.state.searchParams;
        return this.fetch(param, 1, 10);
    }

}
