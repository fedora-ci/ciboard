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
import pako from 'pako';
import React, { memo, useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import classNames from 'classnames';
import { useQuery } from '@apollo/client';
import 'moment-duration-format';
import {
    Alert,
    Flex,
    Label,
    Title,
    Spinner,
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
import {
    IRow,
    Table,
    cellWidth,
    TableBody,
    TableHeader,
    TableVariant,
} from '@patternfly/react-table';
import { MicrochipIcon, OutlinedClockIcon } from '@patternfly/react-icons';

import {
    Artifact,
    ChildTestMsg,
    getAType,
    getArtifactId,
    getMsgId,
} from '../types';
import { xunitParser } from '../utils/xunitParser';
import { mkSeparatedList } from '../utils/artifactsTable';
import { ArtifactsXunitQuery } from '../queries/Artifacts';
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

interface TestSuitesInternalProps {
    xunit: TestSuite[];
}

const TestSuitesInternal: React.FC<TestSuitesInternalProps> = (props) => {
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
    const testSuites = _.map(xunit, (suite) => (
        <Flex direction={{ default: 'column' }} key={suite._uuid}>
            <Title headingLevel="h4">{suite.name}</Title>
            <TestSuiteDisplay suite={suite} />
        </Flex>
    ));
    return <>{testSuites}</>;
};

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
            icon={<MicrochipIcon className="pf-u-color-200" />}
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
        'pf-u-text-nowrap',
        'pf-u-font-weight-bold',
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
                            className="pf-u-color-200"
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
            <Flex className="pf-u-ml-lg pf-u-mb-md">{checkboxes}</Flex>

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

interface TestSuitesProps {
    aChild: ChildTestMsg;
    artifact: Artifact;
}

const TestSuites_: React.FC<TestSuitesProps> = (props) => {
    const { aChild, artifact } = props;
    const msgId = getMsgId(aChild);
    const [xunit, setXunit] = useState<string>('');
    const [xunitProcessed, setXunitProcessed] = useState(false);
    /** why do we need msgError? */
    const [msgError, setError] = useState<JSX.Element>();
    const aType = getAType(artifact);
    const aId = getArtifactId(artifact);
    const { loading, data } = useQuery(ArtifactsXunitQuery, {
        variables: {
            atype: aType,
            dbFieldName1: 'aid',
            dbFieldValues1: [aId],
            msg_id: msgId,
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
            (aChild) => {
                const msgId_ = getMsgId(aChild);
                return msgId_ === msgId;
            },
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
    }, [data, msgId, haveData, artifact.children]);
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
    let parsedXunit;
    try {
        parsedXunit = xunitParser(xunit);
        if (_.isEmpty(parsedXunit)) {
            return <NoDetailedResults />;
        }
    } catch (err) {
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
    ({ aChild: state_prev }, { aChild: state_next }) =>
        _.isEqual(state_prev, state_next),
);
