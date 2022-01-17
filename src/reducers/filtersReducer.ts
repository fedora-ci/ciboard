/*
 * This file is part of ciboard

 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
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
import update from 'immutability-helper';

import {} from '../actions/types';

import {
    IStateFilters,
    ADD_FILTER,
    DELETE_FILTER,
    ActionsFiltersType,
    SET_OPTIONS_FOR_FILTERS,
} from '../actions/types';

const INITIAL_STATE: IStateFilters = {
    /** brew-build, koji-build, redhat-module, copr-build, productmd-compose */
    type: '',
    active: [],
    options: {
        skipScratch: false,
    },
};

const filtersReducer = (
    state = INITIAL_STATE,
    action: ActionsFiltersType,
): IStateFilters => {
    switch (action.type) {
        /** Will remove all active filters, because options has been changed */
        case SET_OPTIONS_FOR_FILTERS:
            const changed_options = action.payload;
            const keep_old = _.isMatch(state.options, changed_options);
            if (keep_old) {
                return state;
            }
            const new_options = _.assign({}, state.options, changed_options);
            const new_state = _.cloneDeep(INITIAL_STATE);
            new_state.options = new_options;
            return new_state;
        case ADD_FILTER:
            let { newval, type } = action.payload;
            if (state.type !== type) {
                if (!_.isEmpty(newval)) {
                    return update(state, {
                        type: { $set: type },
                        active: { $set: [newval] },
                    });
                }
                if (!_.isEmpty(state.active)) {
                    return update(state, {
                        type: { $set: type },
                        /** keep old filters, just change their type */
                    });
                }
                return state;
            }
            let present = state.active.includes(newval);
            if (present) return state;
            return update(state, { active: { $push: [newval] } });
        case DELETE_FILTER:
            let { delval } = action.payload;
            if (delval) {
                return update(state, {
                    active: { $set: _.without(state.active, delval) },
                });
            } else {
                return update(state, { active: { $set: [] } });
            }
        default:
            return state;
    }
};

export default filtersReducer;
