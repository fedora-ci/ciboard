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
import { Buffer } from 'buffer';
import * as React from 'react';
import pako from 'pako';
import moment from 'moment';
import 'moment-duration-format';
import { useQuery } from '@apollo/client';
import { useState, memo, useEffect } from 'react';
import { xunitParser } from '../utils/xunitParser';
import {
    Flex,
    Text,
    Alert,
    Title,
    Spinner,
    TextContent,
    FlexItem,
    Checkbox,
    DataList,
    DataListItem,
    DataListItemRow,
    DataListCell,
    DataListToggle,
    DataListContent,
    DataListItemCells,
} from '@patternfly/react-core';
import {
    Table,
    cellWidth,
    TableBody,
    TableHeader,
    TableVariant,
    IRow,
} from '@patternfly/react-table';

import { DB } from '../types';
import { renderStatusIcon } from '../utils/artifactUtils';
import { ArtifactsXunitQuery } from '../queries/Artifacts';

type TestCaseType = {
    name: string;
    time: string;
    _uuid: string;
    logs: Array<TestCaseLogsType>;
    status: TestCaseStatusNameType;
    phases: Array<TestCasePhasesType>;
    message: string;
    properties: Array<TestCasePropertiesType>;
    'test-outputs': Array<TestCaseTestOutputsType>;
};

type TestCaseStatusNameType = 'pass' | 'fail' | 'skip' | 'error';

type TestCaseLogsType = { log: Array<TestCaseLogsEntryType> };
type TestCaseLogsEntryType = { $: { name: string; href: string } };

type TestCaseTestOutputsType = {
    'test-output': Array<TestCaseTestOutputsEntryType>;
};
type TestCaseTestOutputsEntryType = {
    $: { result: string; remedy: string; message: string };
};

type TestCasePhasesType = { phase: Array<TestCasePhasesEntryType> };
type TestCasePhasesEntryType = {
    $: { name: string; result: string };
    logs: Array<TestCaseLogsType>;
};

type TestCasePropertiesType = { property: Array<TestCasePropertiesEntryType> };
type TestCasePropertiesEntryType = { $: { name: string; value: string } };

type TestSuitePropertiesType = {
    property: Array<TestSuitePropertiesEntryType>;
};
type TestSuitePropertiesEntryType = { $: { name: string; value: string } };

type TestSuiteType = {
    name: string;
    time: string;
    tests: Array<TestCaseType>;
    status: string;
    properties: Array<TestSuitePropertiesType>;
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
    xunit: Array<TestSuiteType>;
}

const Testsuites: React.FC<TestsuitesProps> = (props) => {
    const { xunit } = props;
    const testsuites = [];
    if (xunit.length === 0) {
        testsuites.push(<p>Error: unable to parse xunit, seems invalid.</p>);
    }
    for (const suite of xunit) {
        testsuites.push(
            <div key={suite.name}>
                <TextContent>
                    <Title headingLevel="h4" size="lg">
                        {suite.name}
                    </Title>
                    <p />
                </TextContent>
                <Testsuite suite={suite} />
            </div>,
        );
    }
    return <>{testsuites}</>;
};

const getProperty = (
    properties: Array<TestCasePropertiesType | TestSuitePropertiesType>,
    propertyName: string,
) => {
    if (!properties) return null;
    for (const property of properties[0].property) {
        if (property.$.name === propertyName) return property.$.value;
    }
    return null;
};

const mkLogName = (log: TestCaseLogsEntryType): IRow => {
    return {
        cells: [
            <>
                <a href={log.$.href} target="_blank" rel="noopener noreferrer">
                    {log.$.name}
                </a>
            </>,
        ],
    };
};

interface TestCaseLogsProps {
    logs: Array<TestCaseLogsType>;
}

const TestCaseLogs: React.FC<TestCaseLogsProps> = (props) => {
    const { logs } = props;
    if (!logs || !logs[0].log) {
        return null;
    }
    const all_logs = logs[0].log;
    const rows: Array<IRow> = [];
    _.map(all_logs, (log) => rows.push(mkLogName(log)));
    return (
        <Table
            aria-label="Test logs"
            variant={TableVariant.compact}
            borders={false}
            sortBy={{}}
            cells={[{ title: 'Logs' }]}
            rows={rows}
        >
            <TableHeader />
            <TableBody />
        </Table>
    );
};

const mkLogsLinks = (logs: Array<TestCaseLogsType>): JSX.Element => {
    /** logs[0].log - [log1, log2, log3] */
    if (!logs[0] || !logs[0].log) {
        return <></>;
    }
    const links: Array<JSX.Element> = [];
    _.map(logs[0].log, (l) =>
        links.push(
            <a
                key={l.$.name}
                href={l.$.href}
                target="_blank"
                rel="noopener noreferrer"
            >
                {l.$.name}
            </a>,
        ),
    );
    return <>{links}</>;
};

