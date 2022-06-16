/*
 * This file is part of ciboard

 * Copyright (c) 2022 Andrei Stepanov <astepano@redhat.com>
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

import { ActionAuthFetchUser, FETCH_USER, IStateAuth } from '../actions/types';

const INITIAL_STATE: IStateAuth = {
    displayName: '',
    nameID: '',
};
export const authReducer = (
    curState = INITIAL_STATE,
    action: ActionAuthFetchUser,
): IStateAuth => {
    switch (action.type) {
        case FETCH_USER: {
            const { displayName, nameID } = action.payload;
            if (displayName) {
                const nstate = update(curState, {
                    displayName: { $set: displayName },
                    nameID: { $set: nameID },
                });
                return nstate;
            }
            const new_auth = _.cloneDeep(INITIAL_STATE);
            return new_auth;
        }
        default:
            return curState;
    }
};
