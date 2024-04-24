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
import { mappingDatagrepperUrl, config } from './config';

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

    export function isMsg(
        msgBody: BrokerSchemaMsgBody,
    ): msgBody is MessagesType {
        return (
            msgBody.version.startsWith('0.2.') ||
            msgBody.version.startsWith('1.')
        );
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
        label?: string;
        variant?: string;
        provider: string;
        architecture: string;
    };

    export function isMsg(
        msgBody: BrokerSchemaMsgBody,
    ): msgBody is MessagesType {
        return msgBody.version.startsWith('0.1.');
    }

    export function resultHasDocs(
        msg: BrokerSchemaMsgBody,
    ): msg is MsgRPMBuildTestComplete | MsgRPMBuildTestError {
        return _.has(msg, 'docs');
    }
}

export type BrokerMsgId = string;
export type BrokerMsgBody = BrokerSchemaMsgBody | BrokerEtaMsgBody;
export type BrokerSchemaMsgBody = MSG_V_0_1.MessagesType | MSG_V_1.MessagesType;

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
// WAS: EtaBrokerMessages
export type BrokerEtaMsgBody = {
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
    metadataConsolidated: Metadata;
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
    testcaseName: string;
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
    hit_info: HitInfo;
    children: AChildrenMsg;
    hit_source: HitSourceArtifact;
    component_mapping?: ComponentMapping;
    greenwaveDecision?: GreenwaveDecisionReply;
    resultsdb_testscase: number[];
}

export type HitSourceArtifact =
    | HitSourceArtifactRpm
    | HitSourceArtifactMbs
    | HitSourceArtifactCompose
    | HitSourceArtifactCoprBuild
    | HitSourceArtifactContainerImage;

export type Artifact =
    | ArtifactRpm
    | ArtifactMbs
    | ArtifactCompose
    | ArtifactContainerImage;

export type ArtifactRpm = ArtifactBase & {
    hit_source: HitSourceArtifactRpm;
};

export type ArtifactCoprBuild = ArtifactBase & {
    hit_source: HitSourceArtifactCoprBuild;
};

export type ArtifactMbs = ArtifactBase & {
    hit_source: HitSourceArtifactMbs;
};

export type ArtifactCompose = ArtifactBase & {
    hit_source: HitSourceArtifactCompose;
};

