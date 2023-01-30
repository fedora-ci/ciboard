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

import { FetchUserPayload, IStateAuth } from '../actions/types';

const INITIAL_STATE: IStateAuth = {
    displayName: '',
    nameID: '',
};

export const authSlice = createSlice({
    name: 'auth',
    initialState: INITIAL_STATE,
    reducers: {
        fetchUser: (state, action: PayloadAction<FetchUserPayload>) => {
            const { displayName, nameID } = action.payload;
            if (displayName) {
                state.displayName = displayName;
                state.nameID = nameID;
                return;
            }

            // Reset state if there's no valid payload.
            return INITIAL_STATE;
        },
    },
});

export const { fetchUser } = authSlice.actions;

export const authReducer = authSlice.reducer;
