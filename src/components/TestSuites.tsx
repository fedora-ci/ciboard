/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2023 Andrei Stepanov <astepano@redhat.com>
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
import React, { useState } from 'react';
import classNames from 'classnames';
import 'moment-duration-format';
import {
    Alert,
    Flex,
    Label,
    Checkbox,
    FlexItem,
    DataList,
    DataListCell,
    DataListItem,
    DataListToggle,
    DataListItemRow,
    DataListContent,
    DataListItemCells,
} from '@patternfly/react-core';
import { IRow, cellWidth, TableVariant } from '@patternfly/react-table';
import {
    Table,
    TableBody,
    TableHeader,
} from '@patternfly/react-table/deprecated';
import { MicrochipIcon, OutlinedClockIcon } from '@patternfly/react-icons';

import { mkSeparatedList } from '../utils/artifactsTable';
import { mapTypeToIconsProps, TestStatusIcon } from '../utils/utils';
import {
    TestCase,
    TestSuite,
    getProperty,
    TestCaseLogs,
    TestCasePhases,
    TestSuiteStatus,
    TestCaseLogsEntry,
    hasTestCaseContent,
    TestCasePhasesEntry,
    TestCaseTestOutputs,
    TestCaseTestOutputsEntry,
} from '../testsuite';
import styles from '../custom.module.css';
import { ExternalLink } from './ExternalLink';
import { humanReadableTime } from '../utils/timeUtils';

const mkLogLink = (log: TestCaseLogsEntry): JSX.Element => (
    <ExternalLink href={log.$.href} key={log.$.name}>
        {log.$.name}
    </ExternalLink>
);

interface LogsLinksProps {
    logs: TestCaseLogs[];
}

const LogsLinks: React.FC<LogsLinksProps> = ({ logs }) => {
    if (!logs || _.isEmpty(logs[0].log)) return null;
    const logsLinks = mkSeparatedList(mkLogsLinks(logs));
    return <p>Log files: {logsLinks}</p>;
};

const mkLogsLinks = (logs: TestCaseLogs[]): JSX.Element[] => {
    /** logs[0].log - [log1, log2, log3] */
    if (!logs[0] || _.isEmpty(logs[0].log)) return [];
    return _.map(logs[0].log, (log) => mkLogLink(log));
};

const mkPhase = (phase: TestCasePhasesEntry): IRow => {
    return {
        cells: [
            <TestStatusIcon status={phase.$.result} />,
            phase.$.name,
            mkSeparatedList(mkLogsLinks(phase.logs)),
        ],
        key: phase.$.name,
    };
};

interface PhasesProps {
    phases?: TestCasePhases[];
}

const Phases: React.FC<PhasesProps> = ({ phases }) => {
    if (!phases || _.isEmpty(phases[0]?.phase)) return null;
    const rows: IRow[] = _.map(phases[0].phase, (phase) => mkPhase(phase));
    return (
        <Table
            aria-label="Table of individual phases within this test"
            borders={false}
            cells={[
                { title: '', transforms: [cellWidth(10)] },
                { title: 'Test phase', transforms: [cellWidth(50)] },
                { title: 'Log files' },
            ]}
            rows={rows}
            sortBy={{}}
            variant={TableVariant.compact}
        >
            <TableHeader />
            <TableBody />
        </Table>
    );
};

const mkTestOutput = (output: TestCaseTestOutputsEntry): IRow => ({
    cells: [
        <>{output.$.result}</>,
        <>{output.$.message}</>,
        <>{output.$.remedy}</>,
    ],
});

interface OutputsTableProps {
    outputs?: TestCaseTestOutputs[];
}

const OutputsTable: React.FC<OutputsTableProps> = (props) => {
    const { outputs } = props;
    if (!outputs || _.isEmpty(outputs[0]['test-output'])) return null;
    const all_outputs = outputs[0]['test-output'];
    const rows: IRow[] = [];
    _.map(all_outputs, (output) => rows.push(mkTestOutput(output)));
    return (
        <Table
            aria-label="Test output"
            variant={TableVariant.compact}
            borders={false}
            sortBy={{}}
            cells={[
                { title: 'Result', transforms: [cellWidth(15)] },
                { title: 'Test output', transforms: [cellWidth(50)] },
                { title: 'Remedy', transforms: [cellWidth(45)] },
            ]}
            rows={rows}
        >
            <TableHeader />
            <TableBody />
        </Table>
    );
};

export interface TestCaseContentProps {
    test: TestCase;
}

export const TestCaseContent: React.FC<TestCaseContentProps> = (props) => {
    const { test } = props;
    return (
        <>
            <OutputsTable outputs={test['test-outputs']} />
            <Phases phases={test.phases} />
        </>
    );
};

export interface ArchitectureLabelProps {
    architecture?: string;
}

export const ArchitectureLabel: React.FC<ArchitectureLabelProps> = ({
    architecture,
}) => {
    if (_.isEmpty(architecture)) return null;
    return (
        <Label
            icon={<MicrochipIcon className="pf-v5-u-color-200" />}
            isCompact
            title={`This test was run on the ${architecture} machine architecture`}
            variant="outline"
        >
            {architecture}
        </Label>
    );
};

interface TestCaseItemProps {
    test: TestCase;
}

