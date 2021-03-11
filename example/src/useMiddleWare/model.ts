import {middleWare, MiddleWarePresets, MiddleWares, OriginAgent} from "agent-reducer";
import {FetchParams, PriorLevel, State, Todo} from "@/type";
import {fetchTodoList} from "@/service";

const defaultState: State = {
    searchParams: {},
    dataSource: null,
    currentPage: 1,
    pageSize: 10,
    total: 0
};

/**
 * this is a simple todo list model
 */
export default class SimpleTodoList implements OriginAgent<State> {
    // set default state
    state = defaultState;

    // method for changing param 'searchParams.content'
    changeSearchContent(content?: string): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, content}};
    };

    // method for changing param 'searchParams.priorLevel'
    changeSearchPriorLevel(priorLevel?: PriorLevel): State {
        const {searchParams} = this.state;
        return {...this.state, searchParams: {...searchParams, priorLevel}};
    }

    // method for changing dataSource and page infos once
    // we can use 'MiddleWarePresets.takePromiseResolve' to reproduce a promise resolve data be next state,
    // so we can keep request function calling inside model
    @middleWare(MiddleWarePresets.takePromiseResolve())
    async fetchDataSource(currentPage: number, pageSize: number) {
        const {searchParams} = this.state;
        // change searchParams to fetch params
        const fetchParams: FetchParams = {...searchParams, currentPage, pageSize};
        const {content, total} = await fetchTodoList(fetchParams);
        // change page infos, dataSource and searchParams once
        return {...this.state, dataSource: content, total, currentPage, pageSize};
    }

}