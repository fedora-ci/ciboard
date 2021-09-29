/*
 * This file is part of ciboard

 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
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

import * as React from 'react';
import _ from 'lodash';
import {
    OkIcon,
    InfoIcon,
    GhostIcon,
    UnlinkIcon,
    TumblrIcon,
    InProgressIcon,
    TrafficLightIcon,
    ErrorCircleOIcon,
    PficonHistoryIcon,
    WarningTriangleIcon,
    OutlinedQuestionCircleIcon,
} from '@patternfly/react-icons';
import {
    DB,
    MSG_V_1,
    MSG_V_0_1,
    known_states,
    BrokerMessagesType,
} from '../types';

/** Maps artifact type to DB field to use in next query */
export const db_field_from_atype = {
    'koji-build': 'nvr',
    'copr-build': 'component',
    'koji-build-cs': 'nvr',
    'redhat-module': 'nsvc',
    'productmd-compose': 'aid',
};

/**
 * Transforms state provided by kai to expected states in UI.
 *
 * For test events the complete state is split between passed and failed.
 *
 * For build events the error is recognized as a failed state.
 *
 * for stage == 'test' replace complete: [] ==> failed: [], info: [], passed: []
 * From: { error: [], queued: [], waived: [], running: [], complete: [] }
 * To:   { error: [], queued: [], waived: [], running: [], failed: [], info: [], passed: [] }
 */
export const transformArtifactStates = (
    current_state: DB.CurrentStateType,
    stage: DB.StageNameType,
): DB.CurrentStateExtendedType => {
    const artifactStates = {};
    const current_state_names: Array<DB.StateNameType> =
        _.intersection<DB.StateNameType>(
            _.keys(current_state) as DB.StateNameType[],
            known_states,
        );
    _.forEach(current_state_names, (state_name) => {
        /**
         * for complete test states, count failed, passed and other events
         */
        if (state_name === 'complete' && stage === 'test') {
            Object.assign(artifactStates, {
                /**
                 * passed tests
                 */
                passed: current_state.complete?.filter((state: any) => {
                    /**
                     * v1
                     */
                    var test_result = state.status;
                    if (state.test && state.test.result) {
                        //
                        /**
                         * v2
                         */
                        test_result = state.test.result;
                    }
                    return (
                        state.stage === stage &&
                        _.includes(['pass', 'passed', 'PASSED'], test_result)
                    );
                }),
                /**
                 * failed tests
                 */
                failed: current_state.complete?.filter((state: any) => {
                    /**
                     * v1
                     */
                    var test_result = state.status;
                    if (state.test && state.test.result) {
                        /**
                         * v2
                         */
                        test_result = state.test.result;
                    }
                    return (
                        state.stage === stage &&
                        _.includes(
                            ['fail', 'failed', 'FAILED', 'needs_inspection'],
                            test_result,
                        )
                    );
                }),
                /** info tests */
                info: current_state.complete?.filter((state: any) => {
                    var test_result = state.status;
                    if (state.test && state.test.result) {
                        /** v2 */
                        test_result = state.test.result;
                    }
                    return (
                        state.stage === stage &&
                        _.includes(['info', 'INFO'], test_result)
                    );
                }),
            });
        } else if (state_name === 'error' && stage === 'build') {
            Object.assign(artifactStates, {
                /** failed build */
                failed: current_state.error?.filter(
                    (state: any) => state.stage === stage,
                ),
            });
        } else {
            /** states */
            Object.assign(artifactStates, {
                [state_name]: current_state[state_name]?.filter(
                    (state: any) => state.stage === stage,
                ),
            });
        }
    });

    return artifactStates;
};

const known_types = {
    'brew-build': 'nvr',
    'koji-build': 'nvr',
    'koji-build-cs': 'nvr',
    'redhat-module': 'nsvc',
    'copr-build': 'component',
    'productmd-compose': 'aid',
};

const known_aid_meaning = {
    'brew-build': 'taskID',
    'koji-build': 'taskID',
    'koji-build-cs': 'taskID',
    'redhat-module': 'mbsID',
    'copr-build': 'id',
    'productmd-compose': 'id',
};

export const nameFieldForType = (type: DB.ArtifactNameType) => {
    const includes = _.includes(_.keys(known_types), type);
    if (!includes) {
        return 'unknown type';
    }
    return known_types[type];
};

