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
    Bullseye,
    Card,
    EmptyState,
    EmptyStateIcon,
    Flex,
    PageSection,
    PageSectionVariants,
    Spinner,
    Title,
} from '@patternfly/react-core';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { config } from '../../config';
import { PageCommon } from '../PageCommon';
import { isArtifactRPM } from '../../artifact';

import './index.css';
import { CiTest } from './types';
import { SelectedTestContext } from './contexts';
import { FAKE_TESTS } from './fakeData';
import { TestResultsTable } from './TestResultsTable';
import { BuildInfo } from './BuildInfo';
import { DetailsDrawer } from './DetailsDrawer';
import { ArtifactHeader } from './Header';
import { useQuery } from '@apollo/client';
import {
    ArtifactsCompleteQuery,
    ArtifactsCompleteQueryData,
} from '../../queries/Artifacts';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

interface PageResultsNewParams {
    aid?: string;
}

export function PageResultsNew(_props: {}) {
    const [selectedTest, setSelectedTest] = useState<CiTest | undefined>();
    const params = useParams<PageResultsNewParams>();

    const pageTitle = `🚧 New test results | ${config.defaultTitle}`;

    const aid = params.aid || '47942709';

    const { data, error, loading } = useQuery<ArtifactsCompleteQueryData>(
        ArtifactsCompleteQuery,
        {
            variables: {
                atype: 'brew-build',
                dbFieldName1: 'aid',
                dbFieldValues1: [aid],
                limit: 1,
            },
            errorPolicy: 'all',
            fetchPolicy: 'cache-first',
        },
    );

    // TODO: Loading state.
    // TODO: Error state.
    // TODO: Multiple results state?

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

    const artifact = data?.artifacts.artifacts?.[0];
    const haveData = !_.isNil(artifact) && !error && !loading;

    if (loading) {
        return (
            <PageCommon title={pageTitle}>
                <PageSection isFilled>
                    <Bullseye>
                        <EmptyState>
                            <EmptyStateIcon
                                variant="container"
                                component={Spinner}
                            />
                            <Title headingLevel="h2" size="lg">
                                Loading artifact…
                            </Title>
                        </EmptyState>
                    </Bullseye>
                </PageSection>
            </PageCommon>
        );
    }

    if (!haveData || !isArtifactRPM(artifact)) {
        return (
            <PageCommon title={pageTitle}>
                <PageSection isFilled>
                    <Bullseye>
                        <EmptyState>
                            <EmptyStateIcon
                                className="pf-u-danger-color-100"
                                icon={ExclamationCircleIcon}
                            />
                            <Title headingLevel="h2" size="lg">
                                Failed to load artifact
                            </Title>
                        </EmptyState>
                    </Bullseye>
                </PageSection>
            </PageCommon>
        );
    }

    return (
        <PageCommon title={pageTitle}>
            <SelectedTestContext.Provider value={selectedTest}>
                <DetailsDrawer onClose={() => setSelectedTest(undefined)}>
                    <PageSection variant={PageSectionVariants.light}>
                        <ArtifactHeader
                            artifact={artifact}
                            gatingStatus="fail"
                            gatingTag={artifact.payload.gate_tag_name}
                            nvr={artifact.payload.nvr}
                            owner={artifact.payload.issuer}
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
