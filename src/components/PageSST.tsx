/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
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

import _ from 'lodash';
import { useQuery } from '@apollo/client';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    Flex,
    FlexItem,
    Nav,
    NavItem,
    NavList,
    PageSection,
    PageSectionVariants,
    Spinner,
    Text,
    TextContent,
    Title,
} from '@patternfly/react-core';

import { config } from '../config';
import { SSTItem, SSTResult } from '../types';
import {
    SSTListQuery,
    SSTResultsQuery,
} from '../queries/SST';
import { PageCommon } from './PageCommon';
import { DropdownSelector } from './SSTSelector';
import { StatusChart } from './SSTResultsStatusChart';
import { ResultsTable } from './SSTResultsTable';

interface PageHeaderProps {
    release?: string;
    results?: SSTResult[];
    section: string;
    sstList: SSTItem[];
}

interface PageSSTParams {
    release?: string;
    section?: string;
}

function PageHeader({ release, results, section, sstList }: PageHeaderProps) {
    const currentSst = _.find(sstList, (sst) => (sst.name === section));

    const haveStatusChartData = !_.isEmpty(results);

    const activeName = _.get(currentSst, 'display_name', 'Unknown SST');
    const releases = _.get(currentSst, 'releases');
    const releaseNav = releases && (
        <Nav variant="tertiary">
            <NavList>
                {_.map(releases, (r) => (
                    <NavItem
                        isActive={r === release}
                        key={r}
                    >
                        <Link to={`/sst/${section}/${r}`}>
                            {r}
                        </Link>
                    </NavItem>
                ))}
            </NavList>
        </Nav>
    );

    // Enforce a fixed order of the labels and colors.
    let statusChartData = {
        'Passed': 0,
        'Failed': 0,
        'Info': 0,
        'Other': 0,
    };
    if (haveStatusChartData) {
        _.assign(statusChartData, _.countBy(results, (result) => {
            const statusLower = result.status.toLowerCase();
            if (statusLower.startsWith('pass')) {
                return 'Passed';
            }
            if (statusLower.startsWith('fail')) {
                return 'Failed';
            }
            if (['info', 'needs_inspection', 'not_applicable'].includes(statusLower)) {
                return 'Info';
            }
            return 'Other';
        }));
    }

    return (
        <>
            <Flex
                flex={{ default: 'flex_2' }}
                direction={{ default: 'column' }}
                alignSelf={{ default: 'alignSelfFlexStart' }}
            >
                <FlexItem
                    grow={{ default: 'grow' }}
                    alignSelf={{ default: 'alignSelfCenter' }}
                >
                    <TextContent>
                        <Title headingLevel="h1" size="3xl">
                            {activeName}
                        </Title>
                    </TextContent>
                </FlexItem>
                <FlexItem
                    spacer={{ default: 'spacerLg' }}
                    alignSelf={{ default: 'alignSelfCenter' }}
                >
                    {releaseNav}
                </FlexItem>
            </Flex>
            <Flex
                flex={{ default: 'flex_1' }}
                justifyContent={{
                    default: 'justifyContentFlexEnd'
                }}
            >
                <FlexItem>
                    {haveStatusChartData &&
                        <StatusChart
                            data={statusChartData}
                            height={80}
                            width={500}
                        />}
                </FlexItem>
            </Flex>
        </>
    );
}

export function PageSST() {
    // Parameters from the URL -- /ssr/:section/:release
    const { release, section } = useParams<PageSSTParams>();
    // We don't try to load SST test results until both the section name
    // and release is specified.
    const skipResultsQuery = !release || !section;

    const listQuery = useQuery(SSTListQuery);
    const resultsQuery = useQuery(
        SSTResultsQuery,
        {
            skip: skipResultsQuery,
            variables: {
                release: release,
                sst_name: section,
            },
        },
    );

    const sstList: SSTItem[] | undefined = _.get(listQuery, 'data.sst_list');
    const sstResults: SSTResult[] | undefined = (
        (resultsQuery.error || resultsQuery.loading)
            ? undefined
            : _.get(resultsQuery, 'data.sst_results')
    );
    const showResultsTable = (resultsQuery.loading || sstResults);

    let pageTitle = 'Subsystems';
    if (section) {
        pageTitle = `Subsystem ${section}`;
        if (release) {
            pageTitle += ` / ${release}`;
        }
    }
    pageTitle += ` | ${config.defaultTitle}`;

    return (
        <PageCommon
            title={pageTitle}
        >
            <PageSection
                variant={PageSectionVariants.default}
                isFilled
            >
                <Flex>
                    <Flex
                        flex={{ default: 'flex_1' }}
                        alignSelf={{ default: 'alignSelfFlexStart' }}
                    >
                        <FlexItem>
                            {listQuery.loading &&
                                <TextContent>
                                    <Text>
                                        <Spinner size="md" className="pf-u-mr-sm" />
                                        Loading SST list…
                                    </Text>
                                </TextContent>
                            }
                            {listQuery.error &&
                                <TextContent>
                                    <Text>Error loading SST list: {String(listQuery.error)}</Text>
                                </TextContent>
                            }
                            {!listQuery.loading && sstList &&
                                <DropdownSelector
                                    section={section}
                                    sstList={sstList}
                                />
                            }
                        </FlexItem>
                    </Flex>
                    {section && sstList &&
                        <PageHeader
                            release={release}
                            results={sstResults}
                            section={section}
                            sstList={sstList}
                        />
                    }
                </Flex>
                {showResultsTable &&
                    <ResultsTable
                        error={resultsQuery.error}
                        loading={resultsQuery.loading}
                        results={sstResults}
                    />
                }
            </PageSection>
        </PageCommon>
    );
}
