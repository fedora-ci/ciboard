/*
 * This file is part of ciboard
 *
 * Copyright (c) 2022 Andrei Stepanov <astepano@redhat.com>
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
    CreateWaiverPayload,
    SubmitWaiverPayload,
    IStateWaiver,
} from '../actions/types';

/**
 * State - is the result to waive
 */
const INITIAL_STATE: IStateWaiver = {
    /* {testcase: "N/A"} */
    state: undefined,
    reason: '',
    waiveError: '',
    timestamp: undefined,
    artifact: undefined,
};

export const waiveSlice = createSlice({
    name: 'waive',
    initialState: INITIAL_STATE,
    reducers: {
        createWaiver: (state, action: PayloadAction<CreateWaiverPayload>) => {
            const { payload } = action;
            state.artifact = payload.artifact;
            state.state = payload.state;
        },
        resetWaiver: (state) => {
            state.waiveError = '';
            delete state.timestamp;
        },
        submitWaiver: (state, action: PayloadAction<SubmitWaiverPayload>) => {
            const { reason, waiveError } = action.payload;
            if (waiveError) {
                state.waiveError = waiveError;
                return;
            }
            state.waiveError = '';
            state.reason = reason;
            state.timestamp = new Date().getTime();
        },
    },
});

export const { createWaiver, resetWaiver, submitWaiver } = waiveSlice.actions;

export const waiveReducer = waiveSlice.reducer;
