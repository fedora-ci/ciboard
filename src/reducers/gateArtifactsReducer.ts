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
import update from 'react-addons-update';
import {
    GATE_ARTIFACTS_BUMP_SEARCH_EPOCH,
    GATE_ARTIFACTS_SET_SEARCH_OPTIONS,
    ActionsGateArtifactsType,
    ActionGASetSearchOptions,
} from '../actions/types';

const query = new URLSearchParams(window.location.search);

const buildTypeMenuItems = {
    ordinary: 'brew-build',
    modularity: 'redhat-module',
};
const getTypeFromSelect = _.partialRight(
    _.get,
    buildTypeMenuItems,
    _,
    'invalid',
);
const getSelectFromType = _.partialRight(
    _.get,
    _.invert(buildTypeMenuItems),
    _,
    'invalid',
);

const INITIAL_STATE = {
    gateTag: decodeURIComponent(query.get('gatetag') || ''),
    packager: decodeURIComponent(query.get('packager') || ''),
    ciSystem: decodeURIComponent(query.get('cisystem') || ''),
    sstTeams: _.reject(
        _.split(decodeURIComponent(query.get('teams') || ''), ','),
        _.isEmpty,
    ),
    product_id: _.toInteger(query.get('pid') || 604),
    /** buildType === artifact type */
    buildType: getTypeFromSelect(query.get('btype') || 'ordinary'),
    ignoreCISystem: decodeURIComponent(query.get('ic') || 'false') === 'true',
    search_epoch: 1,
};

export function gateArtifactsReducer(
    state = INITIAL_STATE,
    action: ActionsGateArtifactsType,
) {
    switch (action.type) {
        case GATE_ARTIFACTS_BUMP_SEARCH_EPOCH: {
            nstate = update(state, {
                search_epoch: { $set: state.search_epoch + 1 },
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
            url.searchParams.set('pid', encodeURIComponent(state.product_id));
            /** Mapping select entries to actual aritfact type, URL contains value from select entry */
            const btype =
                state.buildType === 'redhat-module' ? 'modularity' : 'ordinary';
            url.searchParams.set('btype', encodeURIComponent(btype));
            url.searchParams.set(
                'ic',
                encodeURIComponent(state.ignoreCISystem),
            );
            window.history.replaceState('', 'update search params', url.href);
            return nstate;
        }
        case GATE_ARTIFACTS_SET_SEARCH_OPTIONS: {
            const {
                gateTag,
                packager,
                ciSystem,
                sstTeams,
                product_id,
                buildType,
                ignoreCISystem,
            } = action.payload;
            /**
             * {type: 'brew-build',
             * gate_tag_name: {$regex: 'rhel-8.3'},
             * resultsdb_testcase: {$regex: 'manual'},
             * $and: [ { gate_tag_name: { $type: "string" } }, { gate_tag_name: { $gt: "" } } ] }
             */
            var type;
            switch (buildType) {
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
                product_id,
                buildType: type,
                ignoreCISystem,
            };
            var nstate = state;
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
