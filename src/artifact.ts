/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021, 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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
import { BrokerMessagesType, EtaBrokerMessagesType } from './types';

export type ComposeArtifactType = 'productmd-compose';
export type ContainerImageArtifactType = 'redhat-container-image';
export type MBSArtifactType = 'redhat-module';
export type RPMArtifactType =
    | 'brew-build'
    | 'copr-build'
    | 'koji-build'
    | 'koji-build-cs';

export type ArtifactType =
    | ComposeArtifactType
    | ContainerImageArtifactType
    | MBSArtifactType
    | RPMArtifactType;

export type ComposeType = 'gate' | 'production' | 'testing';

export interface PayloadComposeBuildType {
    compose_id: string;
    compose_type: ComposeType;
}

export interface PayloadRPMBuildType {
    nvr: string;
    source: string;
    issuer: string;
    task_id: number;
    build_id: number;
    scratch: boolean;
    component: string;
    gate_tag_name: string;
}

/*
 * https://pagure.io/fedora-ci/messages/blob/master/f/schemas/redhat-container-image.yaml
 */
export interface PayloadContainerImageType {
    id: string;
    nvr: string;
    tag?: string;
    name?: string;
    source?: string;
    issuer: string;
    task_id: number;
    build_id?: number;
    scratch: boolean;
    component: string;
    namespace?: string;
    full_names: string[];
    registry_url?: string;
    /*
     * Entries come from: VirtualTopic.eng.brew.build.complete
     * https://datagrepper.engineering.redhat.com/raw?topic=/topic/VirtualTopic.eng.brew.build.complete&delta=86400&contains=container_build
     */
    osbs_subtypes?: string[];
}

export interface PayloadMBSBuildType {
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
}

/**
 * TypeScript guards
 */
export function isArtifactRPM(artifact: Artifact): artifact is ArtifactRPM {
    return (
        artifact.type === 'brew-build' ||
        artifact.type === 'koji-build' ||
        artifact.type === 'koji-build-cs'
    );
}
export function isArtifactMBS(artifact: Artifact): artifact is ArtifactMBS {
    return artifact.type === 'redhat-module';
}
export function isArtifactCompose(
    artifact: Artifact,
): artifact is ArtifactCompose {
    return artifact.type === 'productmd-compose';
}
export function isArtifactRedhatContainerImage(
    artifact: Artifact,
): artifact is ArtifactContainerImage {
    return artifact.type === 'redhat-container-image';
}
export function isStateKai(state: StateType): state is StateKaiType {
    return _.has(state, 'kai_state');
}

export type PayloadsType =
    | PayloadComposeBuildType
    | PayloadMBSBuildType
    | PayloadRPMBuildType;

export interface ArtifactBase {
    _id: string;
    _updated: string;
    _version: string;
    aid: string;
    states: StateKaiType[];
    states_eta: StateErrataToolAutomationType[];
    type: ArtifactType;
    payload?: {};
    component_mapping?: ComponentComponentMappingType;
    greenwave_decision?: GreenwaveDecisionReplyType;
    resultsdb_testscase: number[];
}

export type ArtifactRPM = ArtifactBase & {
    type: RPMArtifactType;
    payload: PayloadRPMBuildType;
};
export type ArtifactMBS = ArtifactBase & {
    type: MBSArtifactType;
    payload: PayloadMBSBuildType;
};
export type ArtifactContainerImage = ArtifactBase & {
    type: ContainerImageArtifactType;
    payload: PayloadContainerImageType;
};
export type ArtifactCompose = ArtifactBase & {
    type: ComposeArtifactType;
    payload: PayloadComposeBuildType;
};

export type Artifact =
    | ArtifactRPM
    | ArtifactMBS
    | ArtifactContainerImage
    | ArtifactCompose;

/**
 * Decision requirements types
 * https://gating-greenwave.readthedocs.io/en/latest/decision_requirements.html
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
    result_id?: number;
    details?: string;
    error_reason?: string;
    source?: string;
    scenario?: string | null;
    item: { type: ArtifactType; identifier: string };
};

export type GreenwaveRequirementOutcome =
    | 'INFO'
    | 'ERROR'
    | 'PASSED'
    | 'FAILED'
    | 'RUNNING'
    | 'NOT_APPLICABLE'
    | 'NEEDS_INSPECTION';

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
        brew_task_id: string[];
        category?: string[];
        ci_docs?: string[];
        ci_email?: string[];
        ci_irc?: string[];
        ci_name?: string[];
        ci_team?: string[];
        ci_url?: string[];
        component?: string[];
        issuer?: string[];
        item: string[];
        log?: string[];
        msg_id: string[];
        publisher_id?: string[];
        rebuild?: string[];
        scratch: string[];
        system_os?: string[];
        system_provider?: string[];
        arch?: string[];
        seconds_taken?: string[];
        type: ArtifactType[];
    };
    groups: string[];
    href: string;
    id: number;
    note: string;
    /**
     * Based on mapping at:
     * https://pagure.io/fedora-ci/messages/blob/master/f/schemas/test-complete.yaml#_8
     * https://pagure.io/fedora-ci/messages/blob/master/f/mappings/results/brew-build.test.complete.yaml#_3
     * https://pagure.io/fedora-ci/messages/blob/master/f/mappings/results/brew-build.test.error.yaml#_3
     */
    outcome: GreenwaveRequirementOutcome;
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
    applicable_policies: string[];
    waivers: GreenwaveWaiveType[];
    results: GreenwaveResultType[];
    satisfied_requirements: GreenwaveRequirementType[];
    unsatisfied_requirements: GreenwaveRequirementType[];
};

