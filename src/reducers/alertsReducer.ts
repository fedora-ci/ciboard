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

import {
    POP_ALERT,
    PUSH_ALERT,
    IStateAlerts,
    ActionsAlertsType,
} from '../actions/types';

const INITIAL_STATE: IStateAlerts = {
    alerts: [],
};

const alertsReducer = (
    state = INITIAL_STATE,
    action: ActionsAlertsType,
): IStateAlerts => {
    switch (action.type) {
        case PUSH_ALERT: {
            const { key, variant, title } = action.payload;
            return update(state, {
                alerts: { $push: [{ key, variant, title }] },
            });
        }
        case POP_ALERT: {
            const { key } = action.payload;
            return update(state, {
                alerts: { $set: _.reject(state.alerts, { key }) },
            });
        }
        default:
            return state;
    }
};

export default alertsReducer;