const mkPhase = (phase: TestCasePhasesEntryType): IRow => {
    return {
        cells: [
            <>{renderStatusIcon(phase.$.result)}</>,
            <>{phase.$.name}</>,
            <>{mkLogsLinks(phase.logs)}</>,
        ],
    };
};

interface TestCasePhasesProps {
    phases: Array<TestCasePhasesType>;
}

const TestCasePhases: React.FC<TestCasePhasesProps> = (props) => {
    const { phases } = props;
    if (!phases || !phases[0].phase) {
        return null;
    }
    const all_phases = phases[0].phase;
    const rows: Array<IRow> = [];
    _.map(all_phases, (phase) => rows.push(mkPhase(phase)));
    return (
        <Table
            aria-label="Test phases"
            variant={TableVariant.compact}
            borders={false}
            sortBy={{}}
            cells={[
                { title: '', transforms: [cellWidth(10)] },
                { title: 'Phases', transforms: [cellWidth(50)] },
                { title: 'Links' },
            ]}
            rows={rows}
        >
            <TableHeader />
            <TableBody />
        </Table>
    );
};

const mkTestOutput = (output: TestCaseTestOutputsEntryType): IRow => {
    /** $.message / $.remedy / $.result */
    return {
        cells: [
            <>{output.$.result}</>,
            <>{output.$.message}</>,
            <>{output.$.remedy}</>,
        ],
    };
};

