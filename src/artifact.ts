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

import { BrokerMessagesType } from './types';

export type ArtifactNameType =
    | 'brew-build'
    | 'koji-build'
    | 'copr-build'
    | 'redhat-module'
    | 'koji-build-cs'
    | 'productmd-compose';

export type ArtifactType = {
    _id: string;
    _updated: string;
    _version: string;
    aid: string;
    type: ArtifactNameType;
    payload: PayloadsType;
    states: Array<StateType>;
    gating_decision?: GatingDecisionType;
    resultsdb_testscase: Array<number>;
};

export type GatingDecisionType = {
    waivers: Array<{ testcase: string }>;
    summary: string;
    results: Array<{
        id: string;
        name: string;
        ref_url: string;
        result_id: string;
    }>;
    satisfied_requirements: Array<{
        testcase: { name: string };
        result_id: string;
    }>;
    unsatisfied_requirements: Array<any>;
};

export type StageNameType = 'test' | 'build' | 'dispatcher' | 'dispatch';

export type StateNameType = 'error' | 'queued' | 'running' | 'complete';

export type StateExtendedNameType =
    | StateNameType
    | 'info'
    | 'passed'
    | 'failed'
    | 'missing';

export type StatesByCategoryType = {
    [key in StateExtendedNameType]?: Array<StateType>;
};

export type StateType = {
    broker_msg_body: BrokerMessagesType;
    kai_state: {
        stage: StageNameType;
        state: StateNameType;
        msg_id: string;
        version: string;
        thread_id: string;
        timestamp: number;
        origin: {
            reason: string;
            creator: string;
        };
        test_case_name: string;
    };
};
export type KaiStateType = StateType['kai_state'];

export type PayloadsType = PayloadRPMBuildType;

export type PayloadRPMBuildType = {
    nvr: string;
    source: string;
    issuer: string;
    task_id: number;
    build_id: number;
    scratch: boolean;
    component: string;
    gate_tag_name: string;
};

export const known_states: Array<StateNameType> = [
    'error',
    'queued',
    'running',
    'complete',
];

/**
 * GraphQL KojiInstanceInputType
 */
export type KojiInstanceType = 'fp' | 'cs' | 'rh';

export const koji_instance = (type: ArtifactNameType): KojiInstanceType => {
    switch (type) {
        case 'koji-build':
            return 'fp';
        case 'koji-build-cs':
            return 'cs';
        case 'brew-build':
            return 'rh';
        default:
            throw new Error(`Unknown type: ${type}`);
    }
};
