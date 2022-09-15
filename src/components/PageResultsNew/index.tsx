/*
 * This file is part of ciboard
 *
 * Copyright (c) 2022 Matěj Grabovský <mgrabovs@redhat.com>
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
import {
    Card,
    Flex,
    PageSection,
    PageSectionVariants,
    Stack,
    StackItem,
} from '@patternfly/react-core';
import { useState } from 'react';

import { config } from '../../config';
import { PageCommon } from '../PageCommon';

import './index.css';
import { CiTest } from './types';
import { SelectedTestContext } from './contexts';
import { FAKE_TESTS } from './fakeData';
import { BackButton, SummaryHeader } from './Header';
import { TestResultsTable } from './TestResultsTable';
import { BuildMetadata } from './BuildMetadata';
import { DetailsDrawer } from './DetailsDrawer';

export function PageResultsNew(_props: {}) {
    const [selectedTest, setSelectedTest] = useState<CiTest | undefined>();

    const pageTitle = `New test results | ${config.defaultTitle}`;

    const buildNvr = 'ansible-collection-microsoft-sql-1.2.4-1.el9';
    const buildOwner = 'mgrabovs';

    // TODO: Use unique key later on.
    const onTestSelect = (name: string | undefined) => {
        if (name) {
            if (name === selectedTest?.name) setSelectedTest(undefined);
            else
                setSelectedTest(
                    _.find(FAKE_TESTS, (test) => test.name === name),
                );
        } else setSelectedTest(undefined);
    };

    return (
        <PageCommon title={pageTitle}>
            <SelectedTestContext.Provider value={selectedTest}>
                <DetailsDrawer onClose={() => setSelectedTest(undefined)}>
                    <PageSection variant={PageSectionVariants.light}>
                        <Stack className="resultsNarrower">
                            <StackItem>
                                <BackButton />
                            </StackItem>
                            <StackItem>
                                <SummaryHeader
                                    gatingStatus="fail"
                                    gatingTag="rhel-8.7.0-build-sidetag-101738-stack-gate"
                                    nvr={buildNvr}
                                    owner={buildOwner}
                                />
                            </StackItem>
                        </Stack>
                    </PageSection>
                    <PageSection isFilled variant={PageSectionVariants.default}>
                        <Flex
                            className="resultsNarrower"
                            direction={{ default: 'column' }}
                        >
                            <Card>
                                <BuildMetadata />
                            </Card>
                            <Card>
                                <TestResultsTable
                                    onSelect={onTestSelect}
                                    tests={FAKE_TESTS}
                                />
                            </Card>
                        </Flex>
                    </PageSection>
                </DetailsDrawer>
            </SelectedTestContext.Provider>
        </PageCommon>
    );
}
