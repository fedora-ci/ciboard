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
import moment from 'moment';
import Linkify from 'react-linkify';

import { MSG_V_1, MSG_V_0_1, BrokerMessagesType } from '../types';
import {
    Artifact,
    ArtifactType,
    isArtifactMBS,
    isArtifactRPM,
    KaiStateType,
    KojiInstanceType,
    StateExtendedKaiNameType,
    StateGreenwaveKaiType,
    StateGreenwaveType,
    StateKaiType,
    StateType,
} from '../artifact';
import { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';

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
export const db_field_from_atype = {
    'brew-build': 'NVR',
    'copr-build': 'Component',
    'koji-build-cs': 'NVR',
    'koji-build': 'NVR',
    'productmd-compose': 'Compose ID',
    'redhat-module': 'NSVC',
};

const known_types = {
    'brew-build': 'NVR',
    'copr-build': 'Component',
    'koji-build-cs': 'NVR',
    'koji-build': 'NVR',
    'productmd-compose': 'Compose ID',
    'redhat-container': 'ID',
    'redhat-module': 'NSVC',
};

const known_aid_meaning = {
    'brew-build': 'Task ID',
    'copr-build': 'ID',
    'koji-build-cs': 'Task ID',
    'koji-build': 'Task ID',
    'productmd-compose': 'Compose',
    'redhat-container': 'ID',
    'redhat-module': 'MBS ID',
};

export function getArtifactName(artifact: Artifact): string | undefined {
    switch (artifact.type) {
        case 'brew-build':
        case 'copr-build':
        case 'koji-build':
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

export const artifactUrl = (artifact: Artifact) => {
    const urlMap = {
        'brew-build': `https://brewweb.engineering.redhat.com/brew/taskinfo?taskID=${artifact.aid}`,
        'koji-build': `https://koji.fedoraproject.org/koji/taskinfo?taskID=${artifact.aid}`,
        'koji-build-cs': `https://kojihub.stream.centos.org/koji/taskinfo?taskID=${artifact.aid}`,
        'redhat-container': `https://fixme/${artifact.aid}`,
        'copr-build': (() => {
            // XXX: fixme
            // const component = artifact.payload.component;
            // const coprRepo = component.match('.*/')[0].replace('@', 'g/');
            // const bid = artifact.aid.match('[^:]*')[0];
            // return `https://copr.fedorainfracloud.org/coprs/${coprRepo}build/${bid}`;
            return 'fixme';
        })(),
        'redhat-module': `https://mbsweb.engineering.redhat.com/module/${artifact.aid}`,
        'productmd-compose': '',
    };
    return urlMap[artifact.type];
};

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

type modifyType = 'gating' | 'test';

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

export const getTestcaseName = (state: StateType): string => {
    let testCaseName: string | undefined;
    if (isKaiState(state)) {
        const { kai_state } = state;
        if (kai_state?.test_case_name) {
            testCaseName = kai_state.test_case_name;
        }
        const broker_msg_body: BrokerMessagesType = state.broker_msg_body;
        if (broker_msg_body && _.isEmpty(testCaseName)) {
            if (MSG_V_0_1.isMsg(broker_msg_body)) {
                if (
                    broker_msg_body.namespace &&
                    broker_msg_body.type &&
                    broker_msg_body.category
                )
                    testCaseName = `${broker_msg_body.namespace}.${broker_msg_body.type}.${broker_msg_body.category}`;
            }
            if (MSG_V_1.isMsg(broker_msg_body)) {
                if (
                    broker_msg_body.test.namespace &&
                    broker_msg_body.test.type &&
                    broker_msg_body.test.category
                )
                    testCaseName = `${broker_msg_body.test.namespace}.${broker_msg_body.test.type}.${broker_msg_body.test.category}`;
            }
        }
    }
    if (isGreenwaveState(state)) {
        if (state.testcase) {
            testCaseName = state.testcase;
        }
    }
    if (isGreenwaveKaiState(state)) {
        if (state.gs.testcase) {
            testCaseName = state.gs.testcase;
        }
    }
    if (_.isUndefined(testCaseName)) {
        testCaseName = 'uknown testcase - please report an issue';
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
                type === 'test-result-errored' ||
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
    return (
        (isArtifactRPM(artifact) || isArtifactMBS(artifact)) &&
        _.size(artifact.payload.gate_tag_name) > 0
    );
};

export const renderStatusIcon = (
    type: string,
    mod: modifyType = 'test',
    size = '1em',
) => {
    const typeLC = _.toLower(type);
    const iconProps = mapTypeToIconsProps(typeLC);
    if (!iconProps) {
        console.warn('Asked to render icon with unknown type:', type);
        return (
            <OutlinedQuestionCircleIcon aria-label="Result is unknown type." />
        );
    }
    let Icon = iconProps.icon;
    if (mod === 'gating') {
        Icon = TrafficLightIcon;
    }
    const style = {
        height: size,
    };
    return (
        <Icon
            aria-label={iconProps.label}
            className={iconProps.className}
            size="sm"
            style={style}
            title={iconProps.label}
        />
    );
};

export const repoNameAndCommitFromSource = (
    source: string,
): [string, string | undefined] => {
    // source.split() will always be nonempty as long as source is a string.
    const tailSegment = _.last(source.split('rpms/'))!;
    const [nameDotGit, commit] = tailSegment.split('#');
    const name = nameDotGit.replace(/.git$/, '');
    return [name, commit];
};

export const mkCommitHashFromSource = (source: string): string | undefined => {
    const [_name, commit] = repoNameAndCommitFromSource(source);
    return commit;
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
    const [name, commit] = repoNameAndCommitFromSource(source);
    switch (instance) {
        case 'cs':
            return `https://gitlab.com/redhat/centos-stream/rpms/${name}/-/commit/${commit}`;
        case 'fp':
            return `https://src.fedoraproject.org/rpms/${name}/c/${commit}`;
        case 'rh':
            return `http://pkgs.devel.redhat.com/cgit/rpms/${name}/commit/?id=${commit}`;
        default:
            console.warn(`Unknown Koji instance: ${instance}`);
            return '';
    }
};

export const mkLinkKojiWebBuildId = (
    buildId: number | string,
    instance: KojiInstanceType,
) => {
    switch (instance) {
        case 'fp':
            return `https://koji.fedoraproject.org/koji/buildinfo?buildID=${buildId}`;
        case 'cs':
            return `https://kojihub.stream.centos.org/koji/buildinfo?buildID=${buildId}`;
        case 'rh':
            return `https://brewweb.engineering.redhat.com/brew/buildinfo?buildID=${buildId}`;
        default:
            console.log(`Unknown koji instance: ${instance}`);
            return '';
    }
};

export const mkLinkKojiWebUserId = (
    userId: number | string,
    instance: KojiInstanceType,
) => {
    switch (instance) {
        case 'fp':
            return `https://koji.fedoraproject.org/koji/userinfo?userID=${userId}`;
        case 'cs':
            return `https://kojihub.stream.centos.org/koji/userinfo?userID=${userId}`;
        case 'rh':
            return `https://brewweb.engineering.redhat.com/brew/userinfo?userID=${userId}`;
        default:
            console.log(`Unknown koji instance: ${instance}`);
            return '';
    }
};

export const mkLinkKojiWebTagId = (
    tagId: number | string,
    instance: KojiInstanceType,
) => {
    switch (instance) {
        case 'fp':
            return `https://koji.fedoraproject.org/koji/taginfo?tagID=${tagId}`;
        case 'cs':
            return `https://kojihub.stream.centos.org/koji/taginfo?tagID=${tagId}`;
        case 'rh':
            return `https://brewweb.engineering.redhat.com/brew/taginfo?tagID=${tagId}`;
        default:
            console.log(`Unknown koji instance: ${instance}`);
            return '';
    }
};

/**
 * Should we display a waive button for this result in the dashboard?
 * Show the button only if the test is blocking gating.
 * @param state The state object of the test result in question.
 */
export const isResultWaivable = (state: StateGreenwaveType): boolean =>
    !_.includes(['INFO', 'NOT_APPLICABLE', 'PASSED'], state.result?.outcome);

/**
 * Check if the Greenwave state is missing the required test result.
 * @param state The Greenwave state to check.
 * @returns `true` if the required result is missing in Greenwave, `false` otherwise.
 */
export const isResultMissing = (state: StateGreenwaveType): boolean =>
    _.includes(
        [
            'missing-gating-yaml',
            'missing-gating-yaml-waived',
            'test-result-missing',
            'test-result-missing-waived',
        ],
        state.requirement?.type,
    );

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

export type LinkifyNewTabProps = React.PropsWithChildren<React.ReactNode>;

export const LinkifyNewTab = (props: LinkifyNewTabProps) => (
    <Linkify
        componentDecorator={(decoratedHref, decoratedText, key) => (
            <a
                href={decoratedHref}
                key={key}
                rel="noopener noreferrer"
                target="_blank"
            >
                {decoratedText}
            </a>
        )}
    >
        {props.children}
    </Linkify>
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
