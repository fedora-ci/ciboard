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
import { TabsProps } from '@patternfly/react-core';
import { mappingDatagrepperUrl } from './config';

/**
 * Valid for: Version: 1.y.z
 * https://pagure.io/fedora-ci/messages/blob/master/f/schemas/brew-build.test.complete.yaml
 *
 */
export namespace MSG_V_1 {
    export type MessagesType = MessagesRPMBuildType;
    export type RPMBuildsType = 'koji-build' | 'brew-build';

    export type TestCategoryType =
        | 'system'
        | 'functional'
        | 'validation'
        | 'integration'
        | 'performance'
        | 'static-analysis'
        | 'interoperability';

    export type TestResultType =
        | 'info'
        | 'passed'
        | 'failed'
        | 'not_applicable'
        | 'needs_inspection';

    export type MsgRunType = {
        url: string;
        log: string;
        debug?: string;
        rebuild?: string;
        log_raw?: string;
        log_stream?: string;
        trigger_rebuild?: string;
    };

    export type MsgSystemType = {
        os: string;
        label?: string;
        variant?: string;
        provider: string;
        architecture: string;
    };

    export type MsgCommonType = {
        note: string;
        version: string;
        generated_at: string;
    };

    export type MsgContactType = {
        url?: string;
        irc?: string;
        name: string;
        team: string;
        docs: string;
        email: string;
        slack?: string;
        version?: string;
    };

    export type MsgStageType = {
        name: string;
    };

    export type MsgPipelineType = {
        id: string;
        name: string;
        build?: string;
        stage?: MsgStageType;
    };

    export type MsgTestCommonType = {
        type: string;
        note?: string;
        docs?: string;
        xunit?: string;
        label?: string[];
        category: TestCategoryType;
        lifetime?: number;
        progress?: number;
        scenario?: string;
        namespace: string;
        xunit_urls?: string[];
    };

    export type MsgTestCompleteType = {
        result: TestResultType;
        output?: string;
        runtime?: number;
        output_urls?: string[];
    };

    export type MsgNotificationType = {
        recipients?: string[];
    };

    export type MsgRpmBuild = {
        id: number;
        nvr: string;
        type: RPMBuildsType;
        issuer: string;
        source?: string;
        scratch: boolean;
        baseline?: string;
        component: string;
        dependencies?: string[];
    };

    export type MessagesRPMBuildType =
        | MsgRPMBuildTestError
        | MsgRPMBuildTestQueued
        | MsgRPMBuildTestRunning
        | MsgRPMBuildTestComplete;

    interface MessageRPMBuildTestCommon {
        run: MsgRunType;
        test: MsgTestCommonType;
        version: MsgCommonType['version'];
        contact: MsgContactType;
        pipeline: MsgPipelineType;
        artifact: MsgRpmBuild;
        generated_at: MsgCommonType['generated_at'];
    }

    export interface MsgRPMBuildTestComplete extends MessageRPMBuildTestCommon {
        test: MsgTestCommonType & MsgTestCompleteType;
        system: MsgSystemType[];
        notification?: MsgNotificationType;
    }

    export type MsgErrorType = {
        reason: string;
        issue_url?: string;
    };

    export interface MsgRPMBuildTestError extends MessageRPMBuildTestCommon {
        error: MsgErrorType;
        notification?: MsgNotificationType;
    }

    export interface MsgRPMBuildTestQueued extends MessageRPMBuildTestCommon {}

    export interface MsgRPMBuildTestRunning extends MessageRPMBuildTestCommon {}

    export function isMsg(msg: BrokerTestMsg): msg is MessagesType {
        return msg.version.startsWith('0.2.') || msg.version.startsWith('1.');
    }
}

/**
 * Valid for: Version: 0.1.z
 * https://pagure.io/fedora-ci/messages/blob/e3f4758ff5a0948cceb09d0b214690351e453e7c/f/schemas/brew-build.test.complete.yaml
 */
export namespace MSG_V_0_1 {
    export type MessagesType = MessagesRPMBuildType;

