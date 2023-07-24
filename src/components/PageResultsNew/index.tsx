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
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Bullseye,
    Card,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    Flex,
    PageSection,
    PageSectionVariants,
    Spinner,
    Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useQuery } from '@apollo/client';

import './index.css';
import {
    ArtifactsCompleteQuery,
    ArtifactsCompleteQueryData,
} from '../../queries/Artifacts';
import { config } from '../../config';
import { CiTest } from './types';
import { SelectedTestContext } from './contexts';
import { TestResultsTable } from './TestResultsTable';
import { BuildInfo } from './BuildInfo';
import { DetailsDrawer } from './DetailsDrawer';
import { ArtifactHeader } from './Header';
import { PageCommon, ToastAlertGroup } from '../PageCommon';
import { WaiveModal } from '../WaiveForm';
import { extractTests } from './artifactTests';
import { getArtifactName } from '../../utils/artifactUtils';

type PageResultsNewParams = 'search' | 'type' | 'value';

export function PageResultsNew(_props: {}) {
    const [selectedTestName, setSelectedTestName] = useState<string>();
    const params = useParams<PageResultsNewParams>();
    // Docs: https://reactrouter.com/en/main/hooks/use-search-params
    const [searchParams, setSearchParams] = useSearchParams();

    let tests: CiTest[] = [];
    const findTestByName = (name?: string) => {
        if (!name) return;
        return _.find(tests, (test) => test.name === name);
    };

    /*
     * Change currently selected test whenever the `?focus` URL parameter
     * changes. This can happend when user clicks the back button, for instance.
     */
    useEffect(() => {
        if (searchParams.has('focus')) {
            // NOTE: We know that `.get()` must return non-null since `.has()` is true.
            setSelectedTestName(searchParams.get('focus')!);
        } else {
            setSelectedTestName(undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    let pageTitle = `Artifact search results | ${config.defaultTitle}`;

    const fieldName = params.search || '';
    const fieldPath = fieldName === 'aid' ? fieldName : `payload.${fieldName}`;
    const fieldValues = params.value?.split(',') || [];
    const atype = params.type || '';

    const { data, error, loading } = useQuery<ArtifactsCompleteQueryData>(
        ArtifactsCompleteQuery,
        {
            variables: {
                atype,
                dbFieldName1: fieldPath,
                dbFieldValues1: fieldValues,
                // TODO: Allow for more than one.
                limit: 1,
            },
            errorPolicy: 'all',
            fetchPolicy: 'cache-first',
        },
    );

    // TODO: Multiple results state.

    const artifact = data?.artifacts?.artifacts?.[0];
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

    if (!haveData) {
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
                            {error && (
                                <EmptyStateBody>
                                    Error: {error.toString()}
                                </EmptyStateBody>
                            )}
                        </EmptyState>
                    </Bullseye>
                </PageSection>
            </PageCommon>
        );
    }

    // Construct a specific title for the single-artifact case.
    pageTitle = `${getArtifactName(artifact)} | ${config.defaultTitle}`;
    if (artifact.greenwave_decision?.summary) {
        if (artifact.greenwave_decision.policies_satisfied)
            pageTitle = `✅ ${pageTitle}`;
        else pageTitle = `❌ ${pageTitle}`;
    }

    tests = extractTests(artifact);

    const selectedTest = findTestByName(selectedTestName);

    const onTestSelect = (name: string | undefined) => {
        if (name && name !== selectedTestName) {
            setSelectedTestName(name);
            setSearchParams({ focus: name });
        } else {
            setSelectedTestName(undefined);
            setSearchParams({});
        }
    };

    return (
        <PageCommon title={pageTitle}>
            <SelectedTestContext.Provider value={selectedTest}>
                <DetailsDrawer
                    artifact={artifact}
                    onClose={() => onTestSelect(undefined)}
                >
                    <PageSection variant={PageSectionVariants.light}>
                        <ArtifactHeader artifact={artifact} />
                    </PageSection>
                    <PageSection isFilled>
                        <Flex
                            className="resultsNarrower"
                            direction={{ default: 'column' }}
                        >
                            <Card>
                                <BuildInfo artifact={artifact} />
                            </Card>
                            <Card>
                                <TestResultsTable
                                    artifact={artifact}
                                    onSelect={onTestSelect}
                                    tests={tests}
                                />
                            </Card>
                        </Flex>
                    </PageSection>
                </DetailsDrawer>
            </SelectedTestContext.Provider>
            <ToastAlertGroup />
            <WaiveModal />
        </PageCommon>
    );
}
