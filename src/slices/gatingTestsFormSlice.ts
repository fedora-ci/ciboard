/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021, 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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
import { ArtifactType } from '../types';

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

export interface GatingTestsFormState {
    aidStack: string[];
    buildType: ArtifactType;
    ciSystem: string;
    gateTag: string;
    ignoreCiSystem: boolean;
    isDirty?: boolean;
    packager: string;
    productId: number;
    sstTeams: string[];
}

export type GatingTestsFormSerialized = Partial<{
    btype: keyof typeof BUILD_TYPE_MENU_ITEMS;
    cisystem: string;
    gatetag: string;
    ic: string;
    packager: string;
    pid: string;
    teams: string;
}>;

const DEFAULT_STATE: GatingTestsFormState = {
    aidStack: [],
    buildType: 'brew-build',
    ciSystem: '',
    gateTag: '',
    ignoreCiSystem: false,
    packager: '',
    productId: 604,
    sstTeams: [],
};

export const gatingTestsFormSlice = createSlice({
    name: 'gatingTestsForm',
    initialState: DEFAULT_STATE,
    reducers: {
        setCriteria: (
            _state,
            action: PayloadAction<GASetSearchOptionsPayload>,
        ) => {
            const newState = _.cloneDeep(DEFAULT_STATE);
            const updateSet = action.payload;
            let key: keyof typeof updateSet;
            for (key in updateSet) {
                const newValue = updateSet[key];
                if (!_.isNil(newValue)) {
                    type StateSpecialized = Record<
                        typeof key,
                        typeof updateSet[typeof key]
                    >;
                    (newState as StateSpecialized)[key] = newValue;
                }
            }
            newState.aidStack = [];
            newState.isDirty = false;
            return newState;
        },
        goToNextPage: (state, action: PayloadAction<string>) => {
            state.aidStack.push(action.payload);
        },
        goToPrevPage: (state) => {
            state.aidStack.pop();
        },
        cleanse: (state) => {
            state.aidStack = [];
            state.isDirty = false;
        },
        updateCriteria: (
            state,
            action: PayloadAction<GASetSearchOptionsPayload>,
        ) => {
            /*
             * {type: 'brew-build',
             * gate_tag_name: {$regex: 'rhel-8.3'},
             * resultsdb_testcase: {$regex: 'manual'},
             * $and: [ { gate_tag_name: { $type: "string" } }, { gate_tag_name: { $gt: "" } } ] }
             */
            const updateSet = action.payload;
            let key: keyof typeof updateSet;
            for (key in updateSet) {
                const newValue = updateSet[key];
                if (!_.isNil(newValue)) {
                    type StateSpecialized = Record<
                        typeof key,
                        typeof updateSet[typeof key]
                    >;
                    (state as StateSpecialized)[key] = newValue;
                    // The state becomes dirty only if a value changes.
                    state.isDirty = true;
                }
            }
        },
    },
});

export const {
    cleanse,
    goToNextPage,
    goToPrevPage,
    setCriteria,
    updateCriteria,
} = gatingTestsFormSlice.actions;

export const gatingTestsFormReducer = gatingTestsFormSlice.reducer;

export const selectSerializedGatingFormState = <
    S extends { gatingTestsForm: GatingTestsFormState },
>(
    state: S,
) => {
    const { gatingTestsForm: gatingTestsPage } = state;
    const serialized: GatingTestsFormSerialized = {};

    serialized.btype = getSelectFromType(gatingTestsPage.buildType);
    serialized.ic = _.toString(gatingTestsPage.ignoreCiSystem);
    serialized.pid = _.toString(gatingTestsPage.productId);

    if (!_.isEmpty(gatingTestsPage.ciSystem))
        serialized.cisystem = gatingTestsPage.ciSystem;
    if (!_.isEmpty(gatingTestsPage.gateTag))
        serialized.gatetag = gatingTestsPage.gateTag;
    if (!_.isEmpty(gatingTestsPage.packager))
        serialized.packager = gatingTestsPage.packager;
    if (!_.isEmpty(gatingTestsPage.sstTeams))
        serialized.teams = gatingTestsPage.sstTeams.join(',');

    return serialized;
};

export const deserializeGatingFormState = (query: URLSearchParams) => {
    const state = _.cloneDeep(DEFAULT_STATE);

    if (query.has('btype'))
        state.buildType = getTypeFromSelect(query.get('btype')!);
    if (query.has('cisystem')) state.ciSystem = query.get('cisystem')!;
    if (query.has('gatetag')) state.gateTag = query.get('gatetag')!;
    if (query.has('ic')) state.ignoreCiSystem = query.get('ic') === 'true';
    if (query.has('packager')) state.packager = query.get('packager')!;
    if (query.has('pid')) state.productId = _.toNumber(query.get('pid'));
    if (query.has('teams'))
        state.sstTeams = _.compact(query.get('teams')?.split(','));

    return state;
};