export const aidMeaningForType = (type: DB.ArtifactNameType) => {
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
     * Convert NSVC to Brew NVR
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

export const artifactUrl = (artifact: DB.ArtifactType) => {
    const urlMap = {
        'brew-build': `https://brewweb.engineering.redhat.com/brew/taskinfo?taskID=${artifact.aid}`,
        'koji-build': `https://koji.fedoraproject.org/koji/taskinfo?taskID=${artifact.aid}`,
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
    return urlMap[artifact.type as DB.ArtifactNameType];
};

export const resultColors = {
    '--pf-global--success-color--100': [
        'complete',
        'passed',
        'waived',
        'pass',
        'Pass',
        'PASS',
        true,
    ],
    '--pf-global--danger-color--100': [
        'failed',
        'fail',
        'Fail',
        'FAIL',
        'missing',
        false,
    ],
    '--pf-global--warning-color--100': ['error'],
    '--pf-global--link--Color': ['running'],
    '--pf-global--warning-color--200': ['queued', 'skip'],
    '--pf-global--info-color--100': ['info'],
};

export const resultColor = (result: string) => {
    return _.findKey(resultColors, (item) => item.indexOf(result) !== -1);
};

type modifyType = 'test' | 'gating';

export const getThreadID = (args: {
    kai_state?: DB.KaiStateType;
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

export const getTestcaseName = (args: {
    kai_state?: DB.KaiStateType;
    broker_msg_body?: BrokerMessagesType;
}) => {
    const { kai_state, broker_msg_body } = args;
    let test_case_name: string | null = null;
    if (kai_state?.test_case_name) {
        test_case_name = kai_state.test_case_name;
    }
    if (broker_msg_body && !test_case_name) {
        if (MSG_V_0_1.isMsg(broker_msg_body)) {
            if (
                broker_msg_body.namespace &&
                broker_msg_body.type &&
                broker_msg_body.category
            )
                return `${broker_msg_body.namespace}.${broker_msg_body.type}.${broker_msg_body.category}`;
        }
        if (MSG_V_1.isMsg(broker_msg_body)) {
            if (
                broker_msg_body.test.namespace &&
                broker_msg_body.test.type &&
                broker_msg_body.test.category
            )
                return `${broker_msg_body.test.namespace}.${broker_msg_body.test.type}.${broker_msg_body.test.category}`;
        }
    }
    if (!test_case_name) {
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
    size = '0.75em',
) => {
    const icons = {
        missing: {
            pick: type === 'missing',
            color: '--pf-global--danger-color--100',
            icon: GhostIcon,
            aria: 'Result is missing.',
        },
        ok: {
            pick:
                type === 'complete' ||
                type === 'passed' ||
                type === 'waived' ||
                type === 'pass' ||
                type === 'Pass' ||
                type === 'PASS' ||
                type === 'true',
            color: '--pf-global--success-color--100',
            icon: OkIcon,
            aria: 'Result is OK.',
        },
        error: {
            pick:
                type === 'failed' ||
                type === 'fail' ||
                type === 'Fail' ||
                type === 'FAIL' ||
                type === 'false',
            color: '--pf-global--danger-color--100',
            icon: ErrorCircleOIcon,
            aria: 'Result is error.',
        },
        warning: {
            pick: type === 'error',
            color: '--pf-global--warning-color--100',
            icon: WarningTriangleIcon,
            aria: 'Result is warning.',
        },
        progress: {
            pick: type === 'running',
            color: '--pf-global--link--Color',
            icon: InProgressIcon,
            aria: 'Result is in progress.',
        },
        history: {
            pick: type === 'queued',
            color: '--pf-global--warning-color--200',
            icon: PficonHistoryIcon,
            aria: 'Result has some history.',
        },
        info: {
            pick: type === 'info',
            color: '--pf-global--info-color--100',
            icon: InfoIcon,
            aria: 'Result has additinal info.',
        },
        skip: {
            pick: type === 'skip',
            color: '--pf-global--warning-color--200',
            icon: UnlinkIcon,
            aria: 'Result was skipped.',
        },
    };
    type KnownIconsType = keyof typeof icons;
    const name = _.findKey(icons, (i) => i.pick);
    if (!name) {
        console.log('Asked to render icon wiht unknown type:', type);
        return (
            <OutlinedQuestionCircleIcon aria-label="Result is unknown type." />
        );
    }
    let useIcon = icons[name as KnownIconsType];
    let Icon = useIcon.icon;
    if (mod === 'test') {
        Icon = TumblrIcon;
    } else if (mod === 'gating') {
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

/**
 * Transforms
 *
 * from:
 * git://pkgs.devel.redhat.com/rpms/bash#4cbab69537d8401a4c9b3c326f25fa95c5f6f6ee
 *
 * to:
 * http://pkgs.devel.redhat.com/cgit/rpms/bash/commit/?id=13117b55f5246ecac677f8e64ea640d27a9a527d
 */
export const mkLinkPkgsDevelFromSource = (source: string) => {
    const name_sha1 = _.last(_.split(source, 'rpms/'));
    const [name, sha1] = _.split(name_sha1, '#');
    return `http://pkgs.devel.redhat.com/cgit/rpms/${name}/commit/?id=${sha1}`;
};

export const mkLinkBrewWebBuildId = (buildId: string) => {
    return `https://brewweb.engineering.redhat.com/brew/buildinfo?buildID=${buildId}`;
};

export const mkLinkBrewWebUserId = (userId: string) => {
    return `https://brewweb.engineering.redhat.com/brew/userinfo?userID=${userId}`;
};

export const mkLinkBrewWebTagId = (tagId: string) => {
    return `https://brewweb.engineering.redhat.com/brew/taginfo?tagID=${tagId}`;
};