export type ArtifactContainerImage = ArtifactBase & {
    hit_source: HitSourceArtifactContainerImage;
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

export type HitSourceArtifactCoprBuild = {
    nvr: string;
    component: string;
    coprBuildId: string;
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

// Ref on kaijs: searchableContainerImageTestParentHandlers
// https://pagure.io/fedora-ci/messages/blob/master/f/schemas/redhat-container-image.yaml

export type HitSourceArtifactContainerImage = {
    contId: string;
    nvr: string;
    contTag: string;
    aType: ATypesContainerImage;
    contName: string;
    source: string;
    issuer: string;
    taskId: string;
    buildId: string;
    scratch: boolean;
    component: string;
    contNamespace: string;
    contFullNames: string[];
    contRegistryUrl: string;
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
 * Opposite to test-messages child, greenwave/resultsdb state
 */
export type GreenwaveRequirement = {
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
    | 'QUEUED'
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
export type GreenwaveResult = {
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

export type GreenwaveDecisionReply = {
    policies_satisfied: boolean;
    summary: string;
    applicable_policies: string[];
    waivers: GreenwaveWaiveType[];
    results: GreenwaveResult[];
    satisfied_requirements: GreenwaveRequirement[];
    unsatisfied_requirements: GreenwaveRequirement[];
};

export type MsgStageName =
    | 'test'
    | 'build'
    | 'dispatch'
    | 'dispatcher'
    | 'greenwave';

export type MsgStateName = 'error' | 'queued' | 'running' | 'complete';

export const KnownMsgStates: MsgStateName[] = [
    'error',
    'queued',
    'running',
    'complete',
];

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
export type TestMsgStateName =
    | 'info'
    | 'passed'
    | 'failed'
    | 'not_applicable'
    | 'needs_inspection'
    | MsgStateName;

export type StateName =
    /* greenwave result */
    'additional-tests' | TestMsgStateName | GreenwaveRequirementTypes;

export interface AChildGreenwaveAndTestMsg {
    /* greenwave child */
    gs: AChildGreenwave;
    /* message child */
    ms: AChildTestMsg;
}

export interface AChildrenMsg {
    hits: AChildMsg[];
    hitsInfo: HitsInfo;
}

export type AChildSchemaMsg = AChildBuildMsg | AChildTestMsg;
export type AChildMsg = AChildSchemaMsg | AChildEtaMsg;

export type AChildTest =
    | AChildTestMsg
    | AChildGreenwave
    | AChildGreenwaveAndTestMsg;

export type AChild = AChildMsg | AChildGreenwave | AChildGreenwaveAndTestMsg;

export type AChildrenByStateName = {
    [key in StateName]?: AChild[];
};

export interface AChildGreenwave {
    waiver?: GreenwaveWaiveType;
    result?: GreenwaveResult;
    testcase: string;
    requirement?: GreenwaveRequirement;
}

export interface HitsInfo {
    total: { value: number };
}

export interface AChildTestMsg {
    hit_info: HitInfo;
    hit_source: HitSourceTest;
    metadata?: Metadata;
}

export interface AChildBuildMsg {
    hit_info: HitInfo;
    hit_source: HitSourceBuild;
}

export interface AChildEtaMsg {
    hit_info: HitInfo;
    hit_source: HitSourceEta;
}

export interface HitSourceEta {
    nvr: string;
    aType: string;
    taskId: string;
    issuer: string;
    component: string;
    brokerMsgId: BrokerMsgId;
    brokerTopic: string;
    etaCiRunUrl: string;
    etaCiRunOutcome: string;
    etaCiRunExplanation: string;
    '@timestamp': number;
    rawData: {
        message: {
            brokerExtra: any;
            brokerMsgId: BrokerMsgId;
            brokerMsgBody: BrokerEtaMsgBody;
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
    msgState: TestMsgStateName;
    msgStage: Extract<MsgStageName, 'test'>;
    brokerTopic: string;
    brokerMsgId: BrokerMsgId;
    testCaseName: string;
    msgFullText: string;
    rawData: {
        message: {
            brokerExtra: any;
            brokerMsgId: string;
            brokerMsgBody: BrokerSchemaMsgBody;
            brokerMsgTopic: string;
        };
    };
    '@timestamp': number;
    artToMsgs: {
        name: 'message';
        parent: string;
    };
}

export interface HitSourceBuild {
    nvr: string;
    aType: string;
    taskId: string;
    issuer: string;
    scratch: boolean;
    component: string;
    msgState: TestMsgStateName;
    msgStage: Extract<MsgStageName, 'build'>;
    brokerTopic: string;
    brokerMsgId: string;
    msgFullText: string;
    rawData: {
        message: {
            brokerExtra: any;
            brokerMsgId: string;
            brokerMsgBody: BrokerSchemaMsgBody;
            brokerMsgTopic: string;
        };
    };
    '@timestamp': number;
    artToMsgs: {
        name: 'message';
        parent: string;
    };
}

export type ComponentMapping = {
    _updated: string;
    product_id: number;
    qa_contact: string;
    description: string;
    def_assignee: string;
    sst_team_name: string;
    component_name: string;
    qa_contact_name: string;
    def_assignee_name: string;
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
    const { hit_source } = artifact;
    return (
        hit_source.aType === 'brew-build' ||
        hit_source.aType === 'koji-build' ||
        hit_source.aType === 'koji-build-cs'
    );
}

export function isArtifactMbs(artifact: Artifact): artifact is ArtifactMbs {
    const { hit_source } = artifact;
    return hit_source.aType === 'redhat-module';
}

export function isArtifactCompose(
    artifact: Artifact,
): artifact is ArtifactCompose {
    const { hit_source } = artifact;
    return hit_source.aType === 'productmd-compose';
}

export function isArtifactRedhatContainerImage(
    artifact: Artifact,
): artifact is ArtifactContainerImage {
    const { hit_source } = artifact;
    return hit_source.aType === 'redhat-container-image';
}

export function isArtifactScratch(artifact: Artifact): boolean {
    if (
        isArtifactRpm(artifact) ||
        isArtifactMbs(artifact) ||
        isArtifactRedhatContainerImage(artifact)
    ) {
        return artifact.hit_source.scratch;
    }
    return false;
}

export function isAChildMsg(aChild: AChild | undefined): aChild is AChildMsg {
    return _.has(aChild, 'hit_info');
}

export function isChildEtaMsg(
    aChild: AChild | undefined,
): aChild is AChildEtaMsg {
    return _.has(aChild, 'hit_source.etaCiRunUrl');
}

export function isAChildTestMsg(
    aChild: AChild | undefined,
): aChild is AChildTestMsg {
    const msgStageName = _.get(aChild, 'hit_source.msgStage');
    if (msgStageName === 'test') {
        return true;
    }
    return false;
}

export function isAChildBuildMsg(
    aChild: AChild | undefined,
): aChild is AChildBuildMsg {
    const msgStageName = _.get(aChild, 'hit_source.msgStage');
    if (msgStageName === 'build') {
        return true;
    }
    return false;
}

export function isAChildSchemaMsg(
    aChild: AChild | undefined,
): aChild is AChildSchemaMsg {
    if (isAChildBuildMsg(aChild) || isAChildTestMsg(aChild)) {
        return true;
    }
    return false;
}

export function isAChildGreenwave(
    aChild: AChild | undefined,
): aChild is AChildGreenwave {
    return _.has(aChild, 'testcase');
}

export function isAChildGreenwaveAndTestMsg(
    aChild: AChild | undefined,
): aChild is AChildGreenwaveAndTestMsg {
    return _.has(aChild, 'gs') && _.has(aChild, 'ms');
}

/**
 * Getters
 */

export const getMsgBody = (aChild: AChildMsg): BrokerMsgBody => {
    return _.get(aChild, 'hit_source.rawData.message.brokerMsgBody')!;
};

export const getMsgTimestamp = (aChild: AChildMsg): number => {
    return _.get(aChild, 'hit_source.@timestamp')!;
};

export const getMsgVersion = (aChild: AChildTestMsg): string => {
    return _.get(
        aChild,
        'hit_source.rawData.message.brokerMsgBody.version',
        '',
    );
};

export const getEtaMsgBody = (aChild: AChildEtaMsg): BrokerEtaMsgBody => {
    return _.get(aChild, 'hit_source.rawData.message.brokerMsgBody')!;
};

export const getTestMsgBody = (aChild: AChildTestMsg): BrokerSchemaMsgBody => {
    return _.get(aChild, 'hit_source.rawData.message.brokerMsgBody')!;
};

export const getMsgId = (aChild: AChildMsg): BrokerMsgId => {
    return _.get(aChild, 'hit_source.rawData.message.brokerMsgId', '');
};

export const getGwDecision = (
    artifact: Artifact,
): GreenwaveDecisionReply | undefined => {
    return artifact.greenwaveDecision;
};

export const getAType = (artifact: Artifact): ArtifactType => {
    return artifact.hit_source.aType;
};

export const getANvr = (artifact: Artifact): string | undefined => {
    if (isArtifactRpm(artifact)) {
        return _.get(artifact, 'hit_source.nvr');
    }
};

export const getATaskid = (artifact: Artifact): string | undefined => {
    if (isArtifactRpm(artifact)) {
        return _.get(artifact, 'hit_source.taskId');
    }
};

export const getABuildId = (artifact: Artifact): string | undefined => {
    if (isArtifactMbs(artifact) || isArtifactRpm(artifact))
        return artifact.hit_source.buildId;
};

export const getAEtaChildren = (artifact: Artifact): AChildEtaMsg[] => {
    const etaChildren = _.filter(artifact.children.hits, (aChild) =>
        isChildEtaMsg(aChild),
    ) as AChildEtaMsg[];
    return etaChildren;
};

export const getThreadID = (args: {
    childTestMsg?: AChildTestMsg;
    brokerMsgBody?: BrokerSchemaMsgBody;
}) => {
    const { childTestMsg, brokerMsgBody } = args;
    if (brokerMsgBody) {
        if (MSG_V_0_1.isMsg(brokerMsgBody)) {
            if (brokerMsgBody.thread_id) return brokerMsgBody.thread_id;
        }
        if (MSG_V_1.isMsg(brokerMsgBody)) {
            if (brokerMsgBody.pipeline && brokerMsgBody.pipeline.id)
                return brokerMsgBody.pipeline.id;
        }
    }
    if (childTestMsg) {
        return childTestMsg.hit_source.threadId;
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

export function getMsgExtendedStatus(aChild: AChildTestMsg): TestMsgStateName {
    const testMsg = getTestMsgBody(aChild);
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
    return aChild.hit_source.msgState;
}

export const getMsgStageName = (aChild: AChildSchemaMsg): MsgStageName => {
    return aChild.hit_source.msgStage;
};

export const getMsgStateName = (aChild: AChildSchemaMsg): TestMsgStateName => {
    return aChild.hit_source.msgState;
};

export const getArtifactProduct = (artifact: Artifact): string | undefined => {
    /*
     * Gating based on Brew tags is available only in RHEL.
     * Cenots/Fedora doesn't have gating workflow.
     */
    if (isArtifactMbs(artifact) || isArtifactRpm(artifact)) {
        const { gateTag } = artifact.hit_source;
        if (_.isEmpty(gateTag)) {
            return;
        }
        const product = gateTag.match(/^.*(rhel-\d\d?)\.$/);
        if (_.isNil(product)) {
            return;
        }
        return product[1];
    }
};

/**
 * Get the gating tag of the given artifact, if available. In general, gating tags
 * are defined for MBS and RPM builds only.
 * @param artifact Artifact of any type.
 * @returns Gating tag if available or null if not applicable for given artifact type.
 */
export const getArtifactGatingTag = (artifact: Artifact): string | null => {
    if (isArtifactMbs(artifact) || isArtifactRpm(artifact)) {
        return artifact.hit_source.gateTag;
    }
    return null;
};

/**
 * Get the name of the issuer or owner of the given artifact, if available.
 * In general, issuer names are defined for MBS and RPM builds only.
 * @param artifact Artifact of any type.
 * @returns Issuer name if available or null if not applicable for given artifact type.
 */
export const getArtifacIssuer = (artifact: Artifact): string | null => {
    if (isArtifactMbs(artifact) || isArtifactRpm(artifact)) {
        return artifact.hit_source.issuer;
    }
    return null;
};

export const getTestcaseName = (aChild: AChild): string => {
    let testCaseName = 'unknonwn testcase name';
    if (isAChildTestMsg(aChild)) {
        const { hit_source } = aChild;
        const { testCaseName: tcn } = hit_source;
        const brokerMsgBody = getTestMsgBody(aChild);
        if (tcn) {
            testCaseName = tcn;
        }
        if (brokerMsgBody && _.isEmpty(testCaseName)) {
            if (MSG_V_0_1.isMsg(brokerMsgBody)) {
                const { category, namespace, type } = brokerMsgBody;
                if (category && namespace && type)
                    testCaseName = `${namespace}.${type}.${category}`;
            }
            if (MSG_V_1.isMsg(brokerMsgBody)) {
                const { category, namespace, type } = brokerMsgBody.test;
                if (category && namespace && type)
                    testCaseName = `${namespace}.${type}.${category}`;
            }
        }
    }
    if (isAChildGreenwave(aChild) && aChild.testcase) {
        testCaseName = aChild.testcase;
    }
    if (isAChildGreenwaveAndTestMsg(aChild) && aChild.gs.testcase) {
        testCaseName = aChild.gs.testcase;
    }
    if (_.isUndefined(testCaseName)) {
        console.error('Could not identify testcase name in child', aChild);
    }
    return testCaseName;
};

export const getXunit = (brokerMsgBody: BrokerSchemaMsgBody) => {
    if (MSG_V_0_1.isMsg(brokerMsgBody)) {
        if ('xunit' in brokerMsgBody && brokerMsgBody.xunit)
            return brokerMsgBody.xunit;
    }
    if (MSG_V_1.isMsg(brokerMsgBody)) {
        if (brokerMsgBody.test && brokerMsgBody.test.xunit)
            return brokerMsgBody.test.xunit;
    }
    return null;
};

/**
 * Return a human-readable label for a given artifact type,
 * for example 'Brew' for 'brew-build'.
 */
export const getArtifactTypeLabel = (type: ArtifactType) => {
    const artifactTypeLabels: Record<ArtifactType, string> = {
        'brew-build': 'Brew',
        'copr-build': 'Copr',
        'koji-build': 'Koji',
        'koji-build-cs': 'CS Koji',
        'redhat-module': 'RH Module',
        'productmd-compose': 'RH Compose',
        'redhat-container-image': 'RH Container',
    };
    if (_.has(artifactTypeLabels, type)) {
        return artifactTypeLabels[type];
    }

    console.error(`Unknown artifact type '${type}'`);
    return 'Unknown';
};

export function getArtifactName(artifact: Artifact): string | undefined {
    if (isArtifactRpm(artifact)) {
        return artifact.hit_source.nvr;
    } else if (isArtifactRedhatContainerImage(artifact)) {
        return artifact.hit_source.nvr;
    } else if (isArtifactMbs(artifact)) {
        return artifact.hit_source.nsvc;
    } else if (isArtifactCompose(artifact)) {
        return artifact.hit_source.composeId;
    }
    return;
}

export function getArtifactId(artifact: Artifact): string | undefined {
    if (isArtifactRpm(artifact)) {
        return artifact.hit_source.taskId;
    } else if (isArtifactRedhatContainerImage(artifact)) {
        return artifact.hit_source.taskId;
    } else if (isArtifactMbs(artifact)) {
        return artifact.hit_source.mbsId;
    } else if (isArtifactCompose(artifact)) {
        return artifact.hit_source.composeId;
    }
    return;
}

export const getArtifactChildren = (artifact: Artifact): AChildMsg[] => {
    return _.get(artifact, 'children.hits', []);
};

/**
 * Construct the URL for the original resource associated with the artifact,
 * for example the corresponding Koji task.
 * @returns URL to the remote resource associated with the artifact or empty string
 * if no URL could be reliably constructed.
 */
export const getArtifactRemoteUrl = (artifact: Artifact): string => {
    const { hit_source } = artifact;
    const urlMap: Record<ArtifactType, string> = {
        'brew-build': `${config.koji.rh.webUrl}/taskinfo?taskID=${
            (hit_source as HitSourceArtifactRpm).taskId
        }`,
        'koji-build': `${config.koji.fp.webUrl}/taskinfo?taskID=${
            (hit_source as HitSourceArtifactRpm).taskId
        }`,
        'koji-build-cs': `${config.koji.cs.webUrl}/taskinfo?taskID=${
            (hit_source as HitSourceArtifactRpm).taskId
        }`,
        'redhat-container-image': `${config.koji.rh.webUrl}/taskinfo?taskID=${
            (hit_source as HitSourceArtifactContainerImage).taskId
        }`,
        'copr-build': (() => {
            const { component, coprBuildId } =
                hit_source as HitSourceArtifactCoprBuild;
            if (_.isNil(component)) {
                return '';
            }
            const coprRepo = component.match('.*/')?.[0]?.replace('@', 'g/');
            if (_.isNil(coprRepo)) {
                return '';
            }
            const bid = coprBuildId.match('[^:]*')?.[0];
            return `https://copr.fedorainfracloud.org/coprs/${coprRepo}build/${bid}`;
        })(),
        'redhat-module': `${config.mbs.rh.webUrl}/mbs-ui/module/${
            (hit_source as HitSourceArtifactMbs).mbsId
        }`,
        'productmd-compose': '',
    };
    return urlMap[hit_source.aType];
};

/**
 * Construct the relative path which uniquely identifies artifact in CI Dashboard UI.
 * @returns Subpath relative to the CI Dashboard root.
 */

export const getArtifactLocalPath = (artifact: Artifact) =>
    `/details/${artifact.hit_info._id}`;

/**
 * Extract testcase documentation URL from a UMB message.
 * @param brokerMessage UMB message from CI system.
 * @returns URL to documentation as provided by the CI system or `undefined`.
 */
export function getUmbDocsUrl(
    msgBody: BrokerSchemaMsgBody,
): string | undefined {
    if (MSG_V_0_1.isMsg(msgBody)) {
        if (MSG_V_0_1.resultHasDocs(msgBody)) {
            return msgBody.docs;
        }
        return msgBody.ci.docs;
    }
    if (MSG_V_1.isMsg(msgBody)) {
        return msgBody.test.docs;
    }
    return;
}

/**
 * Extract testcase documentation URL from Greenwave server response.
 * @param child Gating state response from Greenwave.
 * @returns URL to documentation as provided by the CI system or `undefined`.
 */
export const getGreenwaveDocsUrl = (aChild: AChildGreenwave) =>
    aChild.result?.testcase.ref_url;

/**
 * Extract the URL for the documentation of a CI test.
 * @param child Gating state response object from backend.
 * @returns URL of test documentation or `undefined` if none is available.
 */
export function getDocsUrl(aChild: AChild): string | undefined {
    // Prefer URL from UMB message, if present.
    if (isAChildTestMsg(aChild)) {
        const testMsg = getTestMsgBody(aChild);
        return getUmbDocsUrl(testMsg);
    }
    if (isAChildGreenwave(aChild)) {
        return getGreenwaveDocsUrl(aChild);
    }
    if (isAChildGreenwaveAndTestMsg(aChild)) {
        const testMsg = getTestMsgBody(aChild.ms);
        let docsUrl = getUmbDocsUrl(testMsg);
        if (!docsUrl) docsUrl = getGreenwaveDocsUrl(aChild.gs);
        return docsUrl;
    }
}

/**
 * Extract the URL to re-run a test. This is typically a link to a Jenkins instance.
 * @param child Gating state response object from backend.
 * @returns URL to re-run the test or `undefined` if no URL is available.
 */
export function getRerunUrl(aChild: AChild): string | undefined {
    // Prefer URL from UMB message, if present.
    if (isAChildTestMsg(aChild)) {
        const testMsg = getTestMsgBody(aChild);
        return testMsg.run.rebuild;
    }
    if (isAChildGreenwave(aChild)) {
        return aChild.result?.data.rebuild?.[0];
    }
    if (isAChildGreenwaveAndTestMsg(aChild)) {
        const testMsg = getTestMsgBody(aChild.ms);
        let rerunUrl = testMsg.run.rebuild;
        // Try to fall back to URL stored in ResultsDB.
        if (!rerunUrl) rerunUrl = aChild.gs.result?.data.rebuild?.[0];
        return rerunUrl;
    }
}