const TestCaseItem: React.FC<TestCaseItemProps> = (props) => {
    const { test } = props;
    const [expanded, setExpanded] = useState(false);
    const time = humanReadableTime(Number(test.time));

    const toggle = () => {
        setExpanded(!expanded);
    };

    const hasContent = hasTestCaseContent(test);
    const iconProps = mapTypeToIconsProps(test.status);
    const nameClassName = classNames(
        'pf-v5-u-text-nowrap',
        'pf-v5-u-font-weight-bold',
        iconProps ? iconProps.className : '',
    );
    const machineArchitecture = getProperty(test, 'baseosci.arch');

    const summaryCell: React.ReactNode = (
        <DataListCell key="summary">
            <Flex
                direction={{ default: 'column' }}
                grow={{ default: 'grow' }}
                key="primary content"
                spaceItems={{ default: 'spaceItemsSm' }}
            >
                <Flex>
                    <FlexItem>
                        <TestStatusIcon status={test.status} />
                    </FlexItem>
                    <FlexItem className={nameClassName}>{test.name}</FlexItem>
                    <FlexItem>
                        <ArchitectureLabel architecture={machineArchitecture} />
                    </FlexItem>
                    {time && (
                        <FlexItem
                            align={{ default: 'alignRight' }}
                            className="pf-v5-u-color-200"
                            style={{ fontFamily: 'monospace' }}
                        >
                            <OutlinedClockIcon title="Elapsed time" /> {time}
                        </FlexItem>
                    )}
                </Flex>
                <LogsLinks logs={test.logs} />
            </Flex>
        </DataListCell>
    );

    const className = classNames({ [styles.expandedTestsuite]: expanded });

    return (
        <DataListItem className={className} isExpanded={expanded}>
            <DataListItemRow>
                {hasContent && (
                    <DataListToggle
                        aria-label={
                            expanded
                                ? 'Hide test case details'
                                : 'Show test case details'
                        }
                        id={test._uuid}
                        isExpanded={expanded}
                        onClick={toggle}
                    />
                )}
                <DataListItemCells dataListCells={[summaryCell]} />
            </DataListItemRow>
            {hasContent && (
                <DataListContent
                    aria-label="Test case details"
                    id={test._uuid}
                    isHidden={!expanded}
                >
                    <TestCaseContent test={test} />
                </DataListContent>
            )}
        </DataListItem>
    );
};

const NoDetailedResults: React.FC<{}> = () => {
    return (
        <Alert isInline isPlain title="No details available" variant="info">
            The CI system did not provide detailed results for this test. To
            find out more, please interrogate the log files or inspect the
            produced test artifacts.
        </Alert>
    );
};

type ToggleStateType = Partial<Record<TestSuiteStatus, boolean>>;

const DEFAULT_TOGGLE_STATE: ToggleStateType = {
    fail: true,
    skip: true,
    pass: false,
    error: true,
};

function compareTestCases(tc1: TestCase, tc2: TestCase) {
    // Failures before everything.
    if (tc1.status === 'fail' && tc2.status !== 'fail') return -1;
    if (tc1.status !== 'fail' && tc2.status === 'fail') return 1;
    // Infra errors before the rest.
    if (tc1.status === 'error' && tc2.status !== 'error') return -1;
    if (tc1.status !== 'error' && tc2.status === 'error') return 1;
    // Remaining tests order by default beaker task ordering.
    return 0; // keep original order of tc1 and tc2
}

export interface TestSuiteDisplayProps {
    suite: TestSuite;
}

export const TestSuiteDisplay: React.FC<TestSuiteDisplayProps> = (props) => {
    const { suite } = props;
    const initialToggleState = _.pickBy(
        DEFAULT_TOGGLE_STATE,
        (_value, key) => Number(suite.count[key as TestSuiteStatus]) > 0,
    );
    const [toggleState, setToggleState] =
        useState<ToggleStateType>(initialToggleState);

    if (_.isEmpty(suite.tests)) {
        return <NoDetailedResults />;
    }

    const onToggle = (outcome: TestSuiteStatus, isChecked: boolean) => {
        setToggleState({ ...toggleState, [outcome]: !isChecked });
    };

    const checkboxes = _.map(
        toggleState,
        (isChecked: boolean, outcome: TestSuiteStatus) => {
            if (_.isNil(isChecked)) return <></>;
            const label = (
                <>
                    <TestStatusIcon status={outcome} /> {suite.count[outcome]}
                </>
            );
            return (
                <Checkbox
                    aria-label={`Toggle display of results in status ${outcome}`}
                    id={`check-${outcome}-${suite._uuid}`}
                    isChecked={isChecked}
                    label={label}
                    name={outcome}
                    onChange={() => onToggle(outcome, isChecked)}
                />
            );
        },
    );

    const filteredCases = suite.tests
        .filter((test) => toggleState[test.status])
        .sort(compareTestCases);

    return (
        <>
            <Flex className="pf-v5-u-ml-lg pf-v5-u-mb-md">{checkboxes}</Flex>

            {_.isEmpty(filteredCases) && (
                <Alert isInline title="No test cases selected" variant="info" />
            )}
            <DataList aria-label="Test suite items" isCompact>
                {filteredCases.map((test, index) => (
                    <TestCaseItem key={index} test={test} />
                ))}
            </DataList>
        </>
    );
};
