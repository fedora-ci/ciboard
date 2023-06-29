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
import { Buffer } from 'buffer';
import pako from 'pako';
import { useContext, useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionToggle,
    Alert,
    DrawerPanelBody,
    Flex,
    FlexItem,
    Spinner,
    Title,
} from '@patternfly/react-core';
import { OutlinedClockIcon } from '@patternfly/react-icons';
import {
    ExpandableRowContent,
    TableComposable,
    Tbody,
    Td,
    Tr,
} from '@patternfly/react-table';
import moment from 'moment';
import update from 'immutability-helper';

import './index.css';
import {
    TestCase,
    TestCaseLogsEntry,
    TestSuite,
    getProperty,
    hasTestCaseContent,
} from '../../testsuite';
import { mkSeparatedList } from '../../utils/artifactsTable';
import { TestStatusIcon } from '../../utils/artifactUtils';
import { ExternalLink } from '../ExternalLink';
import { ArchitectureLabel, TestCaseContent } from '../TestSuites';
import { Artifact } from '../../artifact';
import { SelectedTestContext } from './contexts';
import { useQuery } from '@apollo/client';
import { ArtifactsXunitQuery } from '../../queries/Artifacts';
import { xunitParser } from '../../utils/xunitParser';

function humanReadableTime(seconds: number) {
    // TODO: Migrate away from the moment library.
    const duration = moment.duration(seconds, 'seconds');
    if (duration.hours() >= 1)
        return duration.format('hh:mm:ss', { trim: false });
    return duration.format('mm:ss', { trim: false });
}

interface LogsLinksProps {
    logs?: TestCaseLogsEntry[];
}

function LogsLinks(props: LogsLinksProps) {
    const { logs } = props;
    if (_.isEmpty(logs)) return null;
    const makeLink = (entry: TestCaseLogsEntry) => (
        <ExternalLink href={entry.$.href}>{entry.$.name}</ExternalLink>
    );
    const linksList = mkSeparatedList(logs!.map(makeLink, ', '));

    return <div className="pf-u-font-size-sm">Logs: {linksList}</div>;
}

interface TestCaseRowProps {
    rowIndex: number;
    testCase?: TestCase;
}

function TestCaseRow(props: TestCaseRowProps) {
    const { rowIndex, testCase } = props;
    const [isExpanded, setExpanded] = useState(false);

    if (!testCase) return null;

    const hasContent = hasTestCaseContent(testCase);
    const logsLinks = testCase.logs?.length > 0 && (
        <LogsLinks logs={_.first(testCase.logs)?.log} />
    );
    const elapsedTime = !_.isEmpty(testCase.time) && (
        <FlexItem
            className="pf-u-ml-auto pf-u-color-200 pf-u-font-size-sm"
            style={{
                fontFamily: 'monospace',
            }}
        >
            <OutlinedClockIcon title="Elapsed time" />
            &nbsp;
            {humanReadableTime(Number(testCase.time))}
        </FlexItem>
    );
    const machineArchitecture = getProperty(testCase, 'baseosci.arch');
    const onToggle = () => setExpanded(!isExpanded);

    // TODO: Use a unique ID for the key.
    return (
        <Tbody key={testCase.name} isExpanded={isExpanded}>
            <Tr>
                <Td
                    className="pf-u-pl-0"
                    expand={
                        hasContent
                            ? { isExpanded, onToggle, rowIndex }
                            : undefined
                    }
                    title="Toggle test outputs and phases"
                />
                <Td>
                    <Flex flexWrap={{ default: 'nowrap' }}>
                        <FlexItem>
                            <TestStatusIcon status={testCase.status} />
                        </FlexItem>
                        <Flex
                            direction={{ default: 'column' }}
                            grow={{ default: 'grow' }}
                        >
                            <Title className="pf-u-mb-0" headingLevel="h4">
                                {testCase.name}{' '}
                                <ArchitectureLabel
                                    architecture={machineArchitecture}
                                />
                            </Title>
                            <Flex>
                                {logsLinks}
                                {elapsedTime}
                            </Flex>
                        </Flex>
                    </Flex>
                </Td>
            </Tr>
            <Tr isExpanded={isExpanded}>
                <Td colSpan={2}>
                    <ExpandableRowContent>
                        <TestCaseContent test={testCase} />
                    </ExpandableRowContent>
                </Td>
            </Tr>
        </Tbody>
    );
}

interface TestCasesTableProps {
    cases?: TestCase[];
}

