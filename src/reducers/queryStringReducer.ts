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

import update from 'immutability-helper';
import {
    SET_QUERY_STRING,
    IStateQueryString,
    ActionsQueryStringType,
} from '../actions/types';

const INTIAL_STATE: IStateQueryString = {
    queryString: {},
};

export const queryStringReducer = (
    state = INTIAL_STATE,
    action: ActionsQueryStringType,
): IStateQueryString => {
    switch (action.type) {
        case SET_QUERY_STRING:
            const newQueryString = action.payload.queryString;
            return update(state, {
                queryString: { $set: newQueryString },
            });
        default:
            return state;
    }
};
