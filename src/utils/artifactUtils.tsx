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
import { CSSProperties } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    GhostIcon,
    HistoryIcon,
    InfoIcon,
    InProgressIcon,
    OutlinedQuestionCircleIcon,
    TimesCircleIcon,
    TrafficLightIcon,
    UnlinkIcon,
} from '@patternfly/react-icons';
import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import moment from 'moment';
import Linkify from 'linkify-react';
import { IntermediateRepresentation } from 'linkifyjs';

import {
    Artifact,
    ArtifactType,
    DistGitInstanceType,
    GreenwaveRequirementTypesType,
    isArtifactMBS,
    isArtifactRedhatContainerImage,
    isArtifactRPM,
    KaiStateType,
    KojiInstanceType,
    MbsInstanceType,
    StateExtendedKaiNameType,
    StateGreenwaveKaiType,
    StateGreenwaveType,
    StateKaiType,
    StateType,
} from '../artifact';
import { config, mappingDatagrepperUrl } from '../config';
import { MSG_V_1, MSG_V_0_1, BrokerMessagesType } from '../types';
/**
 *Typescript guards
 */
export function isKaiState(
    state: StateType | undefined,
): state is StateKaiType {
    return _.has(state, 'kai_state');
}

export function isGreenwaveState(
    state: StateType | undefined,
): state is StateGreenwaveType {
    return _.has(state, 'testcase');
}

export function isGreenwaveKaiState(
    state: StateType | undefined,
): state is StateGreenwaveKaiType {
    return _.has(state, 'gs') && _.has(state, 'ks');
}

/** Maps artifact type to DB field to use in next query */
export const db_field_from_atype: Record<ArtifactType, string> = {
    'brew-build': 'NVR',
    'copr-build': 'Component',
    'koji-build-cs': 'NVR',
    'koji-build': 'NVR',
    'redhat-container-image': 'NVR',
    'productmd-compose': 'Compose ID',
    'redhat-module': 'NSVC',
};

const known_types: Record<ArtifactType, string> = {
    'brew-build': 'NVR',
    'copr-build': 'Component',
    'koji-build-cs': 'NVR',
    'koji-build': 'NVR',
    'redhat-container-image': 'NVR',
    'productmd-compose': 'Compose ID',
    'redhat-module': 'NSVC',
};

const known_aid_meaning: Record<ArtifactType, string> = {
    'brew-build': 'Task ID',
    'copr-build': 'ID',
    'koji-build-cs': 'Task ID',
    'koji-build': 'Task ID',
    'productmd-compose': 'Compose',
    'redhat-container-image': 'Task ID',
    'redhat-module': 'MBS ID',
};

const artifact_type_labels: Record<ArtifactType, string> = {
    'brew-build': 'Brew',
    'copr-build': 'Copr',
    'koji-build': 'Koji',
    'koji-build-cs': 'CS Koji',
    'productmd-compose': 'Compose',
    'redhat-container-image': 'Container',
    'redhat-module': 'MBS',
};

export function getArtifactName(artifact: Artifact): string | undefined {
    switch (artifact.type) {
        case 'brew-build':
        case 'copr-build':
        case 'koji-build':
        case 'redhat-container-image':
            return artifact.payload.nvr;
        case 'redhat-module':
            return artifact.payload.nsvc;
        case 'productmd-compose':
            return artifact.aid;
        default:
            return;
    }
}

export const nameFieldForType = (type: ArtifactType) => {
    const includes = _.includes(_.keys(known_types), type);
    if (!includes) {
        return 'unknown type';
    }
    return known_types[type];
};

export const aidMeaningForType = (type: ArtifactType) => {
    const includes = _.includes(_.keys(known_aid_meaning), type);
    if (!includes) {
        return 'id';
    }
    return known_aid_meaning[type];
};

/**
 * Return a human-readable label for a given artifact type,
 * for example 'Brew' for 'brew-build'.
 */
