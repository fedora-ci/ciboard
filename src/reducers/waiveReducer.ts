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
import {
    IStateWaiver,
    WAIVER_CREATE,
    WAIVER_RESULT,
    ActionsWaiverType,
    WAIVER_RESET_REPLY,
} from '../actions/types';
import update from 'react-addons-update';

/**
 * State - is the result to waive
 */
const INTIAL_STATE: IStateWaiver = {
    /* {testcase: "N/A"} */
    state: undefined,
    reason: '',
    waiveError: '',
    timestamp: undefined,
    artifact: undefined,
};

export const waiveReducer = (
    curState = INTIAL_STATE,
    action: ActionsWaiverType,
): IStateWaiver => {
    let waiveError, state, reason, artifact;
    switch (action.type) {
        case WAIVER_CREATE:
            state = action.payload.state;
            artifact = action.payload.artifact;
            let newState = _.cloneDeep(INTIAL_STATE);
            newState.state = state;
            newState.artifact = artifact;
            return newState;
        case WAIVER_RESET_REPLY:
            return update(curState, {
                waiveError: { $set: '' },
                timestamp: { $set: undefined },
            });
        case WAIVER_RESULT:
            waiveError = action.payload.waiveError;
            reason = action.payload.reason;
            if (waiveError) {
                return update(curState, {
                    waiveError: { $set: waiveError },
                });
            }
            return update(curState, {
                waiveError: { $set: '' },
                reason: { $set: reason },
                timestamp: { $set: new Date().getTime() },
            });
        default:
            return curState;
    }
};