interface TestCaseOutputProps {
    outputs: Array<TestCaseTestOutputsType>;
}
const TestCaseOutput: React.FC<TestCaseOutputProps> = (props) => {
    const { outputs } = props;
    if (!outputs || !outputs[0]['test-output']) {
        return null;
    }
    const all_outputs = outputs[0]['test-output'];
    const rows: Array<IRow> = [];
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

function mkProperties(property: TestCasePropertiesEntryType) {
    /** property == [{}, {}, {}, {}] == [{$: {name: xxx, value: yyy}}] */
    return {
        cells: [
            <Text>{property.$.name}</Text>,
            <Text>{property.$.value}</Text>,
        ],
    };
}

interface TestCasePropertiesProps {
    properties: Array<TestCasePropertiesType>;
}

const TestCaseProperties: React.FC<TestCasePropertiesProps> = (props) => {
    const { properties } = props;
    if (!properties || !properties[0].property) {
        return null;
    }
    const all_properties = properties[0].property;
    const rows: Array<IRow> = [];
    _.map(all_properties, (p) => rows.push(mkProperties(p)));
    return (
        <Table
            aria-label="Properties"
            variant={TableVariant.compact}
            borders={false}
            sortBy={{}}
            cells={[
                { title: 'Property', transforms: [cellWidth(20)] },
                { title: 'Value' },
            ]}
            rows={rows}
        >
            <TableHeader />
            <TableBody />
        </Table>
    );
};

interface TestCaseContentProps {
    test: TestCaseType;
}

const TestCaseContent: React.FC<TestCaseContentProps> = (props) => {
    const { test } = props;
    return (
        <>
            <TestCaseOutput outputs={test['test-outputs']} />
            <TestCaseLogs logs={test.logs} />
            <TestCasePhases phases={test.phases} />
            <TestCaseProperties properties={test.properties} />
        </>
    );
};

interface TestCaseProps {
    test: TestCaseType;
}

const TestCase: React.FC<TestCaseProps> = (props) => {
    const { test } = props;
    const [expanded, setExpanded] = useState(false);
    let version = getProperty(test.properties, 'baseosci.beaker-version');
    let time = test.time
        ? moment
              .duration(parseInt(test.time, 10), 'seconds')
              .format('hh:mm:ss', { trim: false })
        : '';

    const toggle = () => {
        setExpanded(!expanded);
    };

    return (
        <div className={expanded ? '' : 'issue_2177'}>
            <DataListItem isExpanded={expanded}>
                <DataListItemRow>
                    <DataListToggle
                        onClick={toggle}
                        isExpanded={expanded}
                        id={test._uuid}
                    />
                    <DataListItemCells
                        dataListCells={[
                            <DataListCell isIcon key="icon">
                                {renderStatusIcon(test.status)}
                            </DataListCell>,
                            <DataListCell key="test-name">
                                {test.name}
                            </DataListCell>,
                            <DataListCell key="version">
                                {version}
                            </DataListCell>,
                            <DataListCell key="duration">{time}</DataListCell>,
                        ]}
                    />
                </DataListItemRow>
                <DataListContent
                    aria-label="Test case content"
                    id={test._uuid}
                    isHidden={!expanded}
                >
                    <TestCaseContent test={test} />
                </DataListContent>
            </DataListItem>
        </div>
    );
};

interface TestsuiteProps {
    suite: TestSuiteType;
}

type ToggleStateType = {
    [key in TestSuiteCountNamesType]?: boolean;
};

const default_toggle_state: ToggleStateType = {
    fail: true,
    skip: true,
    pass: false,
    error: true,
};

const Testsuite: React.FC<TestsuiteProps> = (props) => {
    const { suite } = props;

    const initialToggleState = _.pickBy(
        default_toggle_state,
        (_value, key) =>
            _.toNumber(suite.count[key as TestSuiteCountNamesType]) > 0,
    ) as ToggleStateType;

    const [toggleState, setToggleState] =
        useState<ToggleStateType>(initialToggleState);

    const toggle = (outcome: TestSuiteCountNamesType, isChecked: boolean) => {
        setToggleState({ ...toggleState, [outcome]: !isChecked });
    };

    if (!suite.tests || suite.tests.length === 0) {
        return (
            <Alert isInline type="warning" title="No xunit">
                Test does net provide detailed results via xunit. Please go to
                the CI system log and investigate the produced test artifacts.
            </Alert>
        );
    }
    return (
        <>
            <Flex>
                {_.map(toggleState, (isChecked, test_case_status_name_) => {
                    const test_case_status_name =
                        test_case_status_name_ as TestSuiteCountNamesType;
                    if (_.isNil(isChecked)) return <></>;
                    return (
                        <FlexItem>
                            <Checkbox
                                label={
                                    <span>
                                        {renderStatusIcon(
                                            test_case_status_name,
                                        )}{' '}
                                        {suite.count[test_case_status_name]}
                                    </span>
                                }
                                isChecked={_.isBoolean(isChecked) && isChecked}
                                onChange={() =>
                                    toggle(test_case_status_name, isChecked)
                                }
                                aria-label={`checkbox ${test_case_status_name}`}
                                id={`check-${test_case_status_name}-XXX-{test._uuid}`}
                                name={`${test_case_status_name}`}
                            />
                        </FlexItem>
                    );
                })}
            </Flex>
            <p />

            <DataList aria-label="Test suite items" isCompact>
                {_.map(suite.tests, (test) => {
                    if (toggleState[test.status]) {
                        return <TestCase test={test} />;
                    }
                })}
            </DataList>
        </>
    );
};

const NoXunit = () => {
    return (
        <Alert
            isInline
            type="info"
            className="margin-top-20"
            title="No results in xunit"
        >
            Test does not provide detailed results via xunit. Please go to the
            log and investigate the produced test artifacts.
        </Alert>
    );
};

interface TestSuitesProps {
    state: DB.StateType;
    artifact: DB.ArtifactType;
}
const TestSuites_: React.FC<TestSuitesProps> = (props) => {
    const { state, artifact } = props;
    const { kai_state } = state;
    const { msg_id } = kai_state;
    const [xunit, setXunit] = useState<string>();
    const [xunitProcessed, setXunitProcessed] = useState(false);
    /** why do we need msgError? */
    const [msgError, setError] = useState<JSX.Element>();
    const { loading, error, data } = useQuery(ArtifactsXunitQuery, {
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
        _.has(data, 'db_artifacts.artifacts[0].states');
    const haveErrorNoData = !loading && error && !haveData;
    useEffect(() => {
        if (!haveData) {
            return;
        }
        const state = _.find(
            /** this is a bit strange, that received data doesn't propage to original
             * artifact object. Original artifact.states objects stays old */
            _.get(data, 'db_artifacts.artifacts[0].states'),
            (state) => state.kai_state?.msg_id === msg_id,
        );
        if (_.isNil(state)) return;
        const xunitRaw = _.get(state, 'broker_msg_xunit');
        if (_.isEmpty(xunitRaw)) {
            setXunitProcessed(true);
            return;
        }
        try {
            const encodedRawData = Buffer.from(xunitRaw, 'base64');
            /** Decode base64 encoded gzipped data */
            const decodedRawData = pako.inflate(encodedRawData);
            const xunitUtf8Encoded =
                Buffer.from(decodedRawData).toString('utf8');
            setXunit(xunitUtf8Encoded);
        } catch (err) {
            const error = (
                <Alert isInline title="Xunit error">
                    Could not parse xunit: {err}
                </Alert>
            );
            setError(error);
        }
        setXunitProcessed(true);
    }, [data, msg_id, haveData, artifact.states]);
    const inflating = data && !xunitProcessed;
    if (loading || inflating) {
        const text = loading ? 'Fetching xunit' : 'Inflating';
        return (
            <>
                <Spinner size="md" />
                {text}
            </>
        );
    }
    if (msgError) return <>{msgError}</>;
    if (_.isEmpty(xunit)) {
        return null;
    }
    const parsedXunit = xunitParser(xunit);
    if (_.isEmpty(parsedXunit)) {
        return <NoXunit />;
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
    return <Testsuites xunit={parsedXunit} />;
};

const TestSuites = memo(
    TestSuites_,
    ({ state: state_prev }, { state: state_next }) =>
        _.isEqual(state_prev, state_next),
);

export default TestSuites;
