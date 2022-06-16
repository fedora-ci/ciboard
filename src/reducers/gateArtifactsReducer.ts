/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2022 Andrei Stepanov <astepano@redhat.com>
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
    GATE_ARTIFACTS_BUMP_SEARCH_EPOCH,
    GATE_ARTIFACTS_SET_SEARCH_OPTIONS,
    ActionsGateArtifactsType,
    ActionGASetSearchOptions,
} from '../actions/types';
import { ArtifactType } from '../artifact';

const query = new URLSearchParams(window.location.search);

export const buildTypeMenuItems = {
    ordinary: 'brew-build',
    modularity: 'redhat-module',
};

export const getTypeFromSelect = (value: string) =>
    _.get(buildTypeMenuItems, value, 'invalid');

export const getSelectFromType = (type: string) =>
    _.get(_.invert(buildTypeMenuItems), type, 'invalid');

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

const INITIAL_STATE: StateGatingTests = {
    buildType: getTypeFromSelect(query.get('btype') || 'ordinary'),
    ciSystem: decodeURIComponent(query.get('cisystem') || ''),
    gateTag: decodeURIComponent(query.get('gatetag') || ''),
    ignoreCiSystem: decodeURIComponent(query.get('ic') || 'false') === 'true',
    packager: decodeURIComponent(query.get('packager') || ''),
    productId: _.toInteger(query.get('pid') || 604),
    searchEpoch: 1,
    sstTeams: _.reject(
        _.split(decodeURIComponent(query.get('teams') || ''), ','),
        _.isEmpty,
    ),
    /** buildType === artifact type */
};

export function gateArtifactsReducer(
    state = INITIAL_STATE,
    action: ActionsGateArtifactsType,
) {
    switch (action.type) {
        case GATE_ARTIFACTS_BUMP_SEARCH_EPOCH: {
            const nstate = update(state, {
                searchEpoch: { $set: state.searchEpoch + 1 },
            });
            const url = new URL(window.location.href);
            if (!_.isEmpty(state.ciSystem)) {
                url.searchParams.set(
                    'cisystem',
                    encodeURIComponent(state.ciSystem),
                );
            } else {
                url.searchParams.delete('cisystem');
            }
            if (!_.isEmpty(state.gateTag)) {
                url.searchParams.set(
                    'gatetag',
                    encodeURIComponent(state.gateTag),
                );
            } else {
                url.searchParams.delete('gatetag');
            }
            if (!_.isEmpty(state.packager)) {
                url.searchParams.set(
                    'packager',
                    encodeURIComponent(state.packager),
                );
            } else {
                url.searchParams.delete('packager');
            }
            if (!_.isEmpty(state.sstTeams)) {
                url.searchParams.set(
                    'teams',
                    encodeURIComponent(state.sstTeams.toString()),
                );
            } else {
                url.searchParams.delete('teams');
            }
            url.searchParams.set('pid', encodeURIComponent(state.productId));
            /** Mapping select entries to actual aritfact type, URL contains value from select entry */
            const btype =
                state.buildType === 'redhat-module' ? 'modularity' : 'ordinary';
            url.searchParams.set('btype', encodeURIComponent(btype));
            url.searchParams.set(
                'ic',
                encodeURIComponent(state.ignoreCiSystem),
            );
            window.history.pushState(null, 'update search params', url.href);
            return nstate;
        }
        case GATE_ARTIFACTS_SET_SEARCH_OPTIONS: {
            const {
                gateTag,
                packager,
                ciSystem,
                sstTeams,
                productId,
                buildType,
                ignoreCiSystem,
            } = action.payload;
            /**
             * {type: 'brew-build',
             * gate_tag_name: {$regex: 'rhel-8.3'},
             * resultsdb_testcase: {$regex: 'manual'},
             * $and: [ { gate_tag_name: { $type: "string" } }, { gate_tag_name: { $gt: "" } } ] }
             */
            let type: ArtifactType | undefined;
            switch (buildType) {
                case undefined:
                    break;
                case 'ordinary':
                    type = 'brew-build';
                    break;
                case 'modularity':
                    type = 'redhat-module';
                    break;
                default:
                    console.log('Unknown build type:', buildType);
                    return state;
            }
            const update_set: ActionGASetSearchOptions['payload'] = {
                gateTag,
                packager,
                ciSystem,
                sstTeams,
                productId,
                buildType: type,
                ignoreCiSystem,
            };
            let nstate = state;
            let property: keyof ActionGASetSearchOptions['payload'];
            for (property in update_set) {
                if (!_.isNil(update_set[property])) {
                    nstate = update(nstate, {
                        [property]: { $set: update_set[property] },
                    });
                }
            }
            return nstate;
        }
        default:
            return state;
    }
}
