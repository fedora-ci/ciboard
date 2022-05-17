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
import classNames from 'classnames';
import { LegacyRef, useState } from 'react';
import {
    Bullseye,
    DropdownProps,
    DropdownToggleProps,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    EmptyStateVariant,
    ExpandableSection,
    List,
    ListComponent,
    ListItem,
    OrderType,
    Spinner,
    Text,
    TextContent,
    TextVariants,
    Title,
} from '@patternfly/react-core';
import { TableProps, RowWrapperProps, IRow } from '@patternfly/react-table';
import { nowrap, expandable, fitContent } from '@patternfly/react-table';
import { ExclamationCircleIcon, LinkIcon } from '@patternfly/react-icons';
import { global_danger_color_200 as globalDangerColor200 } from '@patternfly/react-tokens';

import {
    aidMeaningForType,
    artifactUrl,
    getArtifactName,
    nameFieldForType,
} from './artifactUtils';
import { Artifact } from '../artifact';
import { ArtifactStatesList } from '../components/ArtifactStatesList';
import { ArtifactDetailedInfo } from '../components/ArtifactDetailedInfo';
import { ArtifactGreenwaveStatesSummary } from '../components/GatingStatus';
import styles from '../custom.module.css';

interface ArtifactNameProps {
    artifact: Artifact;
}
const ArtifactName: React.FC<ArtifactNameProps> = ({ artifact }) => {
    return (
        <TextContent>
            <Title size="lg" headingLevel="h4" className="pf-u-m-0">
                {getArtifactName(artifact) ||
                    'Unknown artifact, please file a bug'}
            </Title>
        </TextContent>
    );
};

interface ArtifactDestinationProps {
    artifact: Artifact;
}
const ArtifactDestination: React.FC<ArtifactDestinationProps> = (props) => {
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

interface ArtifactUrlProps {
    artifact: Artifact;
}
const ArtifactUrl: React.FC<ArtifactUrlProps> = (props) => {
    const { artifact } = props;
    return (
        <TextContent>
            <Text component={TextVariants.small}>
                <a
                    href={artifactUrl(artifact)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                >
                    {artifact.aid}
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
    const [giveHint, setGiveHint] = useState(false);
    const firstCell: React.ReactNode = children[0];
    if (!React.isValidElement(firstCell)) {
        throw new Error('Child must be valid element');
    }
    const isOpenParent = firstCell.props.children.props.isOpen;
    const ref = isOpenParent ? scrollRef : undefined;
    let resultClasses = classNames(giveHint ? styles.giveHint : styles.noHint);
    return (
        <tr
            ref={ref}
            onMouseEnter={() => setGiveHint(true)}
            onMouseLeave={() => setGiveHint(false)}
            className={resultClasses}
            hidden={row?.isExpanded !== undefined && !row.isExpanded}
            children={children}
        />
    );
};

export const tableColumns = (buildType: any): TableProps['cells'] => {
    /**
     * width: 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 60 | 70 | 80 | 90 | 'max' %
     */
    const fieldName = nameFieldForType(buildType);
    const aidMeaning = aidMeaningForType(buildType);
    return [
        {
            title: aidMeaning,
            transforms: [fitContent],
            cellTransforms: [nowrap],
            cellFormatters: [expandable],
        },
        {
            title: fieldName,
            transforms: [fitContent],
            cellTransforms: [nowrap],
        },
        {
            title: 'Gating tag',
            transforms: [fitContent],
            cellTransforms: [nowrap],
        },
        {
            title: 'Gating status',
            transforms: [fitContent],
            cellTransforms: [nowrap],
        },
        {
            title: 'Packager',
            transforms: [fitContent],
            cellTransforms: [nowrap],
        },
        {
            title: 'Info',
        },
    ];
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
                    onToggle={onToggle}
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

export type OnCollapseEventType = Extract<TableProps['onCollapse'], Function>;
export type TableRowWrapperType = Extract<TableProps['rowWrapper'], Function>;
export type OnDropdownToggleType = Extract<
    DropdownToggleProps['onToggle'],
    Function
>;
export type OnDropdownSelectType = Extract<DropdownProps['onSelect'], Function>;

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
        Icon = () => <EmptyStateIcon variant="container" component={Spinner} />;
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
                                <EmptyState variant={EmptyStateVariant.small}>
                                    <Icon />
                                    <Title headingLevel="h2" size="lg">
                                        {title}
                                    </Title>
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
            title: <ArtifactDestination artifact={artifact} />,
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
    queryString?: string;
    body?: JSX.Element;
    waitForRef?: React.MutableRefObject<any>;
    gatingDecisionIsLoading: boolean;
};

export const mkArtifactsRows = (args: InputArtifactRowType): IRow[] => {
    const { artifacts, opened, gatingDecisionIsLoading } = args;
    if (_.isEmpty(artifacts)) {
        return [];
    }
    let rows: IRow[] = artifacts.flatMap((artifact, index: number) => [
        mkArtifactRow(artifact, gatingDecisionIsLoading),
        {
            parent: index * 2,
            isOpen: false,
            fullWidth: true,
            noPadding: true,
            cells: [
                {
                    title: 'Loading…',
                    transforms: [fitContent],
                    cellTransforms: [nowrap],
                    cellFormatters: [expandable],
                },
            ],
        },
    ]);
    if (!_.isNil(opened)) {
        const aOpen = opened / 2;
        rows[opened].isOpen = true;
        rows[opened + 1] = {
            /** 1, 3, 5, 7, 9, ... */
            parent: opened,
            isOpen: true,
            fullWidth: true,
            noPadding: true,
            cells: [
                {
                    title: (
                        <>
                            <ArtifactDetailedInfo artifact={artifacts[aOpen]} />
                            <ArtifactStatesList artifact={artifacts[aOpen]} />
                        </>
                    ),
                    transforms: [fitContent],
                    cellTransforms: [nowrap],
                    cellFormatters: [expandable],
                },
            ],
        };
    }
    return rows;
};

export function mkSeparatedList(
    elements: React.ReactNode[],
    separator: React.ReactNode = ', ',
) {
    if (_.isNil(elements)) return null;
    return elements.reduce(
        (acc, el) =>
            acc === null ? (
                el
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