    export type RPMBuildsType = 'koji-build' | 'brew-build';
    export type ArtifactNameType =
        | 'brew-build'
        | 'koji-build'
        | 'copr-build'
        | 'redhat-module'
        | 'productmd-compose';

    export type TestResultType =
        | 'info'
        | 'passed'
        | 'failed'
        | 'not_applicable'
        | 'needs_inspection';

    export type TestCategoryType =
        | 'system'
        | 'functional'
        | 'validation'
        | 'integration'
        | 'performance'
        | 'static-analysis'
        | 'interoperability';

    export type MessagesRPMBuildType =
        | MsgRPMBuildTestComplete
        | MsgRPMBuildTestError
        | MsgRPMBuildTestQueued
        | MsgRPMBuildTestRunning;

    interface MessageRPMBuildTestCommon {
        ci: MsgContactType;
        run: MsgRunType;
        note: string;
        type: string;
        label: string;
        version: string;
        artifact: MsgRpmBuild;
        category: TestCategoryType;
        thread_id: string;
        namespace: string;
        generated_at: number;
    }

    export interface MsgRPMBuildTestComplete extends MessageRPMBuildTestCommon {
        docs: string;
        xunit: string;
        status: TestResultType;
        system: MsgSystemType[];
        web_url: string;
        recipients: string[];
    }

    export interface MsgRPMBuildTestError extends MessageRPMBuildTestCommon {
        docs: string;
        reason: string;
        issue_url: string;
        recipients: string[];
    }

    export interface MsgRPMBuildTestQueued extends MessageRPMBuildTestCommon {}

    export interface MsgRPMBuildTestRunning extends MessageRPMBuildTestCommon {
        lifetime: number;
        progress: number;
    }

    export type MsgContactType = {
        name: string;
        team: string;
        docs: string;
        email: string;
        url?: string;
        irc?: string;
        environment?: 'production' | 'stage';
        version?: string;
    };

    export type MsgRunType = {
        url: string;
        log: string;
        log_raw?: string;
        log_stream?: string;
        rebuild?: string;
        debug?: string;
        additional_urls?: {};
    };

    export type MsgRpmBuild = {
        id: number;
        nvr: string;
        type: RPMBuildsType;
        issuer: string;
        source?: string;
        scratch: boolean;
        baseline?: string;
        component: string;
        dependencies?: string[];
    };

    export type MsgSystemType = {
        os: string;
        provider: string;
        architecture: string;
        variant?: string;
        label?: string;
    };

    export function isMsg(msg: BrokerTestMsg): msg is MessagesType {
        return msg.version.startsWith('0.1.');
    }

    export function resultHasDocs(
        msg: BrokerTestMsg,
    ): msg is MsgRPMBuildTestComplete | MsgRPMBuildTestError {
        return _.has(msg, 'docs');
    }
}

export type BrokerMsg = BrokerTestMsg | BrokerEtaMsg;
export type BrokerEtaMsg = unknown;
export type BrokerTestMsg = MSG_V_0_1.MessagesType | MSG_V_1.MessagesType;

// CHILD!!!!!!!!!!!!!!!!!!!!!!!!!!

/**
 * Based on all possible outcomes from: https://gitlab.cee.redhat.com/osci/errata-automation/-/blob/master/main.py
 */
type ErrataAutomationOutcome =
    | 'FAILED'
    | 'CREATED'
    | 'MODIFIED'
    | 'UNCHANGED'
    | 'BUGLISTUPDATED';

export type ErrataAutomationBugCiStatus =
    | 'BUG_READY'
    | 'BUG_IN_ADVISORY'
    | 'BUG_VERIFIED_TESTED_MISSING';

/**
 * Information how bug affected on this Errata Automation
 */
type ErrataAutomationBugInfo = {
    /* Type of bug from errata_automation point of view */
    ci_status: ErrataAutomationBugCiStatus;
    /* NVR where this bug is fixed */
    fixed_in_version: string;
    /* Bugzilla bug number */
    id: number;
    /* Bugzilla bug status, example: ASSIGNED */
    status: string;
    /* Bugzilla bug summary */
    summary: string;
};

