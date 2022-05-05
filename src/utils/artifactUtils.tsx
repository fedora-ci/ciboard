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
import { MSG_V_1, MSG_V_0_1, BrokerMessagesType } from '../types';
import {
    Artifact,
    ArtifactType,
    KaiStateType,
    KojiInstanceType,
    StateGreenwaveKaiType,
    StateGreenwaveType,
    StateKaiType,
    StateType,
} from '../artifact';

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
    var os_version;
    if (artifactType === 'redhat-module') {
        if (/-f\d\d-/.test(nvr)) {
            /** Fedora module - take 2 digits. */
            os_version = release.substring(0, 2);
        } else {
            /** RHEL based. Take 1 digit. */
            os_version = release.substring(0, 1);
        }
    } else {
        /**
         * Release : 1.fc32_2
         * We discussed with dcantrell@ : and for now solution is to search for pattern: \.(el|fc)[0-9]+
         */
        var dist_tag = release.match(/\.(el|fc)[0-9]+/g)?.toString();
        os_version = dist_tag?.replace(/\.(el|fc)/, '');
    }
    console.log('nvr: %s, has os version: %s', nvr, os_version);
    return os_version;
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

export const resultColors = {
    '--pf-global--success-color--100': [
        'complete',
        'passed',
        'pass',
        'Pass',
        'PASS',
        true,
        'satisfied',
    ],
    '--pf-global--danger-color--100': [
        'failed',
        'fail',
        'Fail',
        'FAIL',
        'missing',
        false,
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
    var test_case_name: string | undefined;
    if (isKaiState(state)) {
        const { kai_state } = state;
        if (kai_state?.test_case_name) {
            test_case_name = kai_state.test_case_name;
        }
        const broker_msg_body: BrokerMessagesType = state.broker_msg_body;
        if (broker_msg_body && _.isEmpty(test_case_name)) {
            if (MSG_V_0_1.isMsg(broker_msg_body)) {
                if (
                    broker_msg_body.namespace &&
                    broker_msg_body.type &&
                    broker_msg_body.category
                )
                    test_case_name = `${broker_msg_body.namespace}.${broker_msg_body.type}.${broker_msg_body.category}`;
            }
            if (MSG_V_1.isMsg(broker_msg_body)) {
                if (
                    broker_msg_body.test.namespace &&
                    broker_msg_body.test.type &&
                    broker_msg_body.test.category
                )
                    test_case_name = `${broker_msg_body.test.namespace}.${broker_msg_body.test.type}.${broker_msg_body.test.category}`;
            }
        }
    }
    if (isGreenwaveState(state)) {
        if (state.testcase) {
            test_case_name = state.testcase;
        }
    }
    if (isGreenwaveKaiState(state)) {
        if (state.gs.testcase) {
            test_case_name = state.gs.testcase;
        }
    }
    if (_.isUndefined(test_case_name)) {
        test_case_name = 'uknown testcase - please report an issue';
    }
    return test_case_name;
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

export const renderStatusIcon = (
    type: string,
    mod: modifyType = 'test',
    size = '1em',
) => {
    const icons = {
        missing: {
            pick: type === 'missing' || type === 'test-result-missing',
            color: '--pf-global--disabled-color--100',
            icon: GhostIcon,
            aria: 'Result is missing.',
        },
        ok: {
            pick:
                type === 'complete' ||
                type === 'passed' ||
                type === 'pass' ||
                type === 'Pass' ||
                type === 'PASS' ||
                type === 'test-result-passed' ||
                type === 'fetched-gating-yaml' ||
                type === 'true',
            color: '--pf-global--success-color--100',
            icon: CheckCircleIcon,
            aria: 'Result is OK.',
        },
        error: {
            pick:
                type === 'failed' ||
                type === 'fail' ||
                type === 'Fail' ||
                type === 'FAIL' ||
                type === 'test-result-errored' ||
                type === 'failed-fetch-gating-yaml' ||
                type === 'test-result-failed' ||
                type === 'invalid-gating-yaml' ||
                type === 'missing-gating-yaml' ||
                type === 'false',
            color: '--pf-global--danger-color--100',
            icon: TimesCircleIcon,
            aria: 'Test has failed.',
        },
        warning: {
            pick:
                type === 'error' ||
                type === 'invalid-gating-yaml-waived' ||
                type === 'missing-gating-yaml-waived' ||
                type === 'test-result-failed-waived' ||
                type === 'test-result-missing-waived' ||
                type === 'test-result-errored-waived' ||
                type === 'failed-fetch-gating-yaml-waived',
            color: '--pf-global--warning-color--100',
            icon: ExclamationTriangleIcon,
            aria: 'Test run resulted in an error.',
        },
        progress: {
            pick: type === 'running',
            color: '--pf-global--link--Color',
            icon: InProgressIcon,
            aria: 'Test is in progress.',
        },
        history: {
            pick: type === 'queued',
            color: '--pf-global--warning-color--200',
            icon: HistoryIcon,
            aria: 'Test is queued.',
        },
        info: {
            pick:
                type === 'info' ||
                type === 'excluded' ||
                type === 'blacklisted',
            color: '--pf-global--info-color--100',
            icon: InfoIcon,
            aria: 'Result has additinal info.',
        },
        skip: {
            pick: type === 'skip',
            color: '--pf-global--warning-color--200',
            icon: UnlinkIcon,
            aria: 'Test was skipped.',
        },
        not_applicable: {
            pick: type === 'not_applicable',
            color: '--pf-global--info-color--100',
            icon: InfoIcon,
            aria: 'Test was skipped.',
        },
    };
    type KnownIconsType = keyof typeof icons;
    const name = _.findKey(icons, (i) => i.pick);
    if (!name) {
        console.warn('Asked to render icon with unknown type:', type);
        return (
            <OutlinedQuestionCircleIcon aria-label="Result is unknown type." />
        );
    }
    let useIcon = icons[name as KnownIconsType];
    let Icon = useIcon.icon;
    if (mod === 'gating') {
        Icon = TrafficLightIcon;
    }
    const color = useIcon.color;
    const style = {
        color: `var(${color})`,
        height: size,
    };
    return (
        <Icon
            aria-label={useIcon.aria}
            title={useIcon.aria}
            size="sm"
            style={style}
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
    buildId: string,
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
    userId: string,
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
    tagId: string,
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
