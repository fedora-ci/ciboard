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

import * as _ from 'lodash';
import { ReactNode, useContext } from 'react';
import {
    Alert,
    Button,
    CardBody,
    Flex,
    Label,
    Title,
} from '@patternfly/react-core';
import {
    BookIcon,
    LinkIcon,
    RedoIcon,
    UsersIcon,
} from '@patternfly/react-icons';
import {
    TableComposable,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from '@patternfly/react-table';
import { useHref } from 'react-router-dom';

import { Artifact } from '../../artifact';
import { SelectedTestContext } from './contexts';
import { CiContact, CiTest, TestStatus } from './types';
import { TestStatusIcon } from './TestStatusIcon';
import { ExternalLink } from '../ExternalLink';
import { WaiveButton } from './WaiveButton';

interface SingleTestRowProps {
    artifact: Artifact;
    /** Contatct information for the test or CI owners. */
    contact?: CiContact;
    docsUrl?: string;
    isRequired?: boolean;
    isWaivable?: boolean;
    isWaived?: boolean;
    labels?: string[];
    /** Test case name */
    name: string;
    rerunUrl?: string;
    status: TestStatus;
    /** Optional short text below the test case name. */
    subtitle?: ReactNode;
}

function SingleTestRow(props: SingleTestRowProps) {
    // TODO: Use unique ID later.
    const permalinkUrl = useHref(`?focus=${props.name}`);
    const statusIcon = (
        <TestStatusIcon
            size="md"
            status={props.status}
            style={{ marginTop: '0.2em' }}
        />
    );

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
                                Waived
                            </Label>
                        )}
                        {props.contact?.team && (
                            <Label color="blue" icon={<UsersIcon />} isCompact>
                                Team: {props.contact.team}
                            </Label>
                        )}
                        {props.labels?.map((label) => (
                            <Label isCompact key={label}>
                                {label}
                            </Label>
                        ))}
                    </Flex>
                </Flex>
                <Flex
                    alignSelf={{ default: 'alignSelfCenter' }}
                    className="pf-u-ml-auto"
                    spaceItems={{
                        default: 'spaceItemsNone',
                    }}
                >
                    {props.isWaivable && (
                        <WaiveButton
                            artifact={props.artifact}
                            testcase={props.name}
                        />
                    )}
                    {props.rerunUrl && (
                        <Button
                            component={ExternalLink}
                            href={props.rerunUrl}
                            icon={<RedoIcon />}
                            variant="link"
                        >
                            Rerun
                        </Button>
                    )}
                    {props.docsUrl && (
                        <Button
                            component={ExternalLink}
                            href={props.docsUrl}
                            icon={<BookIcon />}
                            variant="link"
                        >
                            Documentation
                        </Button>
                    )}
                    <Button
                        component="a"
                        href={permalinkUrl}
                        icon={<LinkIcon />}
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
    artifact: Artifact;
    onSelect?(key: string | undefined): void;
    tests: CiTest[];
}

export function TestResultsTable(props: TestResultsTableProps) {
    const { artifact, tests } = props;
    const selectedTest = useContext(SelectedTestContext);

    if (_.isEmpty(tests)) {
        return (
            <CardBody>
                <Alert
                    isInline
                    isPlain
                    title="No test results found for this artifact"
                    variant="info"
                />
            </CardBody>
        );
    }

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
                        artifact={artifact}
                        contact={row.contact}
                        docsUrl={row.docsUrl}
                        isRequired
                        isWaivable={row.waivable}
                        isWaived={row.status === 'waived'}
                        labels={row.labels}
                        name={row.name}
                        rerunUrl={row.rerunUrl}
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
                        artifact={artifact}
                        contact={row.contact}
                        docsUrl={row.docsUrl}
                        isRequired
                        isWaivable={row.waivable}
                        isWaived={row.status === 'waived'}
                        labels={row.labels}
                        name={row.name}
                        rerunUrl={row.rerunUrl}
                        status={row.status}
                        subtitle={row.subtitle}
                    />
                </Td>
            </Tr>
        ));

    const passedRequiredRows = tests
        .filter(
            ({ required, status }) =>
                required && ['info', 'passed', 'waived'].includes(status),
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
                        artifact={artifact}
                        contact={row.contact}
                        docsUrl={row.docsUrl}
                        isRequired
                        isWaived={row.status === 'waived'}
                        labels={row.labels}
                        name={row.name}
                        rerunUrl={row.rerunUrl}
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
                        artifact={artifact}
                        contact={row.contact}
                        docsUrl={row.docsUrl}
                        labels={row.labels}
                        name={row.name}
                        rerunUrl={row.rerunUrl}
                        status={row.status}
                        subtitle={row.subtitle}
                    />
                </Td>
            </Tr>
        ));

    /*
     * TODO: Refactor the table for readability.
     * TODO: Sorts tests within sections:
     *      - in failed: alphabetically
     *      - in awaited: missing first, then running, then alphabetically
     *      - in passed: waived first, then alphabetically
     *      - in additional: failed+errored+needs_inspection first,
     *          then info/not_applicable, then
     * TODO: Where to put waived tests in this order?
     */
    return (
        <TableComposable variant="compact">
            {failedRequiredRows.length > 0 && (
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
            {awaitedRequiredRows.length > 0 && (
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
            {passedRequiredRows.length > 0 && (
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
            {additionalRows.length > 0 && (
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
