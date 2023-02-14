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
} from '@patternfly/react-core';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { config } from '../../config';
import { PageCommon } from '../PageCommon';
import { ArtifactRPM } from '../../artifact';

import './index.css';
import { CiTest } from './types';
import { SelectedTestContext } from './contexts';
import { FAKE_TESTS } from './fakeData';
import { TestResultsTable } from './TestResultsTable';
import { BuildInfo } from './BuildInfo';
import { DetailsDrawer } from './DetailsDrawer';
import { ArtifactHeader } from './Header';

interface PageResultsNewParams {
    task_id?: string;
}

export function PageResultsNew(_props: {}) {
    const [selectedTest, setSelectedTest] = useState<CiTest | undefined>();
    const params = useParams<PageResultsNewParams>();

    const pageTitle = `🚧 New test results | ${config.defaultTitle}`;

    // TODO: Display real data.
    const buildNvr = 'ansible-collection-microsoft-sql-1.2.4-1.el9';
    const buildOwner = 'mgrabovs';
    const gatingTag = 'rhel-8.7.0-build-sidetag-101738-stack-gate';
    const taskId = params.task_id ? Number(params.task_id) : 47942709;
    const artifact: ArtifactRPM = {
        _id: 'dummy',
        _updated: 'dummy',
        _version: 'dummy',
        aid: taskId.toString(),
        resultsdb_testscase: [],
        states: [],
        type: 'brew-build',
        payload: {
            build_id: 2181999,
            component: 'ansible-collection-microsoft-sql',
            gate_tag_name: gatingTag,
            issuer: 'mgrabovs',
            nvr: buildNvr,
            source: 'https://example.com/git/0432ca7d',
            scratch: false,
            task_id: taskId,
        },
    };

    /*
     * TODO: Load build info and test results if `taskId` is specified.
     * - build info: ArtifactsDetailedInfoKojiTask for RPMs,
     *               ArtifactsDetailedInfoModuleBuild for modules
     * - list of artifacts: ArtifactsCompleteQuery
     * For details, see `PageByMongoField`.
     */

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
                        <ArtifactHeader
                            gatingStatus="fail"
                            gatingTag={gatingTag}
                            nvr={buildNvr}
                            owner={buildOwner}
                            taskId={taskId}
                        />
                    </PageSection>
                    <PageSection isFilled variant={PageSectionVariants.default}>
                        <Flex
                            className="resultsNarrower"
                            direction={{ default: 'column' }}
                        >
                            <Card>
                                <BuildInfo artifact={artifact} />
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
