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
import { ExclamationCircleIcon, SearchIcon } from '@patternfly/react-icons';
import { useQuery } from '@apollo/client';

import './index.css';
import { Artifact } from '../../artifact';
import {
    ArtifactsCompleteQuery,
    ArtifactsCompleteQueryData,
} from '../../queries/Artifacts';
import { getArtifactName } from '../../utils/artifactUtils';
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
import { ArtifactsListNew } from './ArtifactsListNew';

type PageResultsNewParams = 'search' | 'type' | 'value';

interface SingleArtifactViewProps {
    artifact: Artifact;
}

function SingleArtifactView(props: SingleArtifactViewProps) {
    const { artifact } = props;

    const [selectedTestName, setSelectedTestName] = useState<string>();
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

export function PageResultsNew(_props: {}) {
    const params = useParams<PageResultsNewParams>();

    // Used for pagination in the multi-artifact view.
    const [aidStack, setAidStack] = useState<string[]>([]);
    const aidOffset = _.last(aidStack);
    const currentPage = 1 + aidStack.length;

    const artifactType = params.type || '';
    const fieldName = params.search || '';
    const fieldPath = fieldName === 'aid' ? fieldName : `payload.${fieldName}`;
    const fieldValues = params.value?.split(',') || [];

    let pageTitle = `Artifact search results | ${config.defaultTitle}`;

    const { data, error, loading } = useQuery<ArtifactsCompleteQueryData>(
        ArtifactsCompleteQuery,
        {
            variables: {
                atype: artifactType,
                aid_offset: aidOffset,
                dbFieldName1: fieldPath,
                dbFieldValues1: fieldValues,
            },
            errorPolicy: 'all',
            fetchPolicy: 'cache-first',
        },
    );

    const artifacts = data?.artifacts?.artifacts;
    const haveData = !_.isNil(artifacts) && !error && !loading;

    // Show spinner while the query is loading.
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
                                Loading artifact(s)…
                            </Title>
                        </EmptyState>
                    </Bullseye>
                </PageSection>
            </PageCommon>
        );
    }

    // Show error page if the query failed.
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

    // Show information message if query succeeded but no artifacts were returned.
    if (haveData && _.isEmpty(artifacts)) {
        return (
            <PageCommon title={pageTitle}>
                <PageSection isFilled>
                    <Bullseye>
                        <EmptyState>
                            <EmptyStateIcon icon={SearchIcon} />
                            <Title headingLevel="h2" size="lg">
                                No artifacts found
                            </Title>
                            <EmptyStateBody>
                                No matching artifacts found in database
                            </EmptyStateBody>
                        </EmptyState>
                    </Bullseye>
                </PageSection>
            </PageCommon>
        );
    }

    /*
     * Single-artifact view – show the page with build info, test results table,
     * and drawer with details on test suites, metadata and other information.
     */
    if (fieldName === 'aid' && fieldValues.length === 1) {
        if (artifacts.length !== 1) {
            // There should only ever be one single artifact for a given AID.
            console.error(
                `More than one '${artifactType}' artifacts are associated with ID '${_.first(
                    fieldValues,
                )}'`,
            );
        }

        return (
            <SingleArtifactView
                artifact={artifacts[0]}
                // Re-render the whole component if the artifact ID changes.
                key={artifacts[0].aid}
            />
        );
    }

    /*
     * Multi-artfifact view – show the search results table with the matching
     * artifacts as rows.
     */

    const hasNextPage = data?.artifacts.has_next;

    const onClickNext = () => {
        const lastAid = _.last(artifacts)?.aid;
        // This should not happen, but just to be sure...
        if (!hasNextPage || !lastAid) return;
        const newAidStack = aidStack.slice();
        newAidStack.push(lastAid);
        setAidStack(newAidStack);
    };

    const onClickPrev = () => {
        // This should not happen, but just to be sure...
        if (currentPage <= 1) return;
        const newAidStack = _.dropRight(aidStack, 1);
        setAidStack(newAidStack);
    };

    return (
        <PageCommon title={pageTitle}>
            <PageSection isFilled>
                <ArtifactsListNew
                    artifacts={artifacts}
                    artifactType={artifactType}
                    currentPage={currentPage}
                    hasNextPage={hasNextPage}
                    onClickNext={onClickNext}
                    onClickPrev={onClickPrev}
                />
            </PageSection>
        </PageCommon>
    );
}
