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
import * as React from 'react';
import {
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Flex,
    Label,
    LabelProps,
    Title,
} from '@patternfly/react-core';
import { LinkIcon } from '@patternfly/react-icons';

import {
    LinkifyNewTab,
    getThreadID,
    isGreenwaveKaiState,
    isGreenwaveState,
    isKaiState,
    getTestcaseName,
} from '../utils/artifactUtils';
import { StateType, Artifact, StateExtendedNameType } from '../artifact';
import { ArtifactKaiState, ArtifactKaiStateProps } from './ArtifactKaiState';
import {
    ArtifactGreenwaveState,
    ArtifactGreenwaveStateProps,
} from './ArtifactGreenwaveState';
import {
    ArtifactGreenwaveKaiState,
    ArtifactGreenwaveKaiStateProps,
} from './ArtifactGreenwaveKaiState';

type StateDetailsEntryPropsWithChildren =
    React.PropsWithChildren<React.ReactNode> & { caption: string };

export const StateDetailsEntry = (
    props: StateDetailsEntryPropsWithChildren,
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

interface StateLinkProps {
    state: StateType;
    artifactDashboardUrl: string;
}

export const StateLink: React.FC<StateLinkProps> = (props) => {
    const { state, artifactDashboardUrl } = props;
    let href: string;
    if (isGreenwaveState(state) || isGreenwaveKaiState(state)) {
        const testcase = getTestcaseName(state);
        href = `${artifactDashboardUrl}?focus=tc:${testcase}`;
    } else if (isKaiState(state)) {
        const { broker_msg_body } = state;
        const thread_id = getThreadID({ broker_msg_body });
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

export interface ArtifactStateProps {
    artifact: Artifact;
    artifactDashboardUrl: string;
    forceExpand: boolean;
    setExpandedResult: React.Dispatch<React.SetStateAction<string>>;
    state: StateType;
    stateName: StateExtendedNameType;
}

export const ArtifactState: React.FC<ArtifactStateProps> = (props) => {
    const { state } = props;
    if (isGreenwaveKaiState(state)) {
        return ArtifactGreenwaveKaiState(
            props as ArtifactGreenwaveKaiStateProps,
        );
    } else if (isGreenwaveState(state)) {
        return ArtifactGreenwaveState(props as ArtifactGreenwaveStateProps);
    } else if (isKaiState(state)) {
        return ArtifactKaiState(props as ArtifactKaiStateProps);
    }
    return <>Cannot get test info</>;
};