/**
 * Related Jira tickets:
 *
 *    https://issues.redhat.com/browse/OSCI-4011
 */
export type EtaBrokerMessagesType = {
    /** https://errata.devel.redhat.com/advisory/109137 */
    advisory_url: string;
    bugs: ErrataAutomationBugInfo[];
    /** Example: 'updated advisory: https://errata.devel.redhat.com/advisory/109137' */
    ci_run_explanation: string;
    ci_run_outcome: ErrataAutomationOutcome;
    /** https://jenkins.prod.osci.redhat.com/job/errata-tool-automation/job/et-automation-rhel/895/ */
    ci_run_url: string;
    /** iso 8601 string. */
    msg_time: string;
    /** message schema version format according to https://semver.org/ */
    msg_version: string;
};

export type TabClickHandlerType = Extract<TabsProps['onSelect'], Function>;

export interface SSTItem {
    display_name: string;
    name: string;
    releases: string[];
}

/**
export interface SSTResult {
    tag: string;
    nvr: string;
    time: string;
    status: string;
    sortKey: string;
    assignee: string;
    artifact: {
        aid: string;
        aid_link: string;
    };
    testcase: {
        category: string;
        namespace: string;
        type: string;
    };
    log_urls?: string[];
    gating_bug?: {
        text: string;
        url: string;
    };
    rebuild_url?: string;
    metadata_url: string;
    gating_yaml_url?: string;
}
*/

/**
 * Raw reply from SST backend
 *  {
 *     "nvr": "ftp",
 *     "nvr_link": "https://gitlab.com/redhat/centos-stream/rpms/ftp.git",
 *     "assignee": "email@domain.com",
 *     "aid": "0ef459c4-48d4-43cd-8210-e281eedf8899",
 *     "aid_link": "https://artifacts.dev.testing-farm.io/0ef459c4-48d4-43cd-8210-e281eedf8899",
 *     "namespace": "5",
 *     "type": "",
 *     "el8_gating_bug": "File bug",
 *     "el8_gating_bug_link": "http://sst.osci.redhat.com/www/file-bug-centos.html",
 *     "test_git": "git",
 *     "test_git_link": "https://src.fedoraproject.org/tests/ftp.git",
 *     "rebuild_link": "https://sst.osci.redhat.com/www/rebuild-centos.html",
 *     "yaml": "gating.yaml",
 *     "yaml_link": "https://gitlab.com/redhat/centos-stream/rpms/ftp.git",
 *     "log_link": "https://artifacts.dev.testing-farm.io/0ef459c4-48d4-43cd-8210-e281eedf8899/work-testg7QfRB",
 *     "category": "",
 *     "time": "2022-04-26 11:00:56",
 *     "state": "complete",
 *     "status": "failed",
 *     "buildstate": "complete",
 *     "buildstate_link": "https://api.dev.testing-farm.io/v0.1/requests/0ef459c4-48d4-43cd-8210-e281eedf8899",
 *     "tag": "None",
 *     "tests_number": "2"
 *   }
 */
export interface SSTResult {
    nvr: string;
    nvr_link: string;
    assignee: string;
    aid: string;
    aid_link: string;
    namespace: string;
    type: string;
    el8_gating_bug: string;
    el8_gating_bug_link: string;
    test_git: string;
    test_git_link: string;
    rebuild_link: string;
    yaml: string;
    yaml_link: string;
    log_link: string | string[];
    category: string;
    time: string;
    state: string;
    status: string;
    buildstate: string;
    buildstate_link: string;
    tag: string;
    tests_number: string;
}

export interface MetadataQueryResult {
    metadata_consolidated: Metadata;
}

export interface Metadata {
    payload?: MetadataPayload;
}

export interface MetadataPayload {
    contact?: MetadataContact;
    description?: string;
    dependency?: MetadataDependency[];
    known_issues?: MetadataKnownIssue[];
    waive_message?: string;
}

export interface MetadataContact {
    name?: string;
    url?: string;
    irc?: string;
    team?: string;
    docs?: string;
    email?: string;
    gchat_room_url?: string;
    slack_channel_url?: string;
    report_issue_url?: string;
}

