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
import { LegacyRef, useState } from 'react';
import {
    List,
    Text,
    Title,
    Spinner,
    Bullseye,
    ListItem,
    OrderType,
    EmptyState,
    TextContent,
    TextVariants,
    ListComponent,
    EmptyStateBody,
    EmptyStateIcon,
    EmptyStateVariant,
    ExpandableSection,
    EmptyStateHeader,
} from '@patternfly/react-core';
import {
    DropdownProps,
    DropdownToggleProps,
} from '@patternfly/react-core/deprecated';
import { RowWrapperProps, IRow } from '@patternfly/react-table';
import { TableProps } from '@patternfly/react-table/deprecated';
import { ExclamationCircleIcon, LinkIcon } from '@patternfly/react-icons';
import { global_danger_color_200 as globalDangerColor200 } from '@patternfly/react-tokens';

import styles from '../custom.module.css';
import {
    Artifact,
    getArtifactId,
    getArtifactName,
    getArtifactRemoteUrl,
} from '../types';
import { ArtifactGreenwaveStatesSummary } from '../components/GatingStatus';

export interface ArtifactNameProps {
    artifact: Artifact;
}

export const ArtifactName: React.FC<ArtifactNameProps> = ({ artifact }) => {
    return (
        <TextContent>
            <Title size="lg" headingLevel="h4" className="pf-v5-u-m-0">
                {getArtifactName(artifact) ||
                    'Unknown artifact, please file a bug'}
            </Title>
        </TextContent>
    );
};

export interface ArtifactDestinationProps {
    artifact: Artifact;
}

export const ArtifactDestination: React.FC<ArtifactDestinationProps> = (
    props,
) => {
    const { artifact } = props;
    const gating_tag: string | undefined = _.get(
        artifact,
        'payload.gate_tag_name',
    );
    if (gating_tag) {
        return (
            <TextContent>
                <Text component={TextVariants.p}>{gating_tag}</Text>
            </TextContent>
        );
    }
    if (_.get(artifact, 'payload.scratch')) {
        return (
            <TextContent>
                <Text component={TextVariants.small}>scratch</Text>
            </TextContent>
        );
    }
    return null;
};

export interface ArtifactUrlProps {
    artifact: Artifact;
}

export const ArtifactUrl: React.FC<ArtifactUrlProps> = (props) => {
    const { artifact } = props;
    const url = getArtifactRemoteUrl(artifact);
    const aid = getArtifactId(artifact);
    return (
        <TextContent>
            <Text component={TextVariants.small}>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                >
                    {aid}
                </a>
            </Text>
        </TextContent>
    );
};

const artifactDashboardUrl = (artifact: any) => {
    return `${window.location.origin}/#/artifact/${artifact.type}/aid/${artifact.aid}`;
};

type CustomRowWrapperPropsWithChildren =
    React.PropsWithChildren<RowWrapperProps> & {
        scrollRef: LegacyRef<HTMLTableRowElement>;
    };

export const CustomRowWrapper = (
    props: CustomRowWrapperPropsWithChildren,
): JSX.Element => {
    const { row, children, scrollRef } = props;
    if (!(children instanceof Array)) {
        throw new Error('Expect array of rows');
    }
    const firstCell: React.ReactNode = children[0];
    if (!React.isValidElement(firstCell)) {
        throw new Error('Child must be valid element');
    }
    const isOpenParent: boolean = firstCell.props.children.props.isOpen;
    const ref = isOpenParent ? scrollRef : undefined;
    return (
        <tr
            children={children}
            className={styles.withHint}
            hidden={row?.isExpanded !== undefined && !row.isExpanded}
            ref={ref}
        />
    );
};