function TestCasesTable(props: TestCasesTableProps) {
    const { cases } = props;
    if (!cases) return null;
    if (!cases.length)
        return (
            <Alert
                isInline
                isPlain
                title="No test cases in this suite."
                variant="info"
            />
        );

    return (
        <TableComposable className="testCasesTable" variant="compact">
            {cases.map((testCase, rowIndex) => (
                <TestCaseRow rowIndex={rowIndex} testCase={testCase} />
            ))}
        </TableComposable>
    );
}

export interface TestSuitesAccordionProps {
    artifact?: Artifact;
}

export function TestSuitesAccordion(props: TestSuitesAccordionProps) {
    /*
     * TODO: Expand all suites by default?
     * TOOD: Expand suites with failures by default?
     * TODO: Render test cases directly if there is only a single suite?
     * TODO: If only one test suite is present, expand it by default.
     */
    const [expandedSuites, setExpandedSuites] = useState<
        Partial<Record<string, boolean>>
    >({});
    const { artifact } = props;

    const selectedTest = useContext(SelectedTestContext);
    let error: string | undefined;
    let suites: TestSuite[] | undefined;

    const {
        data,
        error: queryError,
        loading,
    } = useQuery(ArtifactsXunitQuery, {
        variables: {
            atype: artifact?.type,
            dbFieldName1: 'aid',
            dbFieldValues1: [artifact?.aid],
            msg_id: selectedTest?.messageId,
        },
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
        skip: !artifact || !selectedTest?.messageId,
        notifyOnNetworkStatusChange: true,
    });

    if (!artifact || !selectedTest) return null;

    const haveData =
        !loading &&
        !_.isEmpty(data) &&
        _.has(data, 'artifacts.artifacts[0].states');

    const state = _.find(
        /** this is a bit strange, that received data doesn't propage to original
         * artifact object. Original artifact.states objects stays old */
        _.get(data, 'artifacts.artifacts[0].states'),
        (state) => state.kai_state?.msg_id === selectedTest.messageId,
    );
    if (haveData && !_.isNil(state)) {
        const xunitRaw: string = state.broker_msg_xunit;
        if (!_.isEmpty(xunitRaw)) {
            try {
                /** Decode base64 encoded gzipped data */
                const compressed = Buffer.from(xunitRaw, 'base64');
                const decompressed = pako.inflate(compressed);
                const utf8Decoded = Buffer.from(decompressed).toString('utf8');
                suites = xunitParser(utf8Decoded);
            } catch (err) {
                error = _.toString(err);
                console.error(`Cannot parse detailed results:`, err);
            }
        }
    } else {
        error = queryError?.message;
        console.error(
            `GraphQL error when retrieving detailed results:`,
            queryError,
        );
    }

    if (loading) {
        return (
            <DrawerPanelBody>
                <Spinner size="md" /> Loading detailed test results…
            </DrawerPanelBody>
        );
    }

    if (error) {
        return (
            <DrawerPanelBody>
                <Alert
                    isInline
                    title="Detailed results not available"
                    variant="danger"
                >
                    Could not retrieve detailed test results: {error}
                </Alert>
            </DrawerPanelBody>
        );
    }

    if (_.isEmpty(suites) || !suites) {
        return (
            <DrawerPanelBody>
                <Alert
                    isInline
                    title="Detailed results not available"
                    variant="info"
                >
                    The CI system did not provide detailed results for this test
                    run.
                </Alert>
            </DrawerPanelBody>
        );
    }

    if (suites.length === 1 && _.isEmpty(expandedSuites)) {
        // TODO: Use a unique ID here later.
        setExpandedSuites({ [suites[0].name]: true });
    }

    const onToggle = (name: string): void => {
        const newExpandedIds = update(expandedSuites, {
            $toggle: [name],
        });
        setExpandedSuites(newExpandedIds);
    };

    return (
        <Accordion isBordered>
            {suites.map(({ name, status, tests }) => {
                const statusIcon = (
                    <TestStatusIcon
                        status={status}
                        style={{
                            marginRight: 'var(--pf-global--spacer--sm)',
                            verticalAlign: '-0.125em',
                        }}
                    />
                );

                // TODO: Use a unique ID here later.
                return (
                    <AccordionItem key={name}>
                        <AccordionToggle
                            id={name}
                            isExpanded={expandedSuites[name]}
                            onClick={() => onToggle(name)}
                        >
                            {statusIcon}
                            {name}
                        </AccordionToggle>
                        <AccordionContent isHidden={!expandedSuites[name]}>
                            <TestCasesTable cases={tests} />
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}
