/*
 * This file is part of ciboard

 * Copyright (c) 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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
    Text,
    FlexItem,
    TextContent,
    TextVariants,
    DescriptionList,
} from '@patternfly/react-core';
import {
    Tr,
    Th,
    Td,
    Tbody,
    Thead,
    Caption,
    Table /* data-codemods */,
} from '@patternfly/react-table';

import {
    Label,
    Title,
    LabelProps,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
} from '@patternfly/react-core';

import styles from '../custom.module.css';
import { LinkifyNewTab } from '../utils/utils';
import {
    Metadata,
    MetadataContact,
    MetadataDependency,
    MetadataKnownIssue,
} from '../types';

interface DependencyProps {
    dependency?: MetadataDependency[];
}
const Dependency: React.FC<DependencyProps> = (props) => {
    const { dependency } = props;
    if (_.isEmpty(dependency) || _.isNil(dependency)) {
        return null;
    }
    const columnNames = {
        testcase: 'Testcase name',
        dependency: 'Dependency',
        comment: 'Details',
    };

    const depReadable = {
        is_required: 'Is required',
        is_related_to: 'Is related to',
    };

    return (
        <Table
            className={styles.metadataTable}
            aria-label="Actions table"
            variant="compact"
        >
            <Caption>
                <TextContent>
                    <Text component={TextVariants.h3}>
                        Dependencies to other tests
                    </Text>
                </TextContent>
            </Caption>
            <Thead noWrap>
                <Tr>
                    <Th>{columnNames.testcase}</Th>
                    <Th>{columnNames.dependency}</Th>
                    <Th>{columnNames.comment}</Th>
                </Tr>
            </Thead>
            <Tbody allowTransparency>
                {dependency.map((dep, index) => (
                    <Tr key={index}>
                        <Td
                            width={45}
                            modifier="nowrap"
                            dataLabel={columnNames.testcase}
                            isActionCell
                        >
                            <div className="pf-v5-u-px-md">
                                {dep.testcaseName}
                            </div>
                        </Td>
                        <Td
                            isActionCell
                            width={25}
                            dataLabel={columnNames.dependency}
                        >
                            <div className="pf-v5-u-px-md">
                                {depReadable[dep.dependency]}
                            </div>
                        </Td>
                        <Td
                            width={20}
                            modifier="nowrap"
                            dataLabel={columnNames.comment}
                            isActionCell
                        >
                            <div className="pf-v5-u-px-md">{dep.comment}</div>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

export interface KnownIssuesProps {
    issues?: MetadataKnownIssue[];
}

export const KnownIssues: React.FC<KnownIssuesProps> = (props) => {
    const { issues } = props;
    if (_.isEmpty(issues) || _.isNil(issues)) {
        return null;
    }
    const columnNames = {
        info: 'Info',
        status: 'Status',
        severity: 'Severity',
    };

    return (
        <Table
            className={styles.metadataTable}
            aria-label="Actions table"
            variant="compact"
        >
            <Caption>
                <TextContent>
                    <Text component={TextVariants.h3}>Known issues</Text>
                </TextContent>
            </Caption>
            <Thead noWrap>
                <Tr>
                    <Th>{columnNames.info}</Th>
                    <Th>{columnNames.status}</Th>
                    <Th>{columnNames.severity}</Th>
                </Tr>
            </Thead>
            <Tbody>
                {issues.map((issue, index) => (
                    <Tr key={index}>
                        <Td
                            width={50}
                            modifier="nowrap"
                            dataLabel={columnNames.info}
                            isActionCell
                        >
                            <div className="pf-v5-u-px-md">
                                <LinkifyNewTab>{issue.info}</LinkifyNewTab>
                            </div>
                        </Td>
                        <Td
                            isActionCell
                            width={20}
                            dataLabel={columnNames.status}
                        >
                            <div className="pf-v5-u-px-md">{issue.status}</div>
                        </Td>
                        <Td
                            width={20}
                            isActionCell
                            dataLabel={columnNames.severity}
                        >
                            <div className="pf-v5-u-px-md">
                                {issue.severity}
                            </div>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
};

interface DescriptionProps {
    description?: string;
}
const Description: React.FC<DescriptionProps> = (props) => {
    const { description } = props;
    if (_.isNil(description)) {
        return null;
    }

    return (
        <TextContent>
            <Text className="pf-v5-u-py-md" component={TextVariants.h3}>
                Test description
            </Text>
            <Text component={TextVariants.pre}>
                <small>
                    <LinkifyNewTab>{description}</LinkifyNewTab>
                </small>
            </Text>
        </TextContent>
    );
};

const metadataContactKnownEntries = {
    name: 'CI name',
    url: 'Web UI',
    irc: 'IRC channel',
    team: 'Team name',
    docs: 'Documentation',
    email: 'Contact email',
    gchat_room_url: 'Google chat',
    slack_channel_url: 'Slack channel',
    report_issue_url: 'Report issue',
};

interface ContactProps {
    contact?: MetadataContact;
}
const Contacts: React.FC<ContactProps> = (props) => {
    const { contact } = props;
    if (_.isNil(contact)) {
        return null;
    }

    const elements: JSX.Element[] = _(contact || {})
        .map((value, name) => {
            if (!_.isString(value)) {
                return null;
            }
            const labelName: string = _.get(
                metadataContactKnownEntries,
                name,
                name,
            );
            return mkLabel(labelName, value, 'green');
        })
        .compact()
        .value();

    const toRender = (
        <DescriptionList
            isCompact
            isHorizontal
            columnModifier={{
                default: '2Col',
            }}
        >
            {elements}
        </DescriptionList>
    );

    return toRender;
};

interface TestInfoProps {
    metadata: Metadata;
}
export const TestInfo: React.FC<TestInfoProps> = (props) => {
    const { metadata } = props;

    if (_.isNil(metadata) || _.isNil(metadata?.payload)) {
        return null;
    }
    const { contact, description } = metadata.payload;
    if (!contact && !description) {
        return null;
    }

    const toRender = (
        <Flex>
            <FlexItem>
                <AChildDetailsEntry caption="Test info">
                    <Flex direction={{ default: 'column' }}>
                        <FlexItem key="1">
                            <Contacts contact={contact} />
                            <Description description={description} />
                        </FlexItem>
                    </Flex>
                </AChildDetailsEntry>
            </FlexItem>
        </Flex>
    );

    return toRender;
};

interface TestKnownIssuesProps {
    metadata: Metadata;
}
export const TestKnownIssues: React.FC<TestKnownIssuesProps> = (props) => {
    const { metadata } = props;

    if (_.isNil(metadata) || _.isNil(metadata?.payload)) {
        return null;
    }
    const { known_issues } = metadata.payload;
    if (!known_issues) {
        return null;
    }

    const toRender = (
        <Flex>
            <FlexItem>
                <AChildDetailsEntry caption="Test info">
                    <Flex direction={{ default: 'column' }}>
                        <FlexItem key="1">
                            <KnownIssues issues={known_issues} />
                        </FlexItem>
                    </Flex>
                </AChildDetailsEntry>
            </FlexItem>
        </Flex>
    );

    return toRender;
};

interface TestDependencyProps {
    metadata: Metadata;
}
export const TestDependency: React.FC<TestDependencyProps> = (props) => {
    const { metadata } = props;

    if (_.isNil(metadata) || _.isNil(metadata?.payload)) {
        return null;
    }
    const { dependency } = metadata.payload;
    if (!dependency) {
        return null;
    }

    const toRender = (
        <Flex>
            <FlexItem>
                <AChildDetailsEntry caption="Test dependency">
                    <Flex direction={{ default: 'column' }}>
                        <FlexItem key="1">
                            <Dependency dependency={dependency} />
                        </FlexItem>
                    </Flex>
                </AChildDetailsEntry>
            </FlexItem>
        </Flex>
    );

    return toRender;
};

export interface MetadataQueryResult {
    metadataConsolidated: Metadata;
}

/**
 * This is react hook for functional components.
 * https://stackoverflow.com/questions/53120972/how-to-call-loading-function-with-react-useeffect-only-once
 */
export function useOnceCall(cb: Function, condition = true) {
    const isCalledRef = React.useRef(false);
    React.useEffect(() => {
        if (condition && !isCalledRef.current) {
            isCalledRef.current = true;
            cb();
        }
    }, [cb, condition]);
}

type AChildDetailsEntryPropsWithChildren = React.PropsWithChildren & {
    caption: string;
};

const AChildDetailsEntry = (props: AChildDetailsEntryPropsWithChildren) => {
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

const mkLabel = (
    name: string,
    value: string,
    color: LabelProps['color'] = 'orange',
    icon: JSX.Element | null = null,
): JSX.Element => {
    return (
        <DescriptionListGroup key={name}>
            <DescriptionListTerm>{name}</DescriptionListTerm>
            <DescriptionListDescription>
                <Label isCompact color={color} icon={icon} variant="filled">
                    <LinkifyNewTab>{value.toString()}</LinkifyNewTab>
                </Label>
            </DescriptionListDescription>
        </DescriptionListGroup>
    );
};
