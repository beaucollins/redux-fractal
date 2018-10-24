/**
 * @flow strict
 */
import { add, createFractal } from 'fractal';
import type { Fractal, Reducer } from 'fractal';

test('thing', () => {
    expect(add(1, 2)).toBe(3);
});

type State = 'a' | 'b';
type Action = 'one' | 'two';
const reducer: Reducer<State, Action> = (state, action) => {
    switch(action) {
    case 'one': {
        return 'a';
    }
    case 'two': {
        return 'b';
    }
    default: {
        (action: empty);
        throw new Error('not handled');
    }
    }
};

test('pure fractal', () => {
    const selectors = {
        all: (s: State) => s,
    };
    const actions = {
        one: () => 'one',
        two: () => 'two',
    };
    const fractal: Fractal<State, Action, State, Action, typeof selectors, *> = createFractal('a', reducer, selectors, actions, {
        getState: state => state,
        createAction: internal => internal,
        detectAction: external => external
    });
    expect(fractal.reducer(undefined, 'one')).toBe('a');
    expect(fractal.reducer(undefined, 'two')).toBe('b');
    expect(fractal.select('b')).toBe('b');
    expect(fractal.selectors.all('b')).toBe('b');

    expect(fractal.actions.one()).toBe('one');
    expect(fractal.actions.two()).toBe('two');
});

type ExternalAction = 
    | { type: 'external', action: Action }
    | { type: 'other' }
type ExternalState = {
    internal: State,
}

test('mapped fractal', () => {

    const selectors = {
        all: (thing: State) => thing,
        isA: (thing: State): boolean => thing === 'a',
        blerg: (state: State, is: string) => state === is,
    };

    const actions = {
        one: () => 'one',
        two: () => 'two',
        item: (action: string) => 'one',
    };

    const fractal = createFractal('a', reducer, selectors, actions, {
        getState: (state: ExternalState): State => state.internal,
        detectAction: (external: ExternalAction): ?Action => external.type === 'external' ? external.action : null,
        createAction: action => ({ type: 'external', action })
    });

    expect(fractal.reducer(undefined, { type: 'external', action: 'one'})).toBe('a');
    expect(fractal.reducer(undefined, { type: 'external', action: 'two'})).toBe('b');
    expect(fractal.select({ internal: 'b' })).toBe('b');
    expect(fractal.selectors.all({ internal: 'b' })).toBe('b');
    expect(fractal.selectors.isA({ internal: 'b'})).toBe(false);
    expect(fractal.selectors.isA({ internal: 'a'})).toBe(true);
    expect(fractal.selectors.blerg({ internal: 'a' }, 'a')).toBe(true);

    expect(fractal.reducer(undefined, { type: 'other' })).toEqual('a');

    expect(fractal.actions.one()).toEqual({ action: 'one', type: 'external' });
    expect(fractal.actions.two()).toEqual({ action: 'two', type: 'external' });
    expect(fractal.actions.item('a')).toEqual({ action: 'a', type: 'external' });

});