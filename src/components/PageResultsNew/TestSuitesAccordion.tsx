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
import { useState } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionToggle,
    Alert,
    Flex,
    FlexItem,
    Label,
    Title,
} from '@patternfly/react-core';
import { MicrochipIcon, OutlinedClockIcon } from '@patternfly/react-icons';
import { TableComposable, Tbody, Td, Tr } from '@patternfly/react-table';
import moment from 'moment';
import update from 'immutability-helper';

import { TestCase, TestSuite } from './types';
import { mkSeparatedList } from '../../utils/artifactsTable';
import { TestStatusIcon } from '../../utils/artifactUtils';

function humanReadableTime(seconds: number) {
    // TODO: Migrate away from the moment library.
    const duration = moment.duration(seconds, 'seconds');
    if (duration.hours() >= 1)
        return duration.format('hh:mm:ss', { trim: false });
    return duration.format('mm:ss', { trim: false });
}

interface ArchitectureLabelProps {
    architecture?: string;
}

const ArchitectureLabel: React.FC<ArchitectureLabelProps> = ({
    architecture,
}) => {
    if (_.isEmpty(architecture)) return null;
    return (
        <Label
            icon={<MicrochipIcon className="pf-u-color-200" />}
            isCompact
            title={`This test was run on the ${architecture} machine architecture`}
        >
            {architecture}
        </Label>
    );
};

interface LogsLinksProps {
    logs: string[];
}

function LogsLinks(props: LogsLinksProps) {
    const { logs } = props;
    return (
        <div className="pf-u-font-size-sm">
            Logs:{' '}
            {mkSeparatedList(logs.map((name) => <a href="#">{name}</a>, ', '))}
        </div>
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
        <TableComposable variant="compact">
            <Tbody>
                {cases.map((testCase) => (
                    // TODO: Use a unique ID here later.
                    <Tr key={testCase.name}>
                        <Td>
                            <Flex flexWrap={{ default: 'nowrap' }}>
                                <FlexItem>
                                    <TestStatusIcon status={testCase.status} />
                                </FlexItem>
                                <Flex
                                    direction={{ default: 'column' }}
                                    grow={{ default: 'grow' }}
                                >
                                    <Title
                                        className="pf-u-mb-0"
                                        headingLevel="h4"
                                    >
                                        {testCase.name}{' '}
                                        <ArchitectureLabel architecture="x86_64" />
                                    </Title>
                                    <Flex>
                                        {testCase.logs?.length && (
                                            <LogsLinks logs={testCase.logs} />
                                        )}
                                        {testCase.time && (
                                            <FlexItem
                                                className="pf-u-ml-auto pf-u-color-200 pf-u-font-size-sm"
                                                style={{
                                                    fontFamily: 'monospace',
                                                }}
                                            >
                                                <OutlinedClockIcon title="Elapsed time" />
                                                &nbsp;
                                                {humanReadableTime(
                                                    testCase.time,
                                                )}
                                            </FlexItem>
                                        )}
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </TableComposable>
    );
}

export interface TestSuitesAccordionProps {
    suites: TestSuite[];
}

export function TestSuitesAccordion(props: TestSuitesAccordionProps) {
    /*
     * TODO: Expand all suites by default?
     * TOOD: Expand suites with failures by default?
     * TODO: Render test cases directly if there is only a single suite?
     * TODO: If only one test suite is present, expand it by default.
     */
    const [expandedIds, setExpandedIds] = useState<
        Partial<Record<string, boolean>>
    >({});
    const { suites } = props;
    if (!suites) return null;

    const onToggle = (name: string): void => {
        const newExpandedIds = update(expandedIds, {
            $toggle: [name],
        });
        setExpandedIds(newExpandedIds);
    };

    return (
        <Accordion>
            {suites.map(({ cases, name }) => (
                // TODO: Use a unique ID here later.
                <AccordionItem key={name}>
                    <AccordionToggle
                        id={name}
                        isExpanded={expandedIds[name]}
                        onClick={() => onToggle(name)}
                    >
                        {name}
                    </AccordionToggle>
                    <AccordionContent isHidden={!expandedIds[name]}>
                        <TestCasesTable cases={cases} />
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}
