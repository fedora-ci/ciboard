/*
 * This file is part of ciboard
 *
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

import {
    GatingTestsFormState,
    gatingTestsFormReducer,
    setCriteria,
    updateCriteria,
} from './gatingTestsFormSlice';

describe('setCriteria action', () => {
    test('resets to default state and sets ciSystem', () => {
        const state: GatingTestsFormState = {
            aidStack: [],
            buildType: 'brew-build',
            ciSystem: '',
            gateTag: '8\\.8',
            ignoreCiSystem: true,
            isDirty: false,
            packager: 'mgrabovs',
            productId: 604,
            sstTeams: [],
        };
        const ciSystem = 'osci';
        const action = setCriteria({ ciSystem });
        const newState = gatingTestsFormReducer(state, action);
        expect(newState).toStrictEqual({
            aidStack: [],
            buildType: 'brew-build',
            ciSystem,
            gateTag: '',
            ignoreCiSystem: false,
            isDirty: false,
            packager: '',
            productId: 604,
            sstTeams: [],
        });
    });

    test('does not rewrite if value is undefined', () => {
        const state: GatingTestsFormState = {
            aidStack: [],
            buildType: 'brew-build',
            ciSystem: '',
            gateTag: '',
            ignoreCiSystem: false,
            isDirty: false,
            packager: '',
            productId: 604,
            sstTeams: [],
        };
        const action = setCriteria({
            ciSystem: undefined,
            gateTag: undefined,
        });
        const newState = gatingTestsFormReducer(state, action);
        expect(newState).toStrictEqual(state);
    });
});

describe('updateCriteria action', () => {
    test('rewrites ciSystem if present', () => {
        const state: GatingTestsFormState = {
            aidStack: [],
            buildType: 'brew-build',
            ciSystem: '',
            gateTag: '',
            ignoreCiSystem: false,
            isDirty: false,
            packager: '',
            productId: 604,
            sstTeams: [],
        };
        const ciSystem = 'osci';
        const action = updateCriteria({ ciSystem });
        const newState = gatingTestsFormReducer(state, action);
        expect(newState).toStrictEqual({
            ...state,
            ciSystem,
            isDirty: true,
        });
    });

    test('rewrites sstTeams if present', () => {
        const state: GatingTestsFormState = {
            aidStack: [],
            buildType: 'brew-build',
            ciSystem: '',
            gateTag: '',
            ignoreCiSystem: false,
            isDirty: false,
            packager: '',
            productId: 604,
            sstTeams: [],
        };
        const sstTeams = ['cs_apps', 'cs_infra', 'cs_storage'];
        const action = updateCriteria({
            sstTeams,
        });
        const newState = gatingTestsFormReducer(state, action);
        expect(newState).toStrictEqual({
            ...state,
            isDirty: true,
            sstTeams,
        });
    });

    test('does not rewrite if value is undefined', () => {
        const state: GatingTestsFormState = {
            aidStack: [],
            buildType: 'brew-build',
            ciSystem: '',
            gateTag: '',
            ignoreCiSystem: false,
            isDirty: false,
            packager: '',
            productId: 604,
            sstTeams: [],
        };
        const action = updateCriteria({
            ciSystem: undefined,
            gateTag: undefined,
        });
        const newState = gatingTestsFormReducer(state, action);
        expect(newState).toStrictEqual(state);
    });
});
