/*
 * This file is part of ciboard

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
import React from 'react';
import {
    Flex,
    Label,
    Title,
    LabelProps,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
} from '@patternfly/react-core';
import { LinkIcon } from '@patternfly/react-icons';
import { LinkifyNewTab } from '../utils/utils';
import { ArtifactKaiState, ArtifactKaiStateProps } from './AChildTestMsg';
import {
    ArtifactGreenwaveState,
    ArtifactGreenwaveStateProps,
} from './AChildGreenwave';
import {
    ArtifactGreenwaveTestMsgState,
    ArtifactGreenwaveTestMsgStateProps,
} from './AChildGreenwaveTestMsg';
import {
    Artifact,
    StateName,
    getThreadID,
    ArtifactChild,
    isChildTestMsg,
    getTestMsgBody,
    getTestcaseName,
    isGreenwaveChild,
    isGreenwaveAndTestMsg,
} from '../types';

type AChildDetailsEntryPropsWithChildren =
    React.PropsWithChildren<React.ReactNode> & { caption: string };

export const AChildDetailsEntry = (
    props: AChildDetailsEntryPropsWithChildren,
) => {
    const { children, caption } = props;
    if (_.isNil(children)) return null;
    return (
        <Flex direction={{ default: 'column' }}>
            <Title headingLevel="h1" size="lg">
                {caption}
            </Title>
            <Flex
                direction={{ default: 'column' }}
                grow={{ default: 'grow' }}
                spaceItems={{ default: 'spaceItemsLg' }}
            >
                {children}
            </Flex>
            <Flex />
        </Flex>
    );
};

interface AChildLinkProps {
    aChild: ArtifactChild;
    artifactDashboardUrl: string;
}

export const AChildLink: React.FC<AChildLinkProps> = (props) => {
    const { aChild, artifactDashboardUrl } = props;
    let href: string;
    if (isGreenwaveChild(aChild) || isGreenwaveAndTestMsg(aChild)) {
        const testcase = getTestcaseName(aChild);
        href = `${artifactDashboardUrl}?focus=tc:${testcase}`;
    } else if (isChildTestMsg(aChild)) {
        const msgBody = getTestMsgBody(aChild);
        const thread_id = getThreadID({ brokerMsgBody: msgBody });
        href = `${artifactDashboardUrl}?focus=id:${thread_id}`;
    } else {
        return null;
    }
    return (
        <a
            href={href}
            title="Permanent link to result"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <LinkIcon style={{ height: '0.9em' }} />
        </a>
    );
};

export const mkLabel = (
    name: string,
    value: string,
    color: LabelProps['color'] = 'orange',
    icon: JSX.Element | null = null,
): JSX.Element => {
    return (
        <DescriptionListGroup key={name}>
            <DescriptionListTerm>{name}</DescriptionListTerm>
            <DescriptionListDescription>
                <Label
                    isCompact
                    color={color}
                    icon={icon}
                    variant="filled"
                    isTruncated
                >
                    <LinkifyNewTab>{value.toString()}</LinkifyNewTab>
                </Label>
            </DescriptionListDescription>
        </DescriptionListGroup>
    );
};

type ResultMappingType = (string | ((a: string) => string))[][];

export const mkPairs = (mapping: ResultMappingType, dict: Object) => {
    const pairsNameValue: string[][] = [];
    _.forEach(mapping, (map) => {
        const [path, name, transform] = map;
        const value = _.get(dict, path as string);
        if (_.isNil(value) || (_.isEmpty(value) && !_.isNumber(value))) {
            return;
        }
        const v = _.isFunction(transform) ? transform(value) : value;
        pairsNameValue.push([name, v]);
    });
    return pairsNameValue;
};

export interface AChildProps {
    aChild: ArtifactChild;
    artifact: Artifact;
    stateName: StateName;
    forceExpand: boolean;
    artifactDashboardUrl: string;
    setExpandedResult: React.Dispatch<React.SetStateAction<string>>;
}

export const AChild: React.FC<AChildProps> = (props) => {
    const { aChild } = props;
    if (isGreenwaveAndTestMsg(aChild)) {
        return ArtifactGreenwaveTestMsgState(
            props as ArtifactGreenwaveTestMsgStateProps,
        );
    } else if (isGreenwaveChild(aChild)) {
        return ArtifactGreenwaveState(props as ArtifactGreenwaveStateProps);
    } else if (isChildTestMsg(aChild)) {
        return ArtifactKaiState(props as ArtifactKaiStateProps);
    }
    return <>Cannot get test info</>;
};
