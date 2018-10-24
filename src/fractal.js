/**
 * @flow
 */

export function add<T: (string | number)>(a: T, b: T): T {
    return a + b;
}

export type Reducer<S, A> = (S | void, A) => S;

export type Selector<S, O, R> = (S, O) => R;
type ActionCreator<A, O> = (O) => A;

type MapSelector<X> = <S, O, R>(Selector<S, O, R>) => Selector<X, O, R>;
type MapAction<X> = <O, A>(ActionCreator<A, O>) => ActionCreator<X, O>;

export type Fractal<S, A, X, E, SE: SelectorSet<S>, AE: ActionSet<A>> = {|
    selectors: $ObjMap<SE, MapSelector<X>>,
    actions: $ObjMap<AE, MapAction<E>>,
    reducer: Reducer<S, E>,
    select: (X) => S
|}

type Integration<S, A, X, E> = {|
    getState: (X) => S,
    detectAction: (E) => ?A,
    createAction: (A) => E,
|};

type SelectorSet<T> = {
    [selector: string]: Selector<T, *, *>
};

type ActionSet<A> = {
    [action: string]: ActionCreator<A, *>
};

export function createFractal<S, A, X, E, SE: SelectorSet<S>, AE: ActionSet<A>>(
    defaultState: S,
    reducer: Reducer<S, A>,
    selectors: SE,
    actions: AE,
    api: Integration<S, A, X, E>,
): Fractal<S, A, X, E, SE, AE> {
    return {
        selectors: Object.keys(selectors).reduce((mapped, key) => Object.assign(mapped, {
            [key]: (state, options) => selectors[key](api.getState(state), options)
        }), {}),
        actions: Object.keys(actions).reduce((mapped, key) => Object.assign(mapped, {
            [key]: (options) => api.createAction(actions[key](options))
        }), {}),
        select: api.getState,
        reducer: (state = defaultState, external) => {
            const action = api.detectAction(external);
            if (action) {
                return reducer(state, action);
            }
            return state;
        },
    };
}
