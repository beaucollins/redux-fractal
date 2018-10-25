/**
 * @flow strict
 */
import { createFractal, mapFractal } from 'fractal';
import type { Reducer } from 'fractal';

type MockState = 'a' | 'b';
type MockAction = 'one' | 'two';
const reducer: Reducer<MockState, MockAction> = (state, action) => {
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

const selectors = {
    all: (s: MockState) => s,
    isA: (thing: MockState): boolean => thing === 'a',
    blerg: (state: MockState, is: string) => state === is,
};

const isValidAction = (action: string): boolean %checks => {
    return action === 'one' || action === 'two';
};

const actions = {
    one: () => 'one',
    two: () => 'two',
    item: (action: string): MockAction => isValidAction(action) ? action : 'one',
};

const fractal = createFractal(reducer, selectors, actions);

type ExternalAction = 
    | { type: 'mock', action: MockAction }
    | { type: 'other' }

type ExternalState = {
    internal: MockState,
}

describe('fractal', () => {
    test('createFractal', () => {
        expect(fractal.reducer(undefined, 'one')).toBe('a');
        expect(fractal.reducer(undefined, 'two')).toBe('b');
        expect(fractal.select.all('b')).toBe('b');
    
        expect(fractal.actions.one()).toBe('one');
        expect(fractal.actions.two()).toBe('two');
    });
    
    test('mapFractal', () => {
        const mapped = mapFractal('a', fractal, {
            getState: (state: ExternalState): MockState => state.internal,
            detectAction: (external: ExternalAction): ?MockAction => external.type === 'mock' ? external.action : null,
            createAction: (action: MockAction): ExternalAction => ({ type: 'mock', action })
        });
    
        expect(mapped.reducer(undefined, { type: 'mock', action: 'one'})).toBe('a');
        expect(mapped.reducer(undefined, { type: 'mock', action: 'two'})).toBe('b');
        expect(mapped.select.all({ internal: 'b' })).toBe('b');
        expect(mapped.select.isA({ internal: 'b'})).toBe(false);
        expect(mapped.select.isA({ internal: 'a'})).toBe(true);
        expect(mapped.select.blerg({ internal: 'a' }, 'a')).toBe(true);
    
        expect(mapped.reducer(undefined, { type: 'other' })).toEqual('a');
    
        expect(mapped.actions.one()).toEqual({ action: 'one', type: 'mock' });
        expect(mapped.actions.two()).toEqual({ action: 'two', type: 'mock' });
        expect(mapped.actions.item('a')).toEqual({ action: 'one', type: 'mock' });
    });
});
