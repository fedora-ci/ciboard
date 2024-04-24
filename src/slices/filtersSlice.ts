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

import _ from 'lodash';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
    AddFilterPayload,
    DeleteFilterPayload,
    SetOptionsForFiltersPayload,
    IStateFilters,
} from '../actions/types';

const INITIAL_STATE: IStateFilters = {
    /** brew-build, koji-build, redhat-module, copr-build, productmd-compose */
    type: '',
    active: [],
    options: {
        skipScratch: false,
    },
};

export const filtersSlice = createSlice({
    name: 'filters',
    initialState: INITIAL_STATE,
    reducers: {
        addFilter: (state, action: PayloadAction<AddFilterPayload>) => {
            let { newval, type } = action.payload;
            if (state.type !== type) {
                if (!_.isEmpty(newval)) {
                    state.type = type;
                    state.active = [newval];
                    return;
                }
                if (!_.isEmpty(state.active)) {
                    // Keep old filters, just change their type
                    state.type = type;
                    return;
                }
                return state;
            }
            let present = state.active.includes(newval);
            if (present) return state;
            state.active.push(newval);
        },
        deleteFilter: (state, action: PayloadAction<DeleteFilterPayload>) => {
            let { delval } = action.payload;
            if (delval) {
                state.active = _.without(state.active, delval);
                return;
            }
            state.active = [];
        },
        /** Will remove all active filters, because options has been changed */
        setOptions: (
            state,
            action: PayloadAction<SetOptionsForFiltersPayload>,
        ) => {
            const changeOptions = action.payload;
            const keepOld = _.isMatch(state.options, changeOptions);
            if (keepOld) {
                return state;
            }
            const newOptions = { ...state.options, ...changeOptions };
            const newState = _.cloneDeep(INITIAL_STATE);
            newState.options = newOptions;
            return newState;
        },
    },
});

export const { addFilter, deleteFilter, setOptions } = filtersSlice.actions;

export const filtersReducer = filtersSlice.reducer;
