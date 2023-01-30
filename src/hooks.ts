/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import { useEffect, useRef } from 'react';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './reduxStore';

/**
 * Hook for working with page title, specifically, the document.title property.
 * This implementation is based on an MIT-licensed implementation by Amit Solanki
 * and Michał Miszczyszyn.
 * Original code available at https://github.com/rehooks/document-title
 */
export function useTitle(title: string): void {
    // Save the page title before we change it as we might need it later.
    const titleRef = useRef(document.title);

    useEffect(() => {
        document.title = title;
    }, [title]);

    useEffect(() => {
        const previousTitle = titleRef.current;
        return () => {
            // Restore the title once the component is unmounted.
            document.title = previousTitle;
        };
    }, []);
}

/*
 * Define typed hooks for state management with React Redux so that we don't have to
 * specify the type on every call. See [Redux Toolkit documentation][1] for details.
 * The docstrings below are copied from react-redux source.
 * [1]: https://redux-toolkit.js.org/tutorials/typescript#define-typed-hooks
 */

/**
 * A hook to access the redux `dispatch` function.
 *
 * @returns {any|function} redux store's `dispatch` function
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * A hook to access the redux store's state. This hook takes a selector function
 * as an argument. The selector is called with the store state.
 *
 * This hook takes an optional equality comparison function as the second parameter
 * that allows you to customize the way the selected state is compared to determine
 * whether the component needs to be re-rendered.
 *
 * @param {Function} selector the selector function
 * @param {Function=} equalityFn the function that will be used to determine equality
 *
 * @returns {any} the selected state
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
