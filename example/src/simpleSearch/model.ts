import {OriginAgent} from "agent-reducer";
import {PriorLevel, State, Todo} from "@/type";

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

    // method for changing page infos
    changePageInfo(currentPage: number, pageSize: number, total: number): State {
        return {...this.state, currentPage, pageSize, total};
    }

    // method for changing data source
    changeDataSource(dataSource: Array<Todo>): State {
        return {...this.state, dataSource};
    }

}