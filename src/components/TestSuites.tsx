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
import pako from 'pako';
import moment from 'moment';
import { Buffer } from 'buffer';
import 'moment-duration-format';
import { useQuery } from '@apollo/client';
import { useState, memo, useEffect } from 'react';
import {
    Alert,
    Checkbox,
    DataList,
    DataListCell,
    DataListContent,
    DataListItem,
    DataListItemCells,
    DataListItemRow,
    DataListToggle,
    Flex,
    FlexItem,
    Spinner,
    Title,
} from '@patternfly/react-core';
import {
    IRow,
    Table,
    TableBody,
    TableHeader,
    TableVariant,
    cellWidth,
} from '@patternfly/react-table';
import { OutlinedClockIcon } from '@patternfly/react-icons';
import classNames from 'classnames';

import { Artifact, StateKaiType } from '../artifact';
import { mapTypeToIconsProps, renderStatusIcon } from '../utils/artifactUtils';
import { ArtifactsXunitQuery } from '../queries/Artifacts';
import { mkSeparatedList } from '../utils/artifactsTable';
import { xunitParser } from '../utils/xunitParser';
import styles from '../custom.module.css';

interface TestCaseType {
    _uuid: string;
    name: string;
    time: string;
    logs: TestCaseLogsType[];
    status: TestCaseStatusNameType;
    phases: TestCasePhasesType[];
    message: string;
    properties: TestCasePropertiesType[];
    'test-outputs': TestCaseTestOutputsType[];
}

type TestCaseStatusNameType = 'error' | 'fail' | 'pass' | 'skip';

interface TestCaseLogsEntryType {
    $: { name: string; href: string };
}
interface TestCaseLogsType {
    log: TestCaseLogsEntryType[];
}

interface TestCaseTestOutputsType {
    'test-output': TestCaseTestOutputsEntryType[];
}

interface TestCaseTestOutputsEntryType {
    $: { message: string; remedy: string; result: string };
}

interface TestCasePhasesEntryType {
    $: { name: string; result: string };
    logs: TestCaseLogsType[];
}

interface TestCasePhasesType {
    phase: TestCasePhasesEntryType[];
}

type TestCasePropertiesType = { property: TestCasePropertiesEntryType[] };
type TestCasePropertiesEntryType = { $: { name: string; value: string } };

type TestSuitePropertiesType = {
    property: TestSuitePropertiesEntryType[];
};
type TestSuitePropertiesEntryType = { $: { name: string; value: string } };

type TestSuiteType = {
    _uuid: string;
    name: string;
    time?: string;
    tests: TestCaseType[];
    status: string;
    properties: TestSuitePropertiesType[];
    /** Number of test cases with each of the possible statuses. */
    count: {
        pass?: number;
        fail?: number;
        skip?: number;
        error?: number;
        tests?: number;
    };
};

type TestSuiteCountType = TestSuiteType['count'];
type TestSuiteCountNamesType = keyof TestSuiteCountType;

interface TestsuitesProps {
    xunit: TestSuiteType[];
}

const TestSuitesInternal: React.FC<TestsuitesProps> = (props) => {
    const { xunit } = props;
    if (_.isEmpty(xunit)) {
        return (
            <Alert
                isInline
                isPlain
                key="error"
                title="Could not parse detialed results"
                variant="danger"
            >
                We were unable to parse the detailed test results as provided by
                the CI system.
            </Alert>
        );
    }
    const testSuites = xunit.map((suite) => (
        <Flex direction={{ default: 'column' }} key={suite._uuid}>
            <Title headingLevel="h4">{suite.name}</Title>
            <TestSuite suite={suite} />
        </Flex>
    ));
    return <>{testSuites}</>;
};

const mkLogLink = (log: TestCaseLogsEntryType): JSX.Element => (
    <a
        href={log.$.href}
        key={log.$.name}
        rel="noopener noreferrer"
        target="_blank"
    >
        {log.$.name}
    </a>
);

interface TestCaseLogsProps {
    logs: TestCaseLogsType[];
}

const TestCaseLogs: React.FC<TestCaseLogsProps> = ({ logs }) => {
    if (!logs || _.isEmpty(logs[0].log)) return null;
    const logsLinks = mkSeparatedList(mkLogsLinks(logs));
    return <p>Log files: {logsLinks}</p>;
};

const mkLogsLinks = (logs: TestCaseLogsType[]): JSX.Element[] => {
    /** logs[0].log - [log1, log2, log3] */
    if (!logs[0] || _.isEmpty(logs[0].log)) return [];
    return logs[0].log.map((log) => mkLogLink(log));
};

const mkPhase = (phase: TestCasePhasesEntryType): IRow => {
    return {
        cells: [
            renderStatusIcon(phase.$.result),
            phase.$.name,
            mkSeparatedList(mkLogsLinks(phase.logs)),
        ],
        key: phase.$.name,
    };
};