export interface MetadataDependency {
    comment: string;
    dependency: 'is_required' | 'is_related_to';
    testcase_name: string;
}

export interface MetadataKnownIssue {
    info: string;
    status: 'active' | 'fixed' | 'irrelevant';
    severity: 'blocker' | 'critical' | 'major' | 'normal' | 'minor';
}

export interface HitInfo {
    _id: string;
    _index: string;
    _score: number;
    _routing: string;
}

export type ATypesRpm =
    | 'brew-build'
    | 'copr-build'
    | 'koji-build'
    | 'koji-build-cs';
export type ATypesMbs = 'redhat-module';
export type ATypesCompose = 'productmd-compose';
export type ATypesContainerImage = 'redhat-container-image';

export type ArtifactType =
    | ATypesRpm
    | ATypesMbs
    | ATypesCompose
    | ATypesContainerImage;

export type ComposeType = 'gate' | 'production' | 'testing';

export interface ArtifactBase {
    hitInfo: HitInfo;
    children: ArtifactChildren;
    hitSource: HitSourceArtifact;
    component_mapping?: ComponentComponentMappingType;
    greenwaveDecision?: GreenwaveDecisionReplyType;
    resultsdb_testscase: number[];
}

export type StateErrataToolAutomationType = {
    broker_msg_body: EtaBrokerMessagesType;
    kai_state: DbErrataToolAutomationStateType;
};

export type HitSourceArtifact =
    | HitSourceArtifactRpm
    | HitSourceArtifactMbs
    | HitSourceArtifactCompose
    | HitSourceArtifactContainerImage;

export type Artifact =
    | ArtifactRpm
    | ArtifactMbs
    | ArtifactCompose
    | ArtifactContainerImage;

export type ArtifactRpm = ArtifactBase & {
    hitSource: HitSourceArtifactRpm;
};

export type ArtifactMbs = ArtifactBase & {
    hitSource: HitSourceArtifactMbs;
};

export type ArtifactCompose = ArtifactBase & {
    hitSource: HitSourceArtifactCompose;
};

export type ArtifactContainerImage = ArtifactBase & {
    hitSource: HitSourceArtifactContainerImage;
};

export type HitSourceArtifactRpm = {
    nvr: string;
    aType: ATypesRpm;
    taskId: string;
    issuer: string;
    source: string;
    scratch: boolean;
    buildId: string;
    gateTag: string;
    component: string;
    brokerMsgIdGateTag: string;
};

export type HitSourceArtifactMbs = {
    nsvc: string;
    mbsId: string;
    aType: ATypesMbs;
    issuer: string;
    scratch: boolean;
    gateTag: string;
    buildId: string;
};

export type HitSourceArtifactContainerImage = {
    nvr: string;
    aType: ATypesContainerImage;
    taskId: string;
    scratch: boolean;
};

export type HitSourceArtifactCompose = {
    aType: ATypesCompose;
    composeId: string;
};

/**
 * Decision requirements types
 * https://gating-greenwave.readthedocs.io/en/latest/decision_requirements.html
 */
export type GreenwaveRequirementTypes =
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
 * Opposite to messages-db state, greenwave/resultsdb state
 */