export const ShowErrors = ({ error, forceExpand }: any) => {
    const [isExpanded, setExpanded] = useState(false);
    if (!error) {
        return null;
    }
    const errors = [];
    errors.push(<ListItem key="generic">${error.toString()}</ListItem>);
    if (
        error.networkError &&
        error.networkError.result &&
        !_.isEmpty(error.networkError.result.errors)
    ) {
        _.forEach(error.networkError.result.errors, ({ message }, i) => {
            errors.push(<ListItem key={i}>{message}</ListItem>);
        });
    }
    if (error.graphQLErrors) {
        _.forEach(error.graphQLErrors, ({ message, locations, path }, i) =>
            errors.push(
                <ListItem
                    key={i}
                >{`${message}, ${locations}, ${path}`}</ListItem>,
            ),
        );
    }
    const onToggle = (isExpanded: boolean) => {
        setExpanded(isExpanded);
    };
    let toggleText = 'Show errors';
    if (forceExpand) {
        toggleText = '';
    } else if (isExpanded) {
        toggleText = 'Hide errors';
    }
    return (
        <TextContent>
            <Text component={TextVariants.small}>
                <ExpandableSection
                    toggleText={toggleText}
                    onToggle={(_event, isExpanded: boolean) =>
                        onToggle(isExpanded)
                    }
                    isExpanded={isExpanded}
                >
                    <List component={ListComponent.ol} type={OrderType.number}>
                        {errors}
                    </List>
                </ExpandableSection>
            </Text>
        </TextContent>
    );
};

export interface InputRowType {
    body: React.ReactNode;
    title: string;
    type: string;
}

export type OnCollapseEventType = TableProps['onCollapse'];
export type TableRowWrapperType = TableProps['rowWrapper'];
export type OnDropdownToggleType = DropdownToggleProps['onToggle'];
export type OnDropdownSelectType = DropdownProps['onSelect'];

export const mkSpecialRows = (args: InputRowType): IRow[] => {
    const default_args = { type: 'error' };
    const { title, body, type }: any = { ...default_args, ...args };
    let Icon = () => <></>;
    if (type === 'error') {
        Icon = () => (
            <EmptyStateIcon
                icon={ExclamationCircleIcon}
                color={globalDangerColor200.value}
            />
        );
    } else if (type === 'loading') {
        Icon = () => <EmptyStateIcon icon={Spinner} />;
    }
    return [
        {
            heightAuto: true,
            cells: [
                {
                    props: { colSpan: 8 },
                    title: (
                        <div>
                            <Bullseye>
                                <EmptyState variant={EmptyStateVariant.sm}>
                                    <Icon />
                                    <EmptyStateHeader
                                        titleText={<>{title}</>}
                                        headingLevel="h2"
                                    />
                                    <EmptyStateBody>{body}</EmptyStateBody>
                                </EmptyState>
                            </Bullseye>
                        </div>
                    ),
                },
            ],
        },
    ];
};

export const mkArtifactRow = (
    artifact: Artifact,
    gatingDecisionIsLoading: boolean,
): IRow => {
    const packager: string = _.get(
        artifact,
        'payload.issuer',
        'Unknown packager',
    );
    const cells = [
        {
            title: <ArtifactUrl artifact={artifact} />,
        },
        {
            title: <ArtifactName artifact={artifact} />,
        },
        {
            title: (
                <ArtifactGreenwaveStatesSummary
                    artifact={artifact}
                    isLoading={gatingDecisionIsLoading}
                />
            ),
        },
        {
            title: <ArtifactDestination artifact={artifact} />,
        },
        {
            title: <div style={{ whiteSpace: 'nowrap' }}>{packager}</div>,
        },
        {
            title: (
                <a
                    href={artifactDashboardUrl(artifact)}
                    key="Link to artifact"
                    title="Artifact link"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <LinkIcon style={{ height: '0.9em' }} />
                </a>
            ),
        },
    ];
    return { cells, isOpen: false };
};

export type InputArtifactRowType = {
    artifacts: Artifact[];
    opened: number | null;
    body?: JSX.Element;
    waitForRef?: React.MutableRefObject<any>;
    gatingDecisionIsLoading: boolean;
};

export function mkSeparatedList(
    elements: React.ReactNode[],
    separator: React.ReactNode = ', ',
) {
    if (_.isNil(elements)) return null;
    return elements.reduce(
        (acc, el) =>
            acc === null ? (
                <>{el}</>
            ) : (
                <>
                    {acc}
                    {separator}
                    {el}
                </>
            ),
        null,
    );
}