export const getArtifactTypeLabel = (type: ArtifactType) => {
    if (_.has(artifact_type_labels, type)) {
        return artifact_type_labels[type];
    }

    console.error(`Unknown artifact type '${type}'`);
    return 'Unknown';
};

export const convertNsvcToNvr = (nsvc: string) => {
    const splited = nsvc.split(':');
    if (_.size(splited) !== 4) {
        console.error(`Encountered invalid NSVC ${nsvc}`);
        return null;
    }
    /**
     * Convert NSVC to Koji NVR
     */
    return `${splited[0]}-${splited[1].replace(/-/g, '_')}-${splited[2]}.${
        splited[3]
    }`;
};

export const getReleaseFromNvr = (nvr: string) => {
    /**
     * Input: foo-1.0-1.el9 or virt-8.3-8030020200812155519.30b713e6
     * Release: 1.el9 or 8030020200812155519.30b713e6
     * Do steps:
     * 1. cut from left to the latest `-`
     */
    const cut_from_left = _.lastIndexOf(nvr, '-') + 1;
    return nvr.substring(cut_from_left);
};

export const getOSVersionFromNvr = (nvr: string, artifactType: string) => {
    /**
     * This is not realiable.
     * From discussion with dcantrell@: no strict mapping between koji-tag/taget <-> dist-tag
     * Return first number from release
     * Knowns releases:
     * Look for 'el', 'fc' prefix:
     * rust-yaml-rust-0.4.4-2.el9 -> Release: 2.el9 -> RHEL: 9
     * Modules: first number from release:
     * libreoffice-flatpak-8030020201013063128.306be773 -> Release: 8030020201013063128.306be773 -> RHEL: 8
     * flatpak-runtime-f33-3320201014073228.eb6bdfed -> Release: 3320201014073228.eb6bdfed -> 33
     * kmod-redhat-mlx5_core-5.0_0_dup8.2-1.el8_2 -> Release: 1.el8_2
     * Release can have many dots.
     */
    const release = getReleaseFromNvr(nvr);
    let osVersion;
    if (artifactType === 'redhat-module') {
        if (/-f\d\d-/.test(nvr)) {
            /** Fedora module - take 2 digits. */
            osVersion = release.substring(0, 2);
        } else {
            /** RHEL based. Take 1 digit. */
            osVersion = release.substring(0, 1);
        }
    } else {
        /**
         * Release : 1.fc32_2
         * We discussed with dcantrell@ : and for now solution is to search for pattern: \.(el|fc)[0-9]+
         */
        const distTag = release.match(/\.(el|fc)[0-9]+/g)?.toString();
        osVersion = distTag?.replace(/\.(el|fc)/, '');
    }
    console.log('nvr: %s, has os version: %s', nvr, osVersion);
    return osVersion;
};

/**
 * Construct the URL for the original resource associated with the artifact,
 * for example the corresponding Koji task.
 * @returns URL to the remote resource associated with the artifact or empty string
 * if no URL could be reliably constructed.
 */
export const getArtifactRemoteUrl = (artifact: Artifact) => {
    const urlMap = {
        'brew-build': `${config.koji.rh.webUrl}/taskinfo?taskID=${artifact.aid}`,
        'koji-build': `${config.koji.fp.webUrl}/taskinfo?taskID=${artifact.aid}`,
        'koji-build-cs': `${config.koji.cs.webUrl}/taskinfo?taskID=${artifact.aid}`,
        'redhat-container-image': `${config.koji.rh.webUrl}/taskinfo?taskID=${artifact.aid}`,
        'copr-build': (() => {
            // XXX: fixme
            // const component = artifact.payload.component;
            // const coprRepo = component.match('.*/')[0].replace('@', 'g/');
            // const bid = artifact.aid.match('[^:]*')[0];
            // return `https://copr.fedorainfracloud.org/coprs/${coprRepo}build/${bid}`;
            return 'fixme';
        })(),
        'redhat-module': `${config.mbs.rh.webUrl}/mbs-ui/module/${artifact.aid}`,
        'productmd-compose': '',
    };
    return urlMap[artifact.type];
};

