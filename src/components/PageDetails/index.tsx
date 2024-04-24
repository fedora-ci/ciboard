/*
 * This file is part of ciboard
 *
 * Copyright (c) 2022 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Card,
    Flex,
    Spinner,
    Bullseye,
    EmptyState,
    PageSection,
    EmptyStateBody,
    EmptyStateIcon,
    PageSectionVariants,
    EmptyStateHeader,
    EmptyStateFooter,
} from '@patternfly/react-core';
import { useQuery, ApolloError, QueryHookOptions } from '@apollo/client';
import { ExclamationCircleIcon, SearchIcon } from '@patternfly/react-icons';

import './index.css';
import { CiTest } from './types';
import { BuildInfo } from './BuildInfo';
import { WaiveModal } from '../WaiveForm';
import { extractTests } from './artifactTests';
import { DetailsDrawer } from './DetailsDrawer';
import { ArtifactHeader } from './Header';
import { TestResultsTable } from './TestResultsTable';
import { SelectedTestContext } from './contexts';
import { PageCommon, ToastAlertGroup } from '../PageCommon';
import { config } from '../../config';
import { Artifact, getArtifactName } from '../../types';
import {
    ArtifactsCompleteQuery,
    ArtifactsCompleteQueryData,
} from '../../queries/Artifacts';

type PageResultsNewParams = 'artifactId';

const knownIdPrefixesPrio = [
    'brew-build',
    'koji-build-cs',
    'koji-build',
    'productmd-compose',
    'redhat-module',
    'fedora-module',
    'redhat-container-image',
];

const getArtType = (id: string) => {
    return _.find(knownIdPrefixesPrio, (type) => _.startsWith(id, type));
};

const findTestByName = (tests: CiTest[], name?: string) => {
    if (!name) return;
    return _.find(tests, (test) => test.name === name);
};

interface SingleArtifactViewProps {
    artifact: Artifact;
}
function SingleArtifactView(props: SingleArtifactViewProps) {
    const { artifact } = props;
    const [selectedTestName, setSelectedTestName] = useState<string>();
    // Docs: https://reactrouter.com/en/main/hooks/use-search-params
    const [searchParams, setSearchParams] = useSearchParams();
    let tests: CiTest[] = [];

    /*
     * Change currently selected test whenever the `?focus` URL parameter
     * changes. This can happend when user clicks the back button, for instance.
     */
    useEffect(() => {
        if (searchParams.has('focus')) {
            // NOTE: We know that `.get()` must return non-null since `.has()` is true.
            const testCaseName = searchParams.get('focus');
            setSelectedTestName(testCaseName!);
        } else {
            setSelectedTestName(undefined);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Construct a specific title for the single-artifact case.
    let pageTitle = `${getArtifactName(artifact)} | ${config.defaultTitle}`;
    if (artifact.greenwaveDecision?.summary) {
        if (artifact.greenwaveDecision.policies_satisfied)
            pageTitle = `✅ ${pageTitle}`;
        else pageTitle = `❌ ${pageTitle}`;
    }
    tests = extractTests(artifact);
    const selectedTest = findTestByName(tests, selectedTestName);
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

const dataToArtList = (data: any) => {
    const { hits: hits_, hits_info: hitsInfo } = data.artifacts;
    const hits = _.map(
        hits_,
        ({ hit_info, hit_source, greenwaveDecision, children }) => ({
            hit_info,
            children,
            hit_source,
            greenwaveDecision,
        }),
    );
    return { hits: hits as Artifact[], hitsInfo };
};

export function PageDetails(_props: {}) {
    const params = useParams<PageResultsNewParams>();
    const artifactId = params.artifactId || '';
    const artifactType = getArtType(artifactId);
    const artTypes = [artifactType];
    const queryString = `_id: "${artifactId}"`;
    const queryVars = {
        artTypes,
        queryString,
    };
    const queryOptions: QueryHookOptions = {
        variables: queryVars,
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
        notifyOnNetworkStatusChange: true,
    };

    const { data, error, loading } = useQuery<ArtifactsCompleteQueryData>(
        ArtifactsCompleteQuery,
        queryOptions,
    );

    const hits = data?.artifacts?.hits;
    const haveData = !_.isNil(hits) && !error && !loading;

    if (loading) {
        // Show spinner while the query is loading.
        <IsLoading />;
    }
    if (!haveData) {
        return <QueryError error={error} />;
    }
    if (haveData && _.isEmpty(hits)) {
        return <NoFound />;
    }
    const artList = dataToArtList(data);

    return <SingleArtifactView artifact={artList.hits[0]} />;
}

// Show information message if query succeeded but no artifacts were returned.
const NoFound = () => {
    let pageTitle = `Artifact search results | ${config.defaultTitle}`;
    return (
        <PageCommon title={pageTitle}>
            <PageSection isFilled>
                <Bullseye>
                    <EmptyState>
                        <EmptyStateHeader
                            titleText="No artifacts found"
                            icon={<EmptyStateIcon icon={SearchIcon} />}
                            headingLevel="h2"
                        />
                        <EmptyStateBody>
                            No matching artifacts found in database
                        </EmptyStateBody>
                    </EmptyState>
                </Bullseye>
            </PageSection>
        </PageCommon>
    );
};

// Show error page if the query failed.
interface QueryErrorProps {
    error?: ApolloError;
}
const QueryError: React.FC<QueryErrorProps> = (props) => {
    const { error } = props;
    let pageTitle = `Artifact search results | ${config.defaultTitle}`;
    return (
        <PageCommon title={pageTitle}>
            <PageSection isFilled>
                <Bullseye>
                    <EmptyState>
                        <EmptyStateHeader
                            titleText="Failed to load artifact"
                            icon={
                                <EmptyStateIcon
                                    className="pf-v5-u-danger-color-100"
                                    icon={ExclamationCircleIcon}
                                />
                            }
                            headingLevel="h2"
                        />
                        <EmptyStateFooter>
                            {error && (
                                <EmptyStateBody>
                                    Error: {error.toString()}
                                </EmptyStateBody>
                            )}
                        </EmptyStateFooter>
                    </EmptyState>
                </Bullseye>
            </PageSection>
        </PageCommon>
    );
};

// Show error page if the query failed.
interface IsLoadingProps {
    error?: ApolloError;
}
const IsLoading: React.FC<IsLoadingProps> = (props) => {
    let pageTitle = `Artifact search results | ${config.defaultTitle}`;
    return (
        <PageCommon title={pageTitle}>
            <PageSection isFilled>
                <Bullseye>
                    <EmptyState>
                        <EmptyStateHeader
                            titleText="Loading artifact(s)…"
                            icon={<EmptyStateIcon icon={Spinner} />}
                            headingLevel="h2"
                        />
                    </EmptyState>
                </Bullseye>
            </PageSection>
        </PageCommon>
    );
};

// XXX
//   const navigate = useNavigate();
//   const handleNavigation = () => {
// Programmatically navigate to another route within your app
//   navigate('/another-route');
// };