export type GreenwaveRequirementType = {
    item: { type: ArtifactType; identifier: string };
    type: GreenwaveRequirementTypes;
    source?: string;
    details?: string;
    testcase: string;
    scenario?: string | null;
    result_id?: number;
    subject_type: string;
    /* python2-flask-1.0.2-1.rawhide */
    error_reason?: string;
    subject_identifier: string;
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
export type StateExtendedTestMsgName =
    | 'info'
    | 'passed'
    | 'failed'
    | 'not_applicable'
    | 'needs_inspection'
    | StateNameType;

export type StateExtendedName =
    /* greenwave result */
    'additional-tests' | StateExtendedTestMsgName | GreenwaveRequirementTypes;

export interface StateGreenwaveAndTestMsg {
    /* greenwave state */
    gs: StateGreenwave;
    /* message state */
    ms: StateTestMsg;
}

export type StateMsg = StateTestMsg | StateEtaMsg;

export type ArtifactState =
    | StateMsg
    | StateGreenwave
    | StateGreenwaveAndTestMsg;

export type StatesByCategoryType = {
    [key in StateExtendedName]?: ArtifactState[];
};

export interface StateGreenwave {
    waiver?: GreenwaveWaiveType;
    result?: GreenwaveResultType;
    testcase: string;
    requirement?: GreenwaveRequirementType;
}

export interface DbErrataToolAutomationStateType {
    msg_id: string;
    version: string;
    timestamp: number;
}

export interface ArtifactChildren {
    hits: StateMsg[];
    hitsInfo: HitsInfo;
}

export interface HitsInfo {
    total: { value: number };
}

export interface StateTestMsg {
    hitInfo: HitInfo;
    hitSource: HitSourceTest;
    customMetadata?: Metadata;
}

export interface StateEtaMsg {
    hitInfo: HitInfo;
    hitSource: HitSourceEta;
}

export interface HitSourceEta {
    nvr: string;
    aType: string;
    taskId: string;
    issuer: string;
    component: string;
    brokerMsgId: string;
    brokerTopic: string;
    etaCiRunUrl: string;
    etaCiRunOutcome: string;
    etaCiRunExplanation: string;
    rawData: {
        message: {
            brokerExtra: any;
            brokerMsgId: string;
            brokerMsgBody: BrokerEtaMsg;
            brokerMsgTopic: string;
        };
    };
}

export interface HitSourceTest {
    nvr: string;
    aType: string;
    taskId: string;
    issuer: string;
    scratch: boolean;
    threadId: string;
    component: string;
    testState: StateNameType;
    testStage: string;
    brokerTopic: string;
    brokerMsgId: string;
    testCaseName: string;
    msgFullText: string;
    rawData: {
        message: {
            brokerExtra: any;
            brokerMsgId: string;
            brokerMsgBody: BrokerTestMsg;
            brokerMsgTopic: string;
        };
    };
    artToMsgs: {
        name: 'message';
        parent: string;
    };
}

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
export type KojiInstance = 'cs' | 'fp' | 'rh';
/**
 * GraphQL DistGitInstanceInputType
 */
export type DistGitInstance = KojiInstance;
/**
 * GraphQL MbsInstanceInputType
 */
export type MbsInstanceType = KojiInstance;

export const kojiInstance = (type: ArtifactType): KojiInstance => {
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

/**
 * TypeScript guards
 */
export function isArtifactRpm(artifact: Artifact): artifact is ArtifactRpm {
    const { hitSource } = artifact;
    return (
        hitSource.aType === 'brew-build' ||
        hitSource.aType === 'koji-build' ||
        hitSource.aType === 'koji-build-cs'
    );
}

export function isArtifactMbs(artifact: Artifact): artifact is ArtifactMbs {
    const { hitSource } = artifact;
    return hitSource.aType === 'redhat-module';
}

export function isArtifactCompose(
    artifact: Artifact,
): artifact is ArtifactCompose {
    const { hitSource } = artifact;
    return hitSource.aType === 'productmd-compose';
}

export function isArtifactRedhatContainerImage(
    artifact: Artifact,
): artifact is ArtifactContainerImage {
    const { hitSource } = artifact;
    return hitSource.aType === 'redhat-container-image';
}

export function isArtifactScratch(artifact: Artifact): boolean {
    if (
        isArtifactRpm(artifact) ||
        isArtifactMbs(artifact) ||
        isArtifactRedhatContainerImage(artifact)
    ) {
        return artifact.hitSource.scratch;
    }
    return false;
}

export function isStateMsg(
    state: ArtifactState | undefined,
): state is StateMsg {
    return _.has(state, 'hitInfo');
}

export function isStateEtaMsg(
    state: ArtifactState | undefined,
): state is StateEtaMsg {
    return _.has(state, 'hitSource.etaCiRunUrl');
}

export function isStateTestMsg(
    state: ArtifactState | undefined,
): state is StateTestMsg {
    return _.has(state, 'hitSource.testState');
}

export function isGreenwaveState(
    state: ArtifactState | undefined,
): state is StateGreenwave {
    return _.has(state, 'testcase');
}

export function isGreenwaveAndTestMsg(
    state: ArtifactState | undefined,
): state is StateGreenwaveAndTestMsg {
    return _.has(state, 'gs') && _.has(state, 'ms');
}

/**
 * Getters
 */

export const getMsgBody = (state: StateMsg): BrokerMsg => {
    return state.hitSource.rawData.message.brokerMsgBody;
};

export const getAType = (artifact: Artifact): ArtifactType => {
    return artifact.hitSource.aType;
};

export const getTestMsgBody = (state: StateTestMsg): BrokerTestMsg => {
    return state.hitSource.rawData.message.brokerMsgBody;
};

export const getThreadID = (args: {
    testStateMsg?: StateTestMsg;
    brokerMsgBody?: BrokerTestMsg;
}) => {
    const { testStateMsg, brokerMsgBody } = args;
    if (brokerMsgBody) {
        if (MSG_V_0_1.isMsg(brokerMsgBody)) {
            if (brokerMsgBody.thread_id) return brokerMsgBody.thread_id;
        }
        if (MSG_V_1.isMsg(brokerMsgBody)) {
            if (brokerMsgBody.pipeline && brokerMsgBody.pipeline.id)
                return brokerMsgBody.pipeline.id;
        }
    }
    if (testStateMsg) {
        return testStateMsg.hitSource.threadId;
    }
    return null;
};

export function getDatagrepperUrl(
    messageId: string,
    artifactType: ArtifactType,
) {
    const url = new URL(
        `id?id=${messageId}&is_raw=true&size=extra-large`,
        mappingDatagrepperUrl[artifactType],
    );
    return url.toString();
}

// was: getKaiExtendedStatus
export function getTestMsgExtendedStatus(
    state: StateTestMsg,
): StateExtendedTestMsgName {
    const testMsg = getTestMsgBody(state);
    if (MSG_V_0_1.isMsg(testMsg) && 'status' in testMsg) {
        return testMsg.status;
    }
    if (
        MSG_V_1.isMsg(testMsg) &&
        'test' in testMsg &&
        'result' in testMsg.test
    ) {
        return testMsg.test.result;
    }
    return state.hitSource.testState;
}

// REMOVED

// /*
//  * https://pagure.io/fedora-ci/messages/blob/master/f/schemas/redhat-container-image.yaml
//  */
// export interface PayloadContainerImageType {
//     id: string;
//     nvr: string;
//     tag?: string;
//     name?: string;
//     source?: string;
//     issuer: string;
//     task_id: number;
//     build_id?: number;
//     scratch: boolean;
//     component: string;
//     namespace?: string;
//     full_names: string[];
//     registry_url?: string;
//     /*
//      * Entries come from: VirtualTopic.eng.brew.build.complete
//      * https://datagrepper.engineering.redhat.com/raw?topic=/topic/VirtualTopic.eng.brew.build.complete&delta=86400&contains=container_build
//      */
//     osbs_subtypes?: string[];
// }
//
// export interface PayloadComposeBuildType {
//     compose_id: string;
//     compose_type: ComposeType;
// }
//
// export interface PayloadRPMBuildType {
//     nvr: string;
//     source: string;
//     issuer: string;
//     task_id: number;
//     build_id: number;
//     scratch: boolean;
//     component: string;
//     gate_tag_name: string;
// }
//
// export interface PayloadMBSBuildType {
//     context: string;
//     id: number;
//     issuer: string;
//     name: string;
//     nsvc: string;
//     nvr: string;
//     stream: string;
//     version: string;
//     source: string;
//     scratch: boolean;
//     component: string;
//     gate_tag_name: string;
// }
//

/*
export type StateKaiType = {
    broker_msg_body: BrokerMessagesType;
    custom_metadata?: Metadata;
    kai_state: KaiStateType;
};

    broker_msg_body: BrokerMessagesType;
    custom_metadata?: Metadata;
    kai_state: KaiStateType;

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
*/