/**
 * Construct the relative path which uniquely identifies artifact in CI Dashboard UI.
 * @returns Subpath relative to the CI Dashboard root.
 */
export const getArtifactLocalPath = (artifact: Artifact) =>
    `/artifact/${artifact.type}/aid/${artifact.aid}`;

/**
 * Extract testcase documentation URL from a UMB message.
 * @param brokerMessage UMB message from CI system.
 * @returns URL to documentation as provided by the CI system or `undefined`.
 */
export function getUmbDocsUrl(
    brokerMessage: BrokerMessagesType,
): string | undefined {
    if (MSG_V_0_1.isMsg(brokerMessage)) {
        if (MSG_V_0_1.resultHasDocs(brokerMessage)) {
            return brokerMessage.docs;
        }
        return brokerMessage.ci.docs;
    }
    if (MSG_V_1.isMsg(brokerMessage)) {
        return brokerMessage.test.docs;
    }
    return;
}

/**
 * Extract testcase documentation URL from Greenwave server response.
 * @param state Gating state response from Greenwave.
 * @returns URL to documentation as provided by the CI system or `undefined`.
 */
export const getGreenwaveDocsUrl = (state: StateGreenwaveType) =>
    state.result?.testcase.ref_url;

/**
 * Extract the URL for the documentation of a CI test.
 * @param state Gating state response object from backend.
 * @returns URL of test documentation or `undefined` if none is available.
 */
export function getDocsUrl(state: StateType): string | undefined {
    // Prefer URL from UMB message, if present.
    if (isKaiState(state)) return getUmbDocsUrl(state.broker_msg_body);
    if (isGreenwaveState(state)) return getGreenwaveDocsUrl(state);
    if (isGreenwaveKaiState(state)) {
        let docsUrl = getUmbDocsUrl(state.ks.broker_msg_body);
        if (!docsUrl) docsUrl = getGreenwaveDocsUrl(state.gs);
        return docsUrl;
    }
}

/**
 * Extract the URL to re-run a test. This is typically a link to a Jenkins instance.
 * @param state Gating state response object from backend.
 * @returns URL to re-run the test or `undefined` if no URL is available.
 */
export function getRerunUrl(state: StateType): string | undefined {
    // Prefer URL from UMB message, if present.
    if (isKaiState(state)) return state.broker_msg_body.run.rebuild;
    if (isGreenwaveState(state)) return state.result?.data.rebuild?.[0];
    if (isGreenwaveKaiState(state)) {
        let rerunUrl = state.ks.broker_msg_body.run.rebuild;
        // Try to fall back to URL stored in ResultsDB.
        if (!rerunUrl) rerunUrl = state.gs.result?.data.rebuild?.[0];
        return rerunUrl;
    }
}

export const resultColors = {
    '--pf-global--success-color--100': [
        'complete',
        'passed',
        'pass',
        'Pass',
        'PASS',
        true,
        'ok',
        'OK',
        'Ok',
        'satisfied',
    ],
    '--pf-global--danger-color--100': [
        'failed',
        'fail',
        'Fail',
        'FAIL',
        'missing',
        false,
        'Err',
        'err',
        'error',
        'Error',
        'unsatisfied',
    ],
    '--pf-global--warning-color--100': ['error', 'waived'],
    '--pf-global--link--Color': ['running'],
    '--pf-global--warning-color--200': ['queued', 'skip'],
    '--pf-global--info-color--100': ['info'],
};

export const resultColor = (result: string) => {
    return _.findKey(resultColors, (item) => item.indexOf(result) !== -1);
};

export const getThreadID = (args: {
    kai_state?: KaiStateType;
    broker_msg_body?: BrokerMessagesType;
}) => {
    const { kai_state, broker_msg_body } = args;
    if (broker_msg_body) {
        if (MSG_V_0_1.isMsg(broker_msg_body)) {
            if (broker_msg_body.thread_id) return broker_msg_body.thread_id;
        }
        if (MSG_V_1.isMsg(broker_msg_body)) {
            if (broker_msg_body.pipeline && broker_msg_body.pipeline.id)
                return broker_msg_body.pipeline.id;
        }
    }
    if (kai_state) {
        return kai_state.thread_id;
    }
    return null;
};

