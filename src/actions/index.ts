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

import {
    /** Filters */
    ADD_FILTER,
    DELETE_FILTER,
    SET_QUERY_STRING,
    SET_OPTIONS_FOR_FILTERS,
    GATE_ARTIFACTS_BUMP_SEARCH_EPOCH,
    GATE_ARTIFACTS_SET_SEARCH_OPTIONS,
    /** Alerts */
    POP_ALERT,
    PUSH_ALERT,
    ActionPopAlert,
    ActionGASetSearchOptions,
    ActionGABumpSearchEpoch,
} from './types';
import store from '../reduxStore';
import { db_field_from_atype } from '../utils/artifactUtils';

type DispatchType = typeof store.dispatch;
type GetStateType = typeof store.getState;

export const popAlert = (key: number): ActionPopAlert => {
    return {
        type: POP_ALERT,
        payload: { key },
    };
};

export const setGatingSearchOptions = (
    gating_options: ActionGASetSearchOptions['payload'],
): ActionGASetSearchOptions => {
    return {
        type: GATE_ARTIFACTS_SET_SEARCH_OPTIONS,
        payload: gating_options,
    };
};

export const bumpGatingSearchEpoch = (): ActionGABumpSearchEpoch => {
    return {
        type: GATE_ARTIFACTS_BUMP_SEARCH_EPOCH,
    };
};

type AlertVariantType = 'success' | 'danger' | 'warning' | 'info' | 'default';

export const pushAlert = (
    variant: AlertVariantType,
    title: string,
    autoRm: boolean = true,
) => {
    return async (dispatch: DispatchType) => {
        const key = new Date().getTime();
        if (autoRm) {
            setTimeout(function () {
                dispatch(popAlert(key));
            }, 3000);
        }
        dispatch({
            type: PUSH_ALERT,
            payload: { key, variant, title },
        });
    };
};

export const setQueryString = (queryString: string) => {
    return {
        type: SET_QUERY_STRING,
        payload: { queryString },
    };
};

export const deleteFilter = (delval = '') => {
    return async (dispatch: DispatchType, getState: GetStateType) => {
        dispatch({
            type: DELETE_FILTER,
            payload: { delval },
        });
    };
};

export const setOptionsForFilters = (changed_options: any) => {
    return async (dispatch: DispatchType, getState: GetStateType) => {
        const cur_options = getState().filters.options;
        const the_same = _.isMatch(cur_options, changed_options);
        if (the_same) {
            return null;
        }
        const type = getState().filters.type;
        const filters = getState().filters.active;
        dispatch({
            type: SET_OPTIONS_FOR_FILTERS,
            payload: changed_options,
        });
        for (const filter of filters) {
            dispatch(addFilter(filter, type) as any);
        }
    };
};

export const addFilter = (newval = '', type = '') => {
    return async (dispatch: DispatchType, getState: GetStateType) => {
        const cur_type = getState().filters.type;
        const cur_filters = getState().filters.active;
        var rforeign = /[^\u0000-\u007f]/;
        if (rforeign.test(newval)) {
            console.log('Ignoring filter with no-latin character:', newval);
            return null;
        }
        if (!_.has(db_field_from_atype, type)) {
            console.log('Ignoring filter with unsupported type:', type);
            return null;
        }
        console.log('Add new filter', type, newval);
        if (type !== cur_type) {
            /** new epoch */
        } else if (_.includes(cur_filters, newval)) {
            console.log('Do not add existing filter', newval);
            return null;
        }
        dispatch({
            type: ADD_FILTER,
            payload: { type, newval },
        });
    };
};
