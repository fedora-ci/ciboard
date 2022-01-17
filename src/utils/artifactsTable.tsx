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

import _ from 'lodash';
import * as React from 'react';
import { LegacyRef, useState } from 'react';
import {
    Flex,
    Text,
    List,
    Title,
    Spinner,
    Bullseye,
    FlexItem,
    ListItem,
    OrderType,
    EmptyState,
    TextContent,
    TextVariants,
    ListComponent,
    EmptyStateIcon,
    EmptyStateBody,
    EmptyStateVariant,
    ExpandableSection,
} from '@patternfly/react-core';
import { TableProps, RowWrapperProps, IRow } from '@patternfly/react-table';
import { nowrap, expandable, fitContent } from '@patternfly/react-table';
import { ArrowIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { global_danger_color_200 as globalDangerColor200 } from '@patternfly/react-tokens';
import {
    artifactUrl,
    resultColor,
    nameFieldForType,
    renderStatusIcon,
    aidMeaningForType,
    transformArtifactStates,
} from './artifactUtils';
import styles from '../custom.module.css';

import ArtifactResultsList from '../components/ArtifactResultsList';
import ArtifactDetailedInfo from '../components/ArtifactDetailedInfo';
import { DB } from '../types';

interface ArtifactNameProps {
    artifact: DB.ArtifactType;
}
const ArtifactName: React.FC<ArtifactNameProps> = (props) => {
    const { artifact } = props;
    let name;
    switch (artifact.type) {
        case 'brew-build':
        case 'koji-build':
        case 'koji-build-cs':
        case 'copr-build':
            name = artifact.payload.nvr;
            break;
        case 'redhat-module':
            name = artifact.payload.nvr; // Fix me
            break;
        case 'productmd-compose':
            name = artifact.aid;
            break;
        default:
            name = <p>Unknown artifact, please file a bug</p>;
    }
    return (
        <TextContent>
            <Title size="lg" headingLevel="h4" className="pf-u-m-0">
                {name}
            </Title>
        </TextContent>
    );
};

interface ArtifactDestinationProps {
    artifact: DB.ArtifactType;
}
const ArtifactDestination: React.FC<ArtifactDestinationProps> = (props) => {
    const { artifact } = props;
    if (artifact.gate_tag_name) {
        return (
            <TextContent>
                <Text component={TextVariants.p}>{artifact.gate_tag_name}</Text>
            </TextContent>
        );
    }
    if (artifact.payload.scratch) {
        return (
            <TextContent>
                <Text component={TextVariants.small}>scratch</Text>
            </TextContent>
        );
    }
    return null;
};

interface ArtifactUrlProps {
    artifact: DB.ArtifactType;
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

const TestResultInfo = ({ state, states }: any) => {
    const color = resultColor(state);
    const style = { color: `var(${color})` };
    return (
        <div style={style}>
            {states[state].length} {state}
        </div>
    );
};

interface TestInfoProps {
    artifact: DB.ArtifactType;
}

const TestInfo: React.FC<TestInfoProps> = (props) => {
    const { artifact } = props;
    /**
     * testStates - is complete: [] ==> failed: [], info: [], passed: []
     * { error: [], queued: [], running: [], complete: [] }
     * { error: [], queued: [], running: [], failed: [], info: [], passed: [] }
     */
    const testStates = transformArtifactStates(artifact.states, 'test');
    if (!_.some(_.values(testStates), 'length')) {
        return null;
    }
    const statesNotEmpty = _.keys(_.pickBy(testStates, 'length'));
    return (
        <Flex grow={{ default: 'grow' }} flexWrap={{ default: 'nowrap' }}>
            {_.map(statesNotEmpty, (state) => (
                <FlexItem key={state} spacer={{ default: 'spacerXs' }}>
                    <TestResultInfo state={state} states={testStates} />
                </FlexItem>
            ))}
        </Flex>
    );
};

const GatingInfo = ({ artifact }: any) => {
    const decision = artifact.gating_decision;
    if (!decision?.summary) {
        return null;
    }
    return (
        <Flex>
            <FlexItem>
                <TextContent>
                    <Text component={TextVariants.small}>
                        Gating:{' '}
                        {renderStatusIcon(
                            decision.policies_satisfied,
                            'gating',
                            '1.2em',
                        )}
                    </Text>
                </TextContent>
            </FlexItem>
        </Flex>
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
    const firstCell = children[0];
    if (!React.isValidElement(firstCell)) {
        throw new Error('Child must be valid element');
    }
    const isOpenParent = firstCell.props.children.props.isOpen;
    const customStyle = {
        background: 'var(--pf-global--BackgroundColor--100)',
    };
    const ref = isOpenParent ? scrollRef : undefined;
    return (
        <tr
            ref={ref}
            onMouseEnter={() => setGiveHint(true)}
            onMouseLeave={() => setGiveHint(false)}
            hidden={row?.isExpanded !== undefined && !row.isExpanded}
            className={giveHint ? styles['giveHint'] : styles['noHint']}
            style={isOpenParent || row?.isExpanded ? customStyle : {}}
            children={children}
        />
    );
};

export const tableColumns = (buildType: any) => {
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
            title: 'gating-tag',
            transforms: [fitContent],
            cellTransforms: [nowrap],
        },
        {
            title: 'tests',
            transforms: [fitContent],
            cellTransforms: [nowrap],
        },
        {
            title: 'gating-result',
            transforms: [fitContent],
            cellTransforms: [nowrap],
        },
        {
            title: 'packager',
            transforms: [fitContent],
            cellTransforms: [nowrap],
        },
        {
            title: 'info',
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
    var toggleText = 'Show errors';
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

export type InputRowType = {
    title: string;
    body: JSX.Element;
    type: string;
};

export type TableRowsType = TableProps['rows'];
export type OnCollapseEventType = Extract<TableProps['onCollapse'], Function>;
export type TableRowWrapperType = Extract<TableProps['rowWrapper'], Function>;

export const mkSpecialRows = (args: InputRowType): TableRowsType => {
    const default_args = { type: 'error' };
    const { title, body, type }: any = { ...default_args, ...args };
    var Icon = () => <></>;
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

export const mkArtifactRow = (artifact: DB.ArtifactType): IRow => {
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
            title: <TestInfo artifact={artifact} />,
        },
        {
            title: <GatingInfo artifact={artifact} />,
        },
        {
            title: (
                <div style={{ whiteSpace: 'nowrap' }}>
                    {artifact.payload.issuer}
                </div>
            ),
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
                    <ArrowIcon style={{ height: '0.75em' }} />
                </a>
            ),
        },
    ];
    return { cells, isOpen: false };
};

export type InputArtifactRowType = {
    artifacts: Array<DB.ArtifactType>;
    opened: number | null;
    queryString?: string;
    body?: JSX.Element;
    waitForRef?: React.MutableRefObject<any>;
};

export const mkArtifactsRows = (args: InputArtifactRowType): TableRowsType => {
    const { artifacts, opened, queryString, waitForRef } = args;
    if (_.isEmpty(artifacts)) {
        return [];
    }
    var rows = _.chain(artifacts)
        .map((artifact, index: number) => [
            mkArtifactRow(artifact),
            {
                parent: index * 2,
                isOpen: false,
                fullWidth: true,
                noPadding: true,
                cells: [
                    {
                        title: <>'loading'</>,
                        transforms: [fitContent],
                        cellTransforms: [nowrap],
                        cellFormatters: [expandable],
                    },
                ],
            },
        ])
        .flatten()
        .value();
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
                            <ArtifactResultsList artifact={artifacts[aOpen]} />
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
