/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
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

import { ReactNode, useContext } from 'react';
import { Button, Flex, Label, Title } from '@patternfly/react-core';
import {
    TableComposable,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from '@patternfly/react-table';

import { SelectedTestContext } from './contexts';
import { CiTest, TestStatus } from './types';
import { TestStatusIcon } from './TestStatusIcon';
import {
    BookIcon,
    LinkIcon,
    SyncAltIcon,
    ThumbsUpIcon,
} from '@patternfly/react-icons';

interface SingleTestRowProps {
    isRequired?: boolean;
    isWaivable?: boolean;
    isWaived?: boolean;
    labels?: string[];
    name: string;
    status: TestStatus;
    subtitle?: ReactNode;
}

function SingleTestRow(props: SingleTestRowProps) {
    const statusIcon = <TestStatusIcon status={props.status} />;

    return (
        <Flex
            alignItems={{
                default: 'alignItemsFlexStart',
            }}
            className="pf-u-mx-lg"
        >
            {statusIcon}{' '}
            <Flex
                alignItems={{
                    default: 'alignItemsFlexStart',
                }}
                flex={{ default: 'flex_1' }}
            >
                <Flex
                    direction={{
                        default: 'column',
                    }}
                    spaceItems={{
                        default: 'spaceItemsSm',
                    }}
                >
                    <Title className="pf-u-mb-0" headingLevel="h2" size="md">
                        {props.name}
                    </Title>
                    {props.subtitle && (
                        <Title
                            className="pf-u-color-200 pf-u-font-weight-light"
                            headingLevel="h3"
                            size="md"
                        >
                            {props.subtitle}
                        </Title>
                    )}
                    <Flex
                        spaceItems={{
                            default: 'spaceItemsXs',
                        }}
                    >
                        {props.isWaived && (
                            <Label color="orange" isCompact>
                                waived
                            </Label>
                        )}
                        {props.isRequired && (
                            <Label color="blue" isCompact>
                                required
                            </Label>
                        )}
                        {props.labels?.map((label) => (
                            <Label isCompact key={label}>
                                {label}
                            </Label>
                        ))}
                    </Flex>
                </Flex>
                {/* TODO: Implement handlers for the actions below. */}
                <Flex
                    alignSelf={{ default: 'alignSelfCenter' }}
                    className="pf-u-ml-auto"
                    spaceItems={{
                        default: 'spaceItemsNone',
                    }}
                >
                    {props.isWaivable && (
                        <Button
                            icon={<ThumbsUpIcon />}
                            onClick={(event) => {
                                alert(
                                    'Not implemented yet. This will show the waiving form.',
                                );
                                event.stopPropagation();
                            }}
                            variant="link"
                        >
                            Waive
                        </Button>
                    )}
                    <Button
                        icon={<SyncAltIcon />}
                        onClick={(event) => {
                            alert(
                                'Not implemented yet. This will rerun the test.',
                            );
                            event.stopPropagation();
                        }}
                        variant="link"
                    >
                        Rerun
                    </Button>
                    <Button
                        icon={<BookIcon />}
                        onClick={(event) => {
                            alert(
                                'Not implemented yet. This will take you to the CI documentation.',
                            );
                            event.stopPropagation();
                        }}
                        variant="link"
                    >
                        Documentation
                    </Button>
                    <Button
                        icon={<LinkIcon />}
                        onClick={(event) => {
                            alert(
                                'Not implemented yet. This will be a permalink to the test results.',
                            );
                            event.stopPropagation();
                        }}
                        variant="link"
                    >
                        Link
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
}

export interface TestResultsTableProps {
    onSelect?(key: string | undefined): void;
    tests: CiTest[];
}

export function TestResultsTable(props: TestResultsTableProps) {
    const { tests } = props;
    const selectedTest = useContext(SelectedTestContext);

    // TODO: Handle the empty case, i.e. when there are no (known) tests.

    const failedRequiredRows = tests
        .filter(
            ({ required, status }) =>
                required && (status === 'error' || status === 'failed'),
        )
        .map((row) => (
            /* More inspo in the docs: https://www.patternfly.org/v4/components/tabs/react-demos/#tables-and-tabs */
            // TODO: Handle click → open drawer/change contents to match selected test.
            <Tr
                isHoverable
                isRowSelected={selectedTest?.name === row.name}
                // TODO: Use unique key later on.
                key={row.name}
                // TODO: Use unique key later on.
                onRowClick={() => props.onSelect && props.onSelect(row.name)}
            >
                <Td>
                    <SingleTestRow
                        isRequired
                        isWaivable={row.isWaivable}
                        isWaived={row.status === 'waived'}
                        labels={row.labels}
                        name={row.name}
                        status={row.status}
                        subtitle={row.subtitle}
                    />
                </Td>
            </Tr>
        ));

    const awaitedRequiredRows = tests
        .filter(
            ({ required, status }) =>
                required &&
                (status === 'missing' ||
                    status === 'queued' ||
                    status === 'running'),
        )
        .map((row) => (
            /* More inspo in the docs: https://www.patternfly.org/v4/components/tabs/react-demos/#tables-and-tabs */
            // TODO: Handle click → open drawer/change contents to match selected test.
            <Tr
                isHoverable
                isRowSelected={selectedTest?.name === row.name}
                // TODO: Use unique key later on.
                key={row.name}
                // TODO: Use unique key later on.
                onRowClick={() => props.onSelect && props.onSelect(row.name)}
            >
                <Td>
                    <SingleTestRow
                        isRequired
                        isWaivable={row.isWaivable}
                        isWaived={row.status === 'waived'}
                        labels={row.labels}
                        name={row.name}
                        status={row.status}
                        subtitle={row.subtitle}
                    />
                </Td>
            </Tr>
        ));

    const passedRequiredRows = tests
        .filter(
            ({ required, status }) =>
                required && (status === 'passed' || status === 'waived'),
        )
        .map((row) => (
            <Tr
                isHoverable
                isRowSelected={selectedTest?.name === row.name}
                // TODO: Use unique key later on.
                key={row.name}
                // TODO: Use unique key later on.
                onRowClick={() => props.onSelect && props.onSelect(row.name)}
            >
                <Td>
                    <SingleTestRow
                        isRequired
                        isWaived={row.status === 'waived'}
                        labels={row.labels}
                        name={row.name}
                        status={row.status}
                        subtitle={row.subtitle}
                    />
                </Td>
            </Tr>
        ));

    const additionalRows = tests
        .filter(({ required }) => !required)
        .map((row) => (
            <Tr
                isHoverable
                isRowSelected={selectedTest?.name === row.name}
                // TODO: Use unique key later on.
                key={row.name}
                // TODO: Use unique key later on.
                onRowClick={() => props.onSelect && props.onSelect(row.name)}
            >
                <Td>
                    <SingleTestRow
                        labels={row.labels}
                        name={row.name}
                        status={row.status}
                        subtitle={row.subtitle}
                    />
                </Td>
            </Tr>
        ));

    return (
        <TableComposable variant="compact">
            {/* TODO: Where to put waived tests in this order? */}
            {failedRequiredRows.length && (
                <>
                    <Thead>
                        <Tr>
                            <Th className="pf-u-py-sm pf-u-color-200">
                                Failed required tests (
                                {failedRequiredRows.length})
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>{failedRequiredRows}</Tbody>
                </>
            )}
            {awaitedRequiredRows.length && (
                <>
                    <Thead>
                        <Tr>
                            <Th className="pf-u-py-sm pf-u-color-200">
                                Awaited required tests (
                                {awaitedRequiredRows.length})
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>{awaitedRequiredRows}</Tbody>
                </>
            )}
            {passedRequiredRows.length && (
                <>
                    <Thead>
                        <Tr>
                            <Th className="pf-u-py-sm pf-u-color-200">
                                Passed required tests (
                                {passedRequiredRows.length})
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>{passedRequiredRows}</Tbody>
                </>
            )}
            {additionalRows.length && (
                <>
                    <Thead>
                        <Tr>
                            <Th className="pf-u-py-sm pf-u-color-200">
                                Additional tests (not required for gating,{' '}
                                {additionalRows.length})
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody>{additionalRows}</Tbody>
                </>
            )}
        </TableComposable>
    );
}