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

import { IStateArtifactsQuery } from '../actions/types';

export const InitialState: IStateArtifactsQuery = {
    page: 1,
    sortBy: undefined,
    artTypes: [''],
    newerThen: '3',
    queryString: undefined,
    paginationSize: 20,
};

export const artifactsQuerySlice = createSlice({
    name: 'filters',
    initialState: InitialState,
    reducers: {
        sortBy: (
            state,
            action: PayloadAction<IStateArtifactsQuery['sortBy']>,
        ) => {
            const sortBy = action.payload;
            state.sortBy = sortBy;
            state.page = 1;
        },
        artTypes: (
            state,
            action: PayloadAction<IStateArtifactsQuery['artTypes']>,
        ) => {
            const artTypes = action.payload;
            state.artTypes = _.clone(artTypes);
            state.page = 1;
        },
        newerThen: (
            state,
            action: PayloadAction<IStateArtifactsQuery['newerThen']>,
        ) => {
            const newerThen = action.payload;
            state.newerThen = newerThen;
            state.page = 1;
        },
        queryString: (
            state,
            action: PayloadAction<IStateArtifactsQuery['queryString']>,
        ) => {
            const queryString = action.payload;
            state.queryString = queryString;
        },
        paginationSize: (
            state,
            action: PayloadAction<IStateArtifactsQuery['paginationSize']>,
        ) => {
            const paginationSize = action.payload;
            state.paginationSize = paginationSize;
            state.page = 1;
        },
        page: (state, action: PayloadAction<IStateArtifactsQuery['page']>) => {
            const page = action.payload;
            if (page > 0) {
                state.page = page;
            }
        },
    },
});

export const artifactsQueryReducer = artifactsQuerySlice.reducer;

export const {
    page: actPage,
    sortBy: actSortBy,
    artTypes: actArtTypes,
    newerThen: actNewerThen,
    queryString: actQueryString,
    paginationSize: actPaginationSize,
} = artifactsQuerySlice.actions;