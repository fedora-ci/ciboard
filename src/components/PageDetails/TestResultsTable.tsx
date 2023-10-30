/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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
import { useContext } from 'react';
import {
    Flex,
    Label,
    Title,
    Alert,
    Button,
    CardBody,
} from '@patternfly/react-core';
import {
    BookIcon,
    LinkIcon,
    RedoIcon,
    UsersIcon,
} from '@patternfly/react-icons';
import {
    Td,
    Th,
    Tr,
    Tbody,
    Thead,
    TableComposable,
} from '@patternfly/react-table';
import { useHref } from 'react-router-dom';

import { CiTest } from './types';
import { SelectedTestContext } from './contexts';
import { TestStatusIcon } from './TestStatusIcon';
import { ExternalLink } from '../ExternalLink';
import { WaiveButton } from './WaiveButton';
import { DependencyList } from './DependencyList';
import { Artifact } from '../../types';

interface SingleTestRowProps {
    artifact: Artifact;
    isRequired?: boolean;
    showDependencies?: boolean;
    test: CiTest;
}

const SingleTestRow: React.FC<SingleTestRowProps> = (props) => {
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
};

/**
 * Awaited tests are those whose results are missing, are queued or
 * currently running AND haven't been waived.
 * @returns `true` if the test is required for gating and can be
 * considered missing/awaited, `false` or `undefined` otherwise.
 */
const isRequiredAwaited = ({ required, status, waiver }: CiTest) =>
    required &&
    (status === 'missing' || status === 'queued' || status === 'running') &&
    !waiver;

/**
 * Failed tests are those that have ended with either an error or
 * a failure AND haven't been waived.
 * @returns `true` if the test is required for gating and can be
 * considered failing, `false` or `undefined` otherwise.
 */
const isRequiredFailed = ({ required, status, waiver }: CiTest) =>
    required && (status === 'error' || status === 'failed') && !waiver;

/**
 * Passed tests are those that have either 'passed' or 'info' status OR
 * have been waived (regardless of original status).
 * @returns `true` if the test is required for gating and can be
 * considered passing, `false` or `undefined` otherwise.
 */
const isRequiredPassed = ({ required, status, waiver }: CiTest) =>
    required && (['info', 'passed'].includes(status) || !_.isNil(waiver));

export interface TestResultsTableProps {
    artifact: Artifact;
    onSelect?(key: string | undefined): void;
    tests: CiTest[];
}

export const TestResultsTable: React.FC<TestResultsTableProps> = (props) => {
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
        .filter((test) => isRequiredFailed(test))
        .map((test, index) => (
            <Tr
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
        .filter((test) => isRequiredAwaited(test))
        .map((test, index) => (
            <Tr
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
        .filter((test) => isRequiredPassed(test))
        .map((test) => (
            <Tr
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
};
