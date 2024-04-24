/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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
import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import { ApolloClient, ApolloError } from '@apollo/client';
import { GetState } from '../reduxStore';

// XXX: add global ApoloError redux?

import { Artifact } from '../artifact';
import { ArtifactsCompleteQuery } from '../queries/Artifacts';

interface IStateArtifacts {
    error?: string;
    artList: Artifact[];
    hitsInfo?: any;
    isLoading: boolean;
    totalHits: number;
}

const INITIAL_STATE: IStateArtifacts = {
    error: undefined,
    artList: [],
    hitsInfo: {},
    isLoading: false,
    totalHits: 0,
};

interface artListPayload {
    hits: Artifact[];
    error?: string;
    hitsInfo: { total: { value: number } };
}

export const artifactsSlice = createSlice({
    name: 'alerts',
    initialState: INITIAL_STATE,
    reducers: {
        artList: (state, action: PayloadAction<artListPayload>) => {
            state.error = action.payload.error;
            state.artList = action.payload.hits;
            state.hitsInfo = action.payload.hitsInfo;
            state.isLoading = false;
            state.totalHits = _.get(action.payload, 'hitsInfo.total.value', 0);
        },
        isLoading: (
            state,
            action: PayloadAction<IStateArtifacts['isLoading']>,
        ) => {
            const isLoading = action.payload;
            state.isLoading = isLoading;
            if (isLoading) {
                state.hitsInfo = {};
                state.artList = [];
                state.error = undefined;
            }
        },
    },
});

export const { artList, isLoading } = artifactsSlice.actions;

export const artifactsReducer = artifactsSlice.reducer;

// Get

/**
 * set next page + call load
    loadNext: actLoadNext,
 *   set prev page + call load
    loadPrev: actLoadPrev,
*/

export const {
    /** set isLoading to true */
    artList: actArtList,
    isLoading: actIsLoading,
} = artifactsSlice.actions;

export const actLoad =
    (client: ApolloClient<object>) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const {
            page,
            sortBy,
            artTypes,
            newerThen,
            queryString,
            paginationSize,
        } = getState().artifactsQuery;
        const paginationFrom = (page - 1) * paginationSize;
        let errorText: string;
        try {
            dispatch(actIsLoading(true));
            const response = await client.query({
                query: ArtifactsCompleteQuery,
                variables: {
                    sortBy,
                    artTypes,
                    newerThen,
                    queryString,
                    paginationSize,
                    paginationFrom,
                },
                fetchPolicy: 'cache-first',
                notifyOnNetworkStatusChange: true,
                errorPolicy: 'all',
            });
            const { hits: hits_, hits_info: hitsInfo } =
                response.data.artifacts;
            const hits = _.map(hits_, ({ hit_info, hit_source }) => ({
                hitInfo: hit_info,
                hitSource: hit_source,
            }));
            dispatch(actArtList({ hits: hits as Artifact[], hitsInfo }));
        } catch (error) {
            if (_.isError(error)) {
                errorText = error.message;
            } else {
                errorText = _.toString(error);
            }
            dispatch(actArtList({ hits: [], hitsInfo: [], error: errorText }));
        }
    };
