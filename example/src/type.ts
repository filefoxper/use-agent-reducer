// prior : normal, emergency
export enum PriorLevel {
    NORMAL,
    EMERGENCY
}

// data source model
export interface Todo {
    readonly id:number;
    // what todo
    readonly content: string,
    readonly createTime: string,
    // prior
    readonly priorLevel: PriorLevel
}

export interface SearchParams {
    // for matching property 'content'
    readonly content?: string,
    // for matching property 'priorLevel'
    readonly priorLevel?: PriorLevel
}

export interface State {
    // search params
    readonly searchParams: SearchParams,
    // data source
    readonly dataSource:Array<Todo>|null,
    // page infos
    readonly currentPage:number,
    readonly pageSize:number,
    readonly total:number,
}

// service params
export interface FetchParams extends SearchParams{
    readonly currentPage:number,
    readonly pageSize:number
}

// service Resolve
export interface FetchResult {
    readonly content:Array<Todo>,
    readonly total:number
}
