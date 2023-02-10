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
    IStateAlerts,
    PopAlertPayload,
    PushAlertPayload,
} from '../actions/types';

const INITIAL_STATE: IStateAlerts = {
    alerts: [],
};

export const alertsSlice = createSlice({
    name: 'alerts',
    initialState: INITIAL_STATE,
    reducers: {
        popAlert: (state, action: PayloadAction<PopAlertPayload>) => {
            const { key } = action.payload;
            state.alerts = _.reject(state.alerts, { key });
        },
        pushAlert: (state, action: PayloadAction<PushAlertPayload>) => {
            const { key, variant, title } = action.payload;
            state.alerts.push({ key, variant, title });
        },
    },
});

export const { popAlert, pushAlert } = alertsSlice.actions;

export const alertsReducer = alertsSlice.reducer;
