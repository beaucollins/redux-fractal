/**
 * @flow
 */
export type Reducer<S, A> = (S | void, A) => S;

export type Selector<S, O, R> = (S, O) => R;
type ActionCreator<A, O> = (O) => A;

type Selectors<T> = {
    [selector: string]: Selector<T, *, *>
};

type ActionCreators<A> = {
    [action: string]: ActionCreator<A, *>
};

/*
 * Not used at the moment
 *   type MapSelector<X> = <S, O, R>(Selector<S, O, R>) => Selector<X, O, R>;
 *   type MapAction<X> = <O, A>(ActionCreator<A, O>) => ActionCreator<X, O>;
 */

export type Fractal<S, A, E, SE: Selectors<E>, AC: ActionCreators<A>> = {|
    select: SE,
    actions: AC,
    reducer: Reducer<S, A>,
|}

type Integration<S, A, FS, FA> = {|
    getState: (S) => FS,
    detectAction: (A) => ?FA,
    createAction: (FA) => A,
|};

export function createFractal<S, A, SE: Selectors<S>, AC: ActionCreators<A>>(
    reducer: Reducer<S, A>,
    selectors: SE,
    actions: AC
): Fractal<S, A, S, SE, AC> {
    return {
        select: selectors,
        actions,
        reducer,
    };
}


export function mapFractal<S, A, FS, FA>(
    defaultState: FS,
    fractal: Fractal<FS, FA, FS, Selectors<FS>, ActionCreators<FA>>,
    api: Integration<S, A, FS, FA>,
): Fractal<FS, A, S, Selectors<S>, ActionCreators<A>> {
    return {
        select: Object.keys(fractal.select).reduce((mapped, key) => Object.assign(mapped, {
            [key]: (state, options) => fractal.select[key](api.getState(state), options)
        }), {}),
        actions: Object.keys(fractal.actions).reduce((mapped, key) => Object.assign(mapped, {
            [key]: (options) => api.createAction(fractal.actions[key](options))
        }), {}),
        reducer: (state = defaultState, external) => {
            const action = api.detectAction(external);
            if (action) {
                return fractal.reducer(state, action);
            }
            return state;
        },
    };
}
