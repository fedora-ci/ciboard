/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021, 2022 Andrei Stepanov <astepano@redhat.com>
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

import { GASetSearchOptionsPayload } from '../actions/types';
import { ArtifactType } from '../artifact';

export const BUILD_TYPE_MENU_ITEMS = {
    modularity: 'redhat-module',
    ordinary: 'brew-build',
};

export const getTypeFromSelect = (value: string): ArtifactType =>
    _.get(BUILD_TYPE_MENU_ITEMS, value, 'brew-build');

export const getSelectFromType = (type: string) =>
    _.get(
        _.invert(BUILD_TYPE_MENU_ITEMS),
        type,
        'ordinary',
    ) as keyof typeof BUILD_TYPE_MENU_ITEMS;

export interface StateGatingTests {
    buildType: ArtifactType;
    ciSystem: string;
    gateTag: string;
    ignoreCiSystem: boolean;
    packager: string;
    productId: number;
    searchEpoch: number;
    sstTeams: string[];
}

export type StateGatingTestsSerialized = Partial<
    Pick<StateGatingTests, 'ciSystem' | 'gateTag' | 'packager'> & {
        btype: keyof typeof BUILD_TYPE_MENU_ITEMS;
        ic: string;
        pid: string;
        sstTeams: string;
    }
>;

const INITIAL_STATE: StateGatingTests = {
    buildType: 'brew-build',
    ciSystem: '',
    gateTag: '',
    ignoreCiSystem: false,
    packager: '',
    productId: 604,
    searchEpoch: 1,
    sstTeams: [],
    /** buildType === artifact type */
};

export const gateArtifactsSlice = createSlice({
    name: 'gateArtifacts',
    initialState: INITIAL_STATE,
    reducers: {
        gateArtifactsBumpSearchEpoch: (state) => {
            ++state.searchEpoch;
        },
        gateArtifactsSetSearchOptions: (
            state,
            action: PayloadAction<GASetSearchOptionsPayload>,
        ) => {
            const {
                buildType,
                ciSystem,
                gateTag,
                ignoreCiSystem,
                packager,
                productId,
                sstTeams,
            } = action.payload;
            /*
             * {type: 'brew-build',
             * gate_tag_name: {$regex: 'rhel-8.3'},
             * resultsdb_testcase: {$regex: 'manual'},
             * $and: [ { gate_tag_name: { $type: "string" } }, { gate_tag_name: { $gt: "" } } ] }
             */
            const updateSet: typeof action.payload = {
                buildType,
                ciSystem,
                gateTag,
                ignoreCiSystem,
                packager,
                productId,
                sstTeams,
            };
            let key: keyof typeof updateSet;
            for (key in updateSet) {
                const newValue = updateSet[key];
                if (!_.isNil(newValue)) {
                    type StateSpecialized = Record<
                        typeof key,
                        typeof updateSet[typeof key]
                    >;
                    (state as StateSpecialized)[key] = newValue;
                }
            }
        },
    },
});

export const { gateArtifactsBumpSearchEpoch, gateArtifactsSetSearchOptions } =
    gateArtifactsSlice.actions;

export const gateArtifactsReducer = gateArtifactsSlice.reducer;

export const selectSerializedGatingState = <
    S extends { gateArtifacts: StateGatingTests },
>(
    state: S,
) => {
    const { gateArtifacts } = state;
    const serialized: StateGatingTestsSerialized = {};

    if (!_.isEmpty(gateArtifacts.ciSystem))
        serialized.ciSystem = gateArtifacts.ciSystem;
    if (!_.isEmpty(gateArtifacts.gateTag))
        serialized.gateTag = gateArtifacts.gateTag;
    if (!_.isEmpty(gateArtifacts.packager))
        serialized.packager = gateArtifacts.packager;
    if (!_.isEmpty(gateArtifacts.sstTeams))
        serialized.sstTeams = gateArtifacts.sstTeams.join(',');

    serialized.btype = getSelectFromType(gateArtifacts.buildType);
    serialized.ic = _.toString(gateArtifacts.ignoreCiSystem);
    serialized.pid = _.toString(gateArtifacts.productId);

    return serialized;
};