export type StageNameType =
    | 'test'
    | 'build'
    | 'dispatcher'
    | 'dispatch'
    | 'greenwave';

export type StateNameType = 'error' | 'queued' | 'running' | 'complete';

/**
 * https://pagure.io/fedora-ci/messages/blob/master/f/schemas/test-complete.yaml#_14
 *
 * complete is expanded to:
 *
 * - passed
 * - failed
 * - info
 * - needs_inspection
 * - not_applicable
 */
export type StateExtendedKaiNameType =
    | 'passed'
    | 'failed'
    | 'info'
    | 'needs_inspection'
    | 'not_applicable'
    | StateNameType;

export type StateExtendedNameType =
    /* greenwave result */
    | 'additional-tests'
    | StateExtendedKaiNameType
    | GreenwaveRequirementTypesType;

export interface StateGreenwaveKaiType {
    /* kai state */
    ks: StateKaiType;
    /* greenwave state */
    gs: StateGreenwaveType;
}

export type StateType =
    | StateKaiType
    | StateGreenwaveType
    | StateGreenwaveKaiType;

export type StatesByCategoryType = {
    [key in StateExtendedNameType]?: StateType[];
};

export interface StateGreenwaveType {
    testcase: string;
    waiver?: GreenwaveWaiveType;
    result?: GreenwaveResultType;
    requirement?: GreenwaveRequirementType;
}

export interface KaiStateType {
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
}

export interface KaiErrataToolAutomationStateType {
    msg_id: string;
    version: string;
    timestamp: number;
}

export type StateKaiType = {
    broker_msg_body: BrokerMessagesType;
    kai_state: KaiStateType;
};

export type StateErrataToolAutomationType = {
    broker_msg_body: EtaBrokerMessagesType;
    kai_state: KaiErrataToolAutomationStateType;
};

export const KnownKaiStates: StateNameType[] = [
    'error',
    'queued',
    'running',
    'complete',
];

export type ComponentComponentMappingType = {
    component_name: string;
    product_id: number;
    description: string;
    def_assignee: string;
    def_assignee_name: string;
    qa_contact: string;
    qa_contact_name: string;
    sst_team_name: string;
    _updated: string;
};

/**
 * GraphQL KojiInstanceInputType
 */
export type KojiInstanceType = 'cs' | 'fp' | 'rh';
/**
 * GraphQL DistGitInstanceInputType
 */
export type DistGitInstanceType = KojiInstanceType;
/**
 * GraphQL MbsInstanceInputType
 */
export type MbsInstanceType = KojiInstanceType;

export const koji_instance = (type: ArtifactType): KojiInstanceType => {
    switch (type) {
        case 'koji-build':
            return 'fp';
        case 'koji-build-cs':
            return 'cs';
        case 'brew-build':
        case 'redhat-module':
            return 'rh';
        default:
            throw new Error(`Unknown type: ${type}`);
    }
};

export interface CommitObject {
    committer_date_seconds: number;
    committer_email: string;
    committer_name: string;
}

export interface KojiBuildTag {
    id: number;
    name: string;
}

export interface KojiBuildTagging {
    active: boolean;
    create_ts: number;
    creator_id: number;
    creator_name: string;
    revoke_ts?: number;
    revoker_id?: number;
    revoker_name?: string;
    tag_id: number;
    tag_name: string;
}

export interface KojiHistory {
    tag_listing: KojiBuildTagging[];
}

export interface KojiBuildInfo {
    build_id: number;
    commit_obj?: CommitObject;
    completion_time: string;
    completion_ts: number;
    history?: KojiHistory;
    name: string;
    nvr: string;
    owner_id: number;
    owner_name: string;
    package_id?: number;
    release?: string;
    source: string;
    tags: KojiBuildTag[];
    version?: string;
}

export interface KojiTaskInfo {
    builds?: KojiBuildInfo[];
}

export interface MbsTask {
    id?: number;
    nvr: string;
}

export interface MbsBuildInfo {
    commit?: CommitObject;
    id: number;
    name: string;
    owner: string;
    scmurl?: string;
    tag_history?: KojiHistory;
    tags?: KojiBuildTag[];
    tasks: MbsTask[];
    time_completed?: string;
}

export interface ErrataLinkedAdvisory {
    build_id: number;
    build_nvr: string;
    advisory_id: number;
    product_name: string;
    advisory_name: string;
    advisory_status: string;
}
