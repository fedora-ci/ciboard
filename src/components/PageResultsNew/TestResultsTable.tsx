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
import { useContext } from 'react';
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
import { CiTest } from './types';
import { TestStatusIcon } from './TestStatusIcon';
import { ExternalLink } from '../ExternalLink';
import { WaiveButton } from './WaiveButton';
import { DependencyList } from './DependencyList';

interface SingleTestRowProps {
    artifact: Artifact;
    isRequired?: boolean;
    showDependencies?: boolean;
    test: CiTest;
}

function SingleTestRow(props: SingleTestRowProps) {
    const { artifact, test } = props;

    const isWaived = !_.isNil(test.waiver);

    const permalinkUrl = useHref(`?focus=${test.name}`);
    const statusIcon = (
        <TestStatusIcon
            isWaived={isWaived}
            size="md"
            status={test.status}
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
                flexWrap={{ default: 'nowrap' }}
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
                        {test.name}
                    </Title>
                    {props.showDependencies && (
                        <DependencyList dependencies={test.dependencies} />
                    )}
                    <Flex
                        spaceItems={{
                            default: 'spaceItemsXs',
                        }}
                    >
                        {isWaived && (
                            <Label color="orange" isCompact>
                                Waived
                            </Label>
                        )}
                        {test.contact?.team && (
                            <Label color="blue" icon={<UsersIcon />} isCompact>
                                Team: {test.contact.team}
                            </Label>
                        )}
                        {test.labels?.map((label) => (
                            <Label isCompact key={label}>
                                {label}
                            </Label>
                        ))}
                    </Flex>
                </Flex>
                <Flex
                    alignSelf={{ default: 'alignSelfCenter' }}
                    className="pf-u-ml-auto"
                    flexWrap={{ default: 'nowrap' }}
                    spaceItems={{
                        default: 'spaceItemsNone',
                    }}
                >
                    {test.waivable && (
                        <WaiveButton artifact={artifact} testcase={test.name} />
                    )}
                    {test.rerunUrl && (
                        <Button
                            component={ExternalLink}
                            href={test.rerunUrl}
                            icon={<RedoIcon />}
                            variant="link"
                        >
                            Rerun
                        </Button>
                    )}
                    {test.docsUrl && (
                        <Button
                            component={ExternalLink}
                            href={test.docsUrl}
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
        .map((test, index) => (
            /* More inspo in the docs: https://www.patternfly.org/v4/components/tabs/react-demos/#tables-and-tabs */
            <Tr
                isHoverable
                isRowSelected={selectedTest?.name === test.name}
                key={index}
                onRowClick={() => props.onSelect && props.onSelect(test.name)}
            >
                <Td>
                    <SingleTestRow
                        artifact={artifact}
                        isRequired
                        showDependencies
                        test={test}
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
        .map((test, index) => (
            <Tr
                isHoverable
                isRowSelected={selectedTest?.name === test.name}
                key={index}
                onRowClick={() => props.onSelect && props.onSelect(test.name)}
            >
                <Td>
                    <SingleTestRow
                        artifact={artifact}
                        isRequired
                        showDependencies
                        test={test}
                    />
                </Td>
            </Tr>
        ));

    const passedRequiredRows = tests
        .filter(
            ({ required, status }) =>
                required && ['info', 'passed'].includes(status),
        )
        .map((test) => (
            <Tr
                isHoverable
                isRowSelected={selectedTest?.name === test.name}
                key={test.name}
                onRowClick={() => props.onSelect && props.onSelect(test.name)}
            >
                <Td>
                    <SingleTestRow artifact={artifact} isRequired test={test} />
                </Td>
            </Tr>
        ));

    const additionalRows = tests
        .filter(({ required }) => !required)
        .map((test, index) => (
            <Tr
                isHoverable
                isRowSelected={selectedTest?.name === test.name}
                key={index}
                onRowClick={() => props.onSelect && props.onSelect(test.name)}
            >
                <Td>
                    <SingleTestRow
                        artifact={artifact}
                        showDependencies
                        test={test}
                    />
                </Td>
            </Tr>
        ));

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
