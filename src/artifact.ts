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
    | 'redhat-container'
    | 'productmd-compose';

export type ArtifactType = {
    _id: string;
    _updated: string;
    _version: string;
    aid: string;
    type: ArtifactNameType;
    payload: PayloadsType;
    states: StateKaiType[];
    greenwave_decision?: GreenwaveDecisionReplyType;
    resultsdb_testscase: number[];
};

/**
 * Decision requirements types
 * https://pagure.io/greenwave/blob/master/f/docs/decision_requirements.rst
 */
export type GreenwaveRequirementTypesType =
    | 'excluded'
    | 'blacklisted'
    | 'test-result-failed'
    | 'test-result-passed'
    | 'test-result-missing'
    | 'test-result-errored'
    | 'invalid-gating-yaml'
    | 'fetched-gating-yaml'
    | 'missing-gating-yaml'
    | 'failed-fetch-gating-yaml'
    | 'invalid-gating-yaml-waived'
    | 'missing-gating-yaml-waived'
    | 'test-result-failed-waived'
    | 'test-result-missing-waived'
    | 'test-result-errored-waived'
    | 'failed-fetch-gating-yaml-waived';

/**
 * Opposite to Kai-db state, greenwave/resultsdb state
 */
export type GreenwaveRequirementType = {
    type: GreenwaveRequirementTypesType;
    testcase: string;
    subject_type: string;
    /* python2-flask-1.0.2-1.rawhide */
    subject_identifier: string;
    result_id: number;
    error_reason: string;
    source?: string;
    scenario?: string | null;
    item: { type: ArtifactNameType; identifier: string };
};

/**
 * Based on documentation from:
 * https://pagure.io/greenwave/blob/master/f/greenwave/api_v1.py
 * 
    "data": {
        "arch": [ "armhfp" ],
        "item": [ "bodhi-5.1.1-1.fc32" ],
        "seconds_taken": [ "1" ],
        "type": [ "koji_build" ]
    },
    "groups": [ "c038df76-47f5-11ea-839f-525400364adf" ],
    "href": "https://taskotron.fedoraproject.org/resultsdb_api/api/v2.0/results/38088806",
    "id": 38088806,
    "note": "no binary RPMs",
    "outcome": "PASSED",
    "ref_url": "https://taskotron.fedoraproject.org/artifacts/all/c038df76-47f5-11ea-839f-525400364adf/tests.yml/bodhi-5.1.1-1.fc32.log",
    "submit_time": "2020-02-07T03:14:43.076427",
    "testcase": {
        "href": "https://taskotron.fedoraproject.org/resultsdb_api/api/v2.0/testcases/dist.abicheck",
        "name": "dist.abicheck",
        "ref_url": "http://faketestcasesRus.com/scratch.abicheck"
    }
 * 
 */
export type GreenwaveResultType = {
    data: {
        brew_task_id: Array<string>;
        category: Array<string>;
        ci_email: Array<string>;
        ci_irc: Array<string>;
        ci_name: Array<string>;
        ci_team: Array<string>;
        ci_url: Array<string>;
        component: Array<string>;
        issuer: Array<string>;
        item: Array<string>;
        log: Array<string>;
        publisher_id: Array<string>;
        rebuild: Array<string>;
        scratch: Array<string>;
        system_os: Array<string>;
        system_provider: Array<string>;
        arch: Array<string>;
        seconds_taken: Array<string>;
        type: Array<ArtifactNameType>;
    };
    groups: Array<string>;
    href: string;
    id: number;
    note: string;
    /**
     * Based on mapping at:
     * https://pagure.io/fedora-ci/messages/blob/master/f/schemas/test-complete.yaml#_8
     * https://pagure.io/fedora-ci/messages/blob/master/f/mappings/results/brew-build.test.complete.yaml#_3
     * https://pagure.io/fedora-ci/messages/blob/master/f/mappings/results/brew-build.test.error.yaml#_3
     */
    outcome:
        | 'INFO'
        | 'ERROR'
        | 'PASSED'
        | 'FAILED'
        | 'RUNNING'
        | 'NOT_APPLICABLE'
        | 'NEEDS_INSPECTION';
    /**
     * ref_url - always run.url, for old and new mapping:
     * https://github.com/release-engineering/resultsdb-updater/blob/master/resultsdbupdater/utils.py#L343
     */
    ref_url: string;
    submit_time: string;
    testcase: {
        href: string;
        name: string;
        ref_url: string;
    };
};

/**
    "comment": "The tests were never even started.",
    "id": 256,
    "product_version": "fedora-32",
    "proxied_by": "bodhi@service",
    "subject": {
        "item": "bodhi-5.1.1-1.fc32",
        "type": "koji_build"
    },
    "subject_identifier": "bodhi-5.1.1-1.fc32",
    "subject_type": "koji_build",
    "testcase": "dist.rpmdeplint",
    "timestamp": "2020-02-03T14:16:32.017146",
    "username": "alice",
    "waived": true
*/
export type GreenwaveWaiveType = {
    comment: string;
    id: number;
    product_version: string;
    proxied_by: string;
    subject: {
        item: string;
        type: string;
    };
    subject_identifier: string;
    subject_type: string;
    testcase: string;
    timestamp: string;
    username: string;
    waived: boolean;
};

export type GreenwaveDecisionReplyType = {
    policies_satisfied: boolean;
    summary: string;
    applicable_policies: Array<string>;
    waivers: Array<GreenwaveWaiveType>;
    results: Array<GreenwaveResultType>;
    satisfied_requirements: Array<GreenwaveRequirementType>;
    unsatisfied_requirements: Array<GreenwaveRequirementType>;
};

export type StageNameType =
    | 'test'
    | 'build'
    | 'dispatcher'
    | 'dispatch'
    | 'greenwave';

export type StateNameType = 'error' | 'queued' | 'running' | 'complete';

export type StateExtendedNameType =
    | 'info'
    | 'passed'
    | 'failed'
    | 'missing'
    /* greenwave result */
    | 'additional-tests'
    | StateNameType
    | GreenwaveRequirementTypesType;

export type StateGreenwaveKaiType = {
    /* kai state */
    ks: StateKaiType;
    /* greenwave state */
    gs: StateGreenwaveType;
};

export type StateType =
    | StateKaiType
    | StateGreenwaveType
    | StateGreenwaveKaiType;

export type StatesByCategoryType = {
    [key in StateExtendedNameType]?: Array<StateType>;
};

export type StateGreenwaveType = {
    testcase: string;
    waiver?: GreenwaveWaiveType;
    result?: GreenwaveResultType;
    requirement?: GreenwaveRequirementType;
};

export type StateKaiType = {
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
export type KaiStateType = StateKaiType['kai_state'];
export type PayloadsType = PayloadRPMBuildType | PayloadMBSBuildType;

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

export type PayloadMBSBuildType = {
    context: string;
    id: number;
    issuer: string;
    name: string;
    nsvc: string;
    nvr: string;
    stream: string;
    version: string;
    source: string;
    scratch: boolean;
    component: string;
    gate_tag_name: string;
};

export interface ComponentMapping {
    component_name: string;
    default_assignee: string;
    default_assignee_name: string;
    description: string;
    product_id: number;
    sst_name: string;
    qa_contact: string;
    qa_contact_name: string;
    _updated: string;
}

export const KnownKaiStates: StateNameType[] = [
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