interface TestCasePhasesProps {
    phases: TestCasePhasesType[];
}

const TestCasePhases: React.FC<TestCasePhasesProps> = ({ phases }) => {
    if (!phases || _.isEmpty(phases[0].phase)) return null;
    const rows: IRow[] = phases[0].phase.map((phase) => mkPhase(phase));
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

const mkTestOutput = (output: TestCaseTestOutputsEntryType): IRow => ({
    cells: [
        <>{output.$.result}</>,
        <>{output.$.message}</>,
        <>{output.$.remedy}</>,
    ],
});

interface TestCaseOutputProps {
    outputs: TestCaseTestOutputsType[];
}

const TestCaseOutput: React.FC<TestCaseOutputProps> = (props) => {
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

function hasTestCaseContent(testCase: TestCaseType): boolean {
    return (
        !_.isEmpty(_.get(testCase, 'phases[0].phase')) ||
        !_.isEmpty(_.get(testCase, 'outputs[0][test-output]'))
    );
}

interface TestCaseContentProps {
    test: TestCaseType;
}

const TestCaseContent: React.FC<TestCaseContentProps> = (props) => {
    const { test } = props;
    return (
        <>
            <TestCaseOutput outputs={test['test-outputs']} />
            <TestCasePhases phases={test.phases} />
        </>
    );
};

interface TestCaseProps {
    test: TestCaseType;
}

const TestCase: React.FC<TestCaseProps> = (props) => {
    const { test } = props;
    const [expanded, setExpanded] = useState(false);
    const time = test.time
        ? moment
              .duration(Number(test.time), 'seconds')
              .format('hh:mm:ss', { trim: false })
        : null;

    const toggle = () => {
        setExpanded(!expanded);
    };

    const hasContent = hasTestCaseContent(test);
    const iconProps = mapTypeToIconsProps(test.status);
    const nameClassName = classNames(
        'pf-u-text-nowrap',
        'pf-u-font-weight-bold',
        iconProps ? iconProps.className : '',
    );

    const summaryCell: React.ReactNode = (
        <DataListCell key="summary">
            <Flex
                direction={{ default: 'column' }}
                grow={{ default: 'grow' }}
                key="primary content"
                spaceItems={{ default: 'spaceItemsSm' }}
            >
                <Flex>
                    <FlexItem>{renderStatusIcon(test.status)}</FlexItem>
                    <FlexItem className={nameClassName}>{test.name}</FlexItem>
                    {time && (
                        <FlexItem
                            align={{ default: 'alignRight' }}
                            className="pf-u-color-200"
                            style={{ fontFamily: 'monospace' }}
                        >
                            <OutlinedClockIcon title="Elapsed time" /> {time}
                        </FlexItem>
                    )}
                </Flex>
                <TestCaseLogs logs={test.logs} />
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

interface TestsuiteProps {
    suite: TestSuiteType;
}

type ToggleStateType = Partial<Record<TestSuiteCountNamesType, boolean>>;

const DEFAULT_TOGGLE_STATE: ToggleStateType = {
    fail: true,
    skip: true,
    pass: false,
    error: true,
};

function compareTestCases(tc1: TestCaseType, tc2: TestCaseType) {
    // Failures before everything.
    if (tc1.status === 'fail' && tc2.status !== 'fail') return -1;
    if (tc1.status !== 'fail' && tc2.status === 'fail') return 1;
    // Infra errors before the rest.
    if (tc1.status === 'error' && tc2.status !== 'error') return -1;
    if (tc1.status !== 'error' && tc2.status === 'error') return 1;
    // Compare the remaining tests on time elapsed.
    const time1 = Math.trunc(Number(tc1.time));
    const time2 = Math.trunc(Number(tc2.time));
    // Sort by name if no time was provided or if the times are equal.
    if (isNaN(time1) || isNaN(time2) || time1 === time2) {
        return tc1.name.localeCompare(tc2.name);
    }
    return time2 - time1;
}

const TestSuite: React.FC<TestsuiteProps> = (props) => {
    const { suite } = props;

    const initialToggleState = _.pickBy(
        DEFAULT_TOGGLE_STATE,
        (_value, key) =>
            Number(suite.count[key as TestSuiteCountNamesType]) > 0,
    );
    if (
        !_.values(initialToggleState).some((toggled) => toggled) &&
        !_.isEmpty(initialToggleState)
    ) {
        /* If no items were to be displayed with the default toggle settings,
         * toggle the first state in the list to show cases with that result.
         * For example, it is often useful to show the passed results if no
         * test cases failed.
         */
        const firstKey = Object.keys(
            initialToggleState,
        )[0] as TestSuiteCountNamesType;
        initialToggleState[firstKey] = true;
    }

    const [toggleState, setToggleState] =
        useState<ToggleStateType>(initialToggleState);

    if (_.isEmpty(suite.tests)) {
        return <NoDetailedResults />;
    }

    const onToggle = (outcome: TestSuiteCountNamesType, isChecked: boolean) => {
        setToggleState({ ...toggleState, [outcome]: !isChecked });
    };

    return (
        <>
            <Flex>
                {_.map(
                    toggleState,
                    (isChecked, outcome: TestSuiteCountNamesType) => {
                        if (_.isNil(isChecked)) return <></>;
                        const label = (
                            <>
                                {renderStatusIcon(outcome)}{' '}
                                {suite.count[outcome]}
                            </>
                        );
                        return (
                            <FlexItem key={outcome}>
                                <Checkbox
                                    aria-label={`Toggle display of results in status ${outcome}`}
                                    id={`check-${outcome}-${suite._uuid}`}
                                    isChecked={isChecked}
                                    label={label}
                                    name={outcome}
                                    onChange={() =>
                                        onToggle(outcome, isChecked)
                                    }
                                />
                            </FlexItem>
                        );
                    },
                )}
            </Flex>

            <DataList aria-label="Test suite items" isCompact>
                {suite.tests
                    .filter((test) => toggleState[test.status])
                    .sort(compareTestCases)
                    .map((test, index) => (
                        <TestCase key={index} test={test} />
                    ))}
            </DataList>
        </>
    );
};

interface TestSuitesProps {
    state: StateKaiType;
    artifact: Artifact;
}

const TestSuites_: React.FC<TestSuitesProps> = (props) => {
    const { state, artifact } = props;
    const { kai_state } = state;
    const { msg_id } = kai_state;
    const [xunit, setXunit] = useState<string>('');
    const [xunitProcessed, setXunitProcessed] = useState(false);
    /** why do we need msgError? */
    const [msgError, setError] = useState<JSX.Element>();
    const { loading, data } = useQuery(ArtifactsXunitQuery, {
        variables: {
            msg_id,
            dbFieldName1: 'aid',
            atype: artifact.type,
            dbFieldValues1: [artifact.aid],
        },
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
    });
    /** Even there is an error there could be data */
    const haveData =
        !loading &&
        Boolean(data) &&
        _.has(data, 'artifacts.artifacts[0].states');
    useEffect(() => {
        if (!haveData) return;
        const state = _.find(
            /** this is a bit strange, that received data doesn't propage to original
             * artifact object. Original artifact.states objects stays old */
            _.get(data, 'artifacts.artifacts[0].states'),
            (state) => state.kai_state?.msg_id === msg_id,
        );
        if (_.isNil(state)) return;
        const xunitRaw: string = state.broker_msg_xunit;
        if (_.isEmpty(xunitRaw)) {
            setXunitProcessed(true);
            return;
        }
        try {
            /** Decode base64 encoded gzipped data */
            const compressed = Buffer.from(xunitRaw, 'base64');
            const decompressed = pako.inflate(compressed);
            const utf8Decoded = Buffer.from(decompressed).toString('utf8');
            setXunit(utf8Decoded);
        } catch (err) {
            const error = (
                <Alert isInline isPlain title="Xunit error">
                    Could not parse test results: {err}
                </Alert>
            );
            setError(error);
        }
        setXunitProcessed(true);
    }, [data, msg_id, haveData, artifact.states]);
    const inflating = data && !xunitProcessed;
    if (loading || inflating) {
        const text = loading ? 'Fetching test results…' : 'Inflating…';
        return (
            <Flex className="pf-u-p-sm">
                <FlexItem>
                    <Spinner className="pf-u-mr-sm" size="md" /> {text}
                </FlexItem>
            </Flex>
        );
    }
    if (msgError) return <>{msgError}</>;
    if (_.isEmpty(xunit)) {
        return <NoDetailedResults />;
    }
    const parsedXunit = xunitParser(xunit);
    if (_.isEmpty(parsedXunit)) {
        return <NoDetailedResults />;
    }
    /* TODO XXX: remove / generalize */
    if (
        parsedXunit[0].name === 'rpmdiff-analysis' ||
        parsedXunit[0].name === 'rpmdiff-comparison'
    ) {
        return (
            <div>
                {parsedXunit[0].properties['baseosci.overall-result']} -{' '}
                <a
                    href={parsedXunit[0].properties['baseosci.url.rpmdiff-run']}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    detailed results on RPMdiff Web UI
                </a>
            </div>
        );
    }
    return <TestSuitesInternal xunit={parsedXunit} />;
};

export const TestSuites = memo(
    TestSuites_,
    ({ state: state_prev }, { state: state_next }) =>
        _.isEqual(state_prev, state_next),
);