export const getArtifactProduct = (artifact: Artifact): string | undefined => {
    /*
     * Gating based on Brew tags is available only in RHEL.
     * Cenots/Fedora doesn't have gating workflow.
     */
    if (isArtifactMBS(artifact) || isArtifactRPM(artifact)) {
        const { gate_tag_name } = artifact.payload;
        if (_.isEmpty(gate_tag_name)) {
            return;
        }
        const product = gate_tag_name.match(/^.*(rhel-\d\d?)\.$/);
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
    if (isArtifactMBS(artifact) || isArtifactRPM(artifact)) {
        return artifact.payload.gate_tag_name;
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
    if (isArtifactMBS(artifact) || isArtifactRPM(artifact)) {
        return artifact.payload.issuer;
    }
    return null;
};

export const getTestcaseName = (state: StateType): string | undefined => {
    let testCaseName: string | undefined;
    if (isKaiState(state)) {
        const { broker_msg_body, kai_state } = state;
        if (kai_state?.test_case_name) {
            testCaseName = kai_state.test_case_name;
        }
        if (broker_msg_body && _.isEmpty(testCaseName)) {
            if (MSG_V_0_1.isMsg(broker_msg_body)) {
                const { category, namespace, type } = broker_msg_body;
                if (category && namespace && type)
                    testCaseName = `${namespace}.${type}.${category}`;
            }
            if (MSG_V_1.isMsg(broker_msg_body)) {
                const { category, namespace, type } = broker_msg_body.test;
                if (category && namespace && type)
                    testCaseName = `${namespace}.${type}.${category}`;
            }
        }
    }
    if (isGreenwaveState(state) && state.testcase) {
        testCaseName = state.testcase;
    }
    if (isGreenwaveKaiState(state) && state.gs.testcase) {
        testCaseName = state.gs.testcase;
    }
    if (_.isUndefined(testCaseName)) {
        console.error('Could not identify testcase name in state', state);
    }
    return testCaseName;
};

export const getXunit = (broker_msg_body: BrokerMessagesType) => {
    if (MSG_V_0_1.isMsg(broker_msg_body)) {
        if ('xunit' in broker_msg_body && broker_msg_body.xunit)
            return broker_msg_body.xunit;
    }
    if (MSG_V_1.isMsg(broker_msg_body)) {
        if (broker_msg_body.test && broker_msg_body.test.xunit)
            return broker_msg_body.test.xunit;
    }
    return null;
};

export const getMessageError = (broker_msg_body: BrokerMessagesType) => {
    if (MSG_V_0_1.isMsg(broker_msg_body) && 'reason' in broker_msg_body) {
        return {
            issue_url: broker_msg_body.issue_url,
            reason: broker_msg_body.reason,
        };
    }
    if (MSG_V_1.isMsg(broker_msg_body) && 'error' in broker_msg_body) {
        return broker_msg_body.error;
    }
};

export interface IconProps {
    className: string;
    icon: React.ComponentClass<SVGIconProps, any>;
    label: string;
}

export function mapTypeToIconsProps(type: string): IconProps | null {
    const icons = {
        missing: {
            pick: type === 'missing' || type === 'test-result-missing',
            className: 'pf-u-disabled-color-100',
            icon: GhostIcon,
            label: 'Result is missing.',
        },
        ok: {
            pick:
                type === 'complete' ||
                type === 'passed' ||
                type === 'pass' ||
                type === 'test-result-passed' ||
                type === 'fetched-gating-yaml' ||
                type === 'true',
            className: 'pf-u-success-color-100',
            icon: CheckCircleIcon,
            label: 'Result is OK.',
        },
        error: {
            pick:
                type === 'failed' ||
                type === 'fail' ||
                type === 'failed-fetch-gating-yaml' ||
                type === 'test-result-failed' ||
                type === 'invalid-gating-yaml' ||
                type === 'missing-gating-yaml' ||
                type === 'false',
            className: 'pf-u-danger-color-100',
            icon: TimesCircleIcon,
            label: 'Test has failed.',
        },
        warning: {
            pick:
                type === 'error' ||
                type === 'needs_inspection' ||
                type === 'invalid-gating-yaml-waived' ||
                type === 'missing-gating-yaml-waived' ||
                type === 'test-result-errored' ||
                type === 'test-result-failed-waived' ||
                type === 'test-result-missing-waived' ||
                type === 'test-result-errored-waived' ||
                type === 'failed-fetch-gating-yaml-waived',
            className: 'pf-u-warning-color-100',
            icon: ExclamationTriangleIcon,
            label: 'Test run resulted in an error.',
        },
        progress: {
            pick: type === 'running',
            className: 'pf-u-link-color',
            icon: InProgressIcon,
            label: 'Test is in progress.',
        },
        history: {
            pick: type === 'queued',
            className: 'pf-u-warning-color-100',
            icon: HistoryIcon,
            label: 'Test is queued.',
        },
        info: {
            pick:
                type === 'info' ||
                type === 'excluded' ||
                type === 'blacklisted',
            className: 'pf-u-info-color-100',
            icon: InfoIcon,
            label: 'Result has additinal info.',
        },
        skip: {
            pick: type === 'skip',
            className: 'pf-u-warning-color-100',
            icon: UnlinkIcon,
            label: 'Test was skipped.',
        },
        not_applicable: {
            pick: type === 'not_applicable',
            className: 'pf-u-info-color-100',
            icon: InfoIcon,
            label: 'Test was skipped.',
        },
    };

    type KnownIconsType = keyof typeof icons;
    const name = _.findKey(icons, (i) => i.pick);
    if (!name) return null;
    return _.pick(icons[name as KnownIconsType], [
        'className',
        'icon',
        'label',
    ]);
}

export const isGatingArtifact = (artifact: Artifact): boolean => {
    if (
        (isArtifactRPM(artifact) || isArtifactMBS(artifact)) &&
        _.size(artifact.hitSource.gateTag) > 0
    ) {
        return true;
    } else if (isArtifactRedhatContainerImage(artifact)) {
        /* Container builds are gated by Errata Tool */
        return true;
    }
    return false;
};

export interface TestStatusIconProps {
    /**
     * String indicating the status/outcome of the test.
     * Examples: 'pass', 'failed', 'error', 'info'.
     */
    status: string;
    /** Additional styling for the icon. */
    style?: CSSProperties;
}

export function TestStatusIcon(props: TestStatusIconProps) {
    const statusLower = props.status.toLowerCase();
    const iconProps = mapTypeToIconsProps(statusLower);

    if (!iconProps) {
        console.warn('Asked to render icon with unknown status:', props.status);
        return (
            <OutlinedQuestionCircleIcon aria-label="Result is unknown type." />
        );
    }

    let Icon = iconProps.icon;

    return (
        <Icon
            aria-label={iconProps.label}
            className={iconProps.className}
            size="sm"
            style={props.style}
            title={iconProps.label}
        />
    );
}

export interface GatingStatusIconProps {
    /** Boolean indicating whether gating has passed. The default is false. */
    status?: boolean;
    /** Additional styling for the icon. */
    style?: CSSProperties;
}

export function GatingStatusIcon(props: GatingStatusIconProps) {
    let className = 'pf-u-danger-color-100';
    let label = 'Gating is blocked';

    if (props.status) {
        className = 'pf-u-success-color-100';
        label = 'Gating has passed';
    }

    return (
        <TrafficLightIcon
            aria-label={label}
            className={className}
            size="sm"
            style={props.style}
            title={label}
        />
    );
}

const SCM_COMMIT_URL_REGEX =
    /\/(rpms|modules)\/([\w-]+)(?:\.git)?\/?\??#([0-9a-fA-F]+)$/;

export interface ScmUrlComponents {
    commit: string;
    name: string;
    namespace: string;
}

export const parseScmUrl = (source: string): ScmUrlComponents | undefined => {
    const match = SCM_COMMIT_URL_REGEX.exec(source);
    if (!match) {
        console.error(`Could not parse SCM URL: ${source}`);
        return;
    }
    const [, namespace, name, commit] = match;
    return { namespace, name, commit };
};

export const mkCommitHashFromSource = (source: string): string | undefined => {
    const components = parseScmUrl(source);
    if (!components) return;
    return components.commit;
};

/**
 * Transforms
 *
 * from:
 * git://pkgs.devel.redhat.com/rpms/bash#4cbab69537d8401a4c9b3c326f25fa95c5f6f6ee
 *
 * to:
 * http://pkgs.devel.redhat.com/cgit/rpms/bash/commit/?id=4cbab69537d8401a4c9b3c326f25fa95c5f6f6ee
 */
export const mkLinkPkgsDevelFromSource = (
    source: string,
    instance: KojiInstanceType,
) => {
    const components = parseScmUrl(source);
    if (!components) return '';
    const { namespace, name, commit } = components;
    switch (instance) {
        case 'cs':
            return `https://gitlab.com/redhat/centos-stream/${namespace}/${name}/-/commit/${commit}`;
        case 'fp':
            return `https://src.fedoraproject.org/${namespace}/${name}/c/${commit}`;
        case 'rh':
            return `https://pkgs.devel.redhat.com/cgit/${namespace}/${name}/commit/?id=${commit}`;
        default:
            console.warn(`Unknown Koji instance: ${instance}`);
            return '';
    }
};

export const mkLinkFileInGit = (
    repoName: string,
    namespace: 'rpms' | 'modules',
    commit: string,
    fileName: string,
    instance: DistGitInstanceType,
) => {
    switch (instance) {
        case 'cs':
            return `https://gitlab.com/redhat/centos-stream/${namespace}/${repoName}/-/blob/${commit}/${fileName}`;
        case 'fp':
            return `https://src.fedoraproject.org/${namespace}/${repoName}/blob/${commit}/f/${fileName}`;
        case 'rh':
            return `https://pkgs.devel.redhat.com/cgit/${namespace}/${repoName}/tree/${fileName}?h=${commit}`;
        default:
            console.warn(`Unknown Dist-Git instance: ${instance}`);
            return '';
    }
};

export const mkLinkMbsBuild = (
    buildId: number | string,
    instance: MbsInstanceType,
) => {
    if (!_.has(config.mbs, instance)) {
        console.warn(`Unknown MBS instance: ${instance}`);
        return;
    }
    const mbsUrlPrefix = config.mbs[instance].webUrl;
    if (!mbsUrlPrefix) {
        console.warn(`MBS web UI not available for ${instance}`);
        return;
    }
    return `${mbsUrlPrefix}/module/${buildId}`;
};

export const mkLinkKojiWebBuildId = (
    buildId: number | string,
    instance: KojiInstanceType,
) => {
    if (!_.has(config.koji, instance)) {
        console.error(`Unknown Koji instance: ${instance}`);
        return '';
    }
    const kojiUrlPrefix = config.koji[instance].webUrl;
    return `${kojiUrlPrefix}/buildinfo?buildID=${buildId}`;
};

export const mkLinkKojiWebTask = (
    taskId: number | string,
    instance: KojiInstanceType,
) => {
    if (!_.has(config.koji, instance)) {
        console.error(`Unknown Koji instance: ${instance}`);
        return '';
    }
    const kojiUrlPrefix = config.koji[instance].webUrl;
    return `${kojiUrlPrefix}/taskinfo?taskID=${taskId}`;
};

export const mkLinkKojiWebUserId = (
    userId: number | string,
    instance: KojiInstanceType,
) => {
    if (!_.has(config.koji, instance)) {
        console.error(`Unknown Koji instance: ${instance}`);
        return '';
    }
    const kojiUrlPrefix = config.koji[instance].webUrl;
    return `${kojiUrlPrefix}/userinfo?userID=${userId}`;
};

export const mkLinkKojiWebTagId = (
    tagId: number | string,
    instance: KojiInstanceType,
) => {
    if (!_.has(config.koji, instance)) {
        console.error(`Unknown Koji instance: ${instance}`);
        return '';
    }
    const kojiUrlPrefix = config.koji[instance].webUrl;
    return `${kojiUrlPrefix}/taginfo?tagID=${tagId}`;
};

/**
 * List of Greenwave requirement types that are considered as satisfied.
 * See [Greenwave documentation](https://gating-greenwave.readthedocs.io/en/latest/decision_requirements.html)
 * for details.
 */
const SATISFIED_REQUIREMENT_TYPES: GreenwaveRequirementTypesType[] = [
    'blacklisted',
    'excluded',
    'fetched-gating-yaml',
    'test-result-passed',
];

const isRequirementSatisfied = (state: StateGreenwaveType): boolean => {
    if (!state.requirement) {
        return true;
    }
    return _.includes(SATISFIED_REQUIREMENT_TYPES, state.requirement?.type);
};

/**
 * Should we display a waive button for this result in the dashboard?
 * Show the button only if the test is blocking gating.
 * Greenwave shows all known tests from ResultsDB.
 * @param state The state object of the test result in question.
 */
export const isResultWaivable = (state: StateType): boolean => {
    if (isGreenwaveKaiState(state)) return !isRequirementSatisfied(state.gs);
    if (isGreenwaveState(state)) return !isRequirementSatisfied(state);
    return false;
};

/**
 * List of Greenwave requirement types that we consider as missing.
 */
const MISSING_REQUIREMENT_TYPES: GreenwaveRequirementTypesType[] = [
    'missing-gating-yaml',
    'missing-gating-yaml-waived',
    'test-result-missing',
    'test-result-missing-waived',
];

const isRequirementMissing = (state: StateGreenwaveType): boolean =>
    _.includes(MISSING_REQUIREMENT_TYPES, state.requirement?.type);

/**
 * Check if the Greenwave state is missing the required test result.
 * @param state The Greenwave state to check.
 * @returns `true` if the required result is missing in Greenwave, `false` otherwise.
 */
export const isResultMissing = (state: StateType): boolean => {
    if (isGreenwaveKaiState(state)) return isRequirementMissing(state.gs);
    if (isGreenwaveState(state)) return isRequirementMissing(state);
    return false;
};

export const timestampForUser = (
    timestamp: string,
    includeRelative = false,
): string => {
    const localTime = moment.utc(timestamp).local();
    const timestampWithTz = localTime.format('YYYY-MM-DD HH:mm Z');
    if (!includeRelative) {
        return timestampWithTz;
    }
    const fromNow = localTime.fromNow();
    return `${timestampWithTz} (${fromNow})`;
};

const renderNewTabLink: (ir: IntermediateRepresentation) => React.ReactNode = ({
    attributes,
    content,
}) => (
    <a {...attributes} rel="noopener noreferrer" target="_blank">
        {content}
    </a>
);

export type LinkifyNewTabProps = React.PropsWithChildren<{}>;

export const LinkifyNewTab = (props: LinkifyNewTabProps) => (
    <Linkify options={{ render: renderNewTabLink }}>{props.children}</Linkify>
);

export function getKaiExtendedStatus(
    state: StateKaiType,
): StateExtendedKaiNameType {
    const msg = state.broker_msg_body;
    if (MSG_V_0_1.isMsg(msg) && 'status' in msg) {
        return msg.status;
    }
    if (MSG_V_1.isMsg(msg) && 'test' in msg && 'result' in msg.test) {
        return msg.test.result;
    }
    return state.kai_state.state;
}

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
