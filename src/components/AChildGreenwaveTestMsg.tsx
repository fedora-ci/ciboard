/*
 * This file is part of ciboard

 * Copyright (c) 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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
import React from 'react';
import { useState } from 'react';
import classNames from 'classnames';
import {
    Tab,
    Flex,
    Tabs,
    Text,
    Label,
    Spinner,
    FlexItem,
    TabsProps,
    TextContent,
    TabTitleIcon,
    TabTitleText,
    TextVariants,
    DataListCell,
    DataListItem,
    DataListToggle,
    DataListItemRow,
    DataListContent,
    DataListItemCells,
} from '@patternfly/react-core';
import { useLazyQuery } from '@apollo/client';
import {
    ListIcon,
    WeeblyIcon,
    RegistryIcon,
    InfoCircleIcon,
    RegisteredIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
} from '@patternfly/react-icons';

import styles from '../custom.module.css';
import {
    Artifact,
    getRerunUrl,
    getUmbDocsUrl,
    getTestcaseName,
    getArtifactProduct,
    ChildGreenwaveAndTestMsg,
    getMsgBody,
    getTestMsgBody,
} from '../types';
import { TestStatusIcon, isResultWaivable } from '../utils/utils';
import { ArtifactStateProps, StateLink } from './AChild';
import {
    WaiveButton,
    GreenwaveWaiver,
    GreenwaveDetails,
    GreenwaveResultInfo,
} from './ArtifactGreenwaveChild';
import {
    ResultNote,
    KaiDocsButton,
    KaiRerunButton,
    KaiStateMapping,
    KaiDetailedResults,
} from './AChildTestMsg';
import {
    TestInfo,
    useOnceCall,
    TestDependency,
    TestKnownIssues,
    MetadataQueryResult,
} from './MetadataInfo';
import { MetadataQuery } from '../queries/Metadata';

interface GreenwaveTestMsgStateActionsProps {
    aChild: ChildGreenwaveAndTestMsg;
    artifact: Artifact;
}

export const GreenwaveTestMsgStateActions: React.FC<
    GreenwaveTestMsgStateActionsProps
> = (props) => {
    const { aChild, artifact } = props;
    const msgBody = getTestMsgBody(aChild.ms);
    const docsUrl = getUmbDocsUrl(msgBody);
    const rerunUrl = getRerunUrl(aChild);
    const showWaiveButton = isResultWaivable(aChild.gs);
    const testcase = getTestcaseName(aChild);

    return (
        <Flex style={{ minWidth: '20em' }}>
            <Flex flex={{ default: 'flex_1' }}>
                {showWaiveButton && (
                    <WaiveButton artifact={artifact} testcase={testcase} />
                )}
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiRerunButton rerunUrl={rerunUrl} />
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <KaiDocsButton docsUrl={docsUrl} />
            </Flex>
        </Flex>
    );
};

interface FaceForGreenwaveTestMsgStateProps {
    aChild: ChildGreenwaveAndTestMsg;
    artifact: Artifact;
    artifactDashboardUrl: string;
}

export const FaceForGreenwaveTestMsgState: React.FC<
    FaceForGreenwaveTestMsgStateProps
> = (props) => {
    const { artifact, artifactDashboardUrl, aChild } = props;
    const { waiver } = aChild.gs;
    const isWaived = _.isNumber(waiver?.id);
    const isGatingResult = _.isString(aChild.gs.requirement?.testcase);
    const labels: JSX.Element[] = [];
    if (isGatingResult) {
        labels.push(
            <Label
                key="gating"
                color="blue"
                icon={<RegisteredIcon />}
                isCompact
            >
                Required for gating
            </Label>,
        );
    }
    if (isWaived) {
        labels.push(
            <Label key="waived" color="orange" icon={<WeeblyIcon />} isCompact>
                Waived
            </Label>,
        );
    }
    const resultOutcome = aChild.gs.result?.outcome;
    const requirementType = aChild.gs.requirement?.type;
    /*
     * Take requirementType as the main creterion, unless the result is missing
     * in ResultsDB. For example:
     * - green pass icon == outcome: test-result-passed + type: NEEDS_INSPECTION
     * - running icon == outcome: test-result-missing + type: RUNNING
     */
    const iconName = _.includes(['test-result-missing'], requirementType)
        ? resultOutcome || requirementType || 'unknown'
        : requirementType || resultOutcome || 'unknown';
    return (
        <Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <FlexItem>
                    <TestStatusIcon status={iconName} />
                </FlexItem>
                <TextContent>
                    <Text className="pf-u-text-nowrap">
                        {aChild.gs.testcase}
                    </Text>
                </TextContent>
                <Flex spaceItems={{ default: 'spaceItemsXs' }}>{labels}</Flex>
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <GreenwaveTestMsgStateActions
                    artifact={artifact}
                    aChild={aChild}
                />
                <StateLink
                    artifactDashboardUrl={artifactDashboardUrl}
                    aChild={aChild}
                />
            </Flex>
        </Flex>
    );
};

interface BodyForGreenwaveTestMsgStateProps {
    aChild: ChildGreenwaveAndTestMsg;
    artifact: Artifact;
    isVisible: boolean;
}

export const BodyForGreenwaveKaiState: React.FC<
    BodyForGreenwaveTestMsgStateProps
> = (props) => {
    const { artifact, isVisible, aChild } = props;
    const [activeTabKey, setActiveTabKey] = useState<number | string>(
        'tab-test-xunit',
    );
    const handleTabClick: TabsProps['onSelect'] = (event, tabIndex) => {
        setActiveTabKey(tabIndex);
    };
    const testcase_name = getTestcaseName(aChild);
    const product_version = getArtifactProduct(artifact);
    const variables: any = { testcase_name };
    if (!_.isNil(product_version)) {
        variables.product_version = product_version;
    }
    const [getMetadata, { loading: metadataLoading, error: _error, data }] =
        useLazyQuery<MetadataQueryResult>(MetadataQuery, {
            variables,
            errorPolicy: 'all',
            /* need to re-fetch each time when user press save/back button */
            fetchPolicy: 'cache-and-network',
            notifyOnNetworkStatusChange: true,
        });
    useOnceCall(() => {
        /* Fetch data only when ci-system is expanded. */
        getMetadata();
    }, isVisible);
    if (!isVisible) {
        return null;
    }
    if (metadataLoading) {
        return (
            <Flex className="pf-u-p-lg">
                <FlexItem>
                    <Spinner className="pf-u-mr-md" size="md" /> Loading test
                    information…
                </FlexItem>
            </Flex>
        );
    }
    const metadata = data?.metadata_consolidated;
    if (_.isNil(metadata) || _.isNil(metadata?.payload)) {
        return (
            <Flex className="pf-u-p-lg">
                <FlexItem>Cannot fetch metadata info.</FlexItem>
            </Flex>
        );
    }
    const { contact, dependency, description, known_issues } = metadata.payload;
    const isTestInfoTabHidden = !description && !contact;
    const isTestKnownIssuesTabHidden = !known_issues;
    const isTestDependencyTabHidden = !dependency;
    return (
        <>
            <Tabs
                activeKey={activeTabKey}
                onSelect={handleTabClick}
                isBox
                aria-label="Tabs with ci-system info"
                role="region"
            >
                <Tab
                    eventKey={'tab-test-xunit'}
                    title={
                        <>
                            <TabTitleIcon>
                                <RegistryIcon />
                            </TabTitleIcon>{' '}
                            <TabTitleText>Result</TabTitleText>{' '}
                        </>
                    }
                    aria-label="Tab with xunit results"
                >
                    <GreenwaveWaiver waiver={aChild.gs.waiver} />
                    <GreenwaveDetails requirement={aChild.gs.requirement} />
                    <ResultNote state={aChild.ms} />
                    <KaiDetailedResults artifact={artifact} state={aChild.ms} />
                </Tab>
                <Tab
                    eventKey={'tab-test-known-issues'}
                    isHidden={isTestKnownIssuesTabHidden}
                    title={
                        <>
                            <TabTitleIcon>
                                <ExclamationCircleIcon />
                            </TabTitleIcon>
                            <TabTitleText>Known issues</TabTitleText>
                        </>
                    }
                    aria-label="Tab with known issues"
                >
                    <>
                        <TestKnownIssues metadata={metadata} />
                    </>
                </Tab>
                <Tab
                    eventKey={'tab-test-deps'}
                    isHidden={isTestDependencyTabHidden}
                    title={
                        <>
                            <TabTitleIcon>
                                <ExclamationTriangleIcon />
                            </TabTitleIcon>
                            <TabTitleText>Dependency</TabTitleText>
                        </>
                    }
                    aria-label="Tab with dependency information"
                >
                    <>
                        <TestDependency metadata={metadata} />
                    </>
                </Tab>
                <Tab
                    eventKey={'tab-test-info'}
                    isHidden={isTestInfoTabHidden}
                    title={
                        <>
                            <TabTitleIcon>
                                <InfoCircleIcon />
                            </TabTitleIcon>
                            <TabTitleText>Test info</TabTitleText>
                        </>
                    }
                    aria-label="Tab with test info"
                >
                    <>
                        <TestInfo metadata={metadata} />
                        <TextContent>
                            <Text component={TextVariants.small}>
                                CI owners can update info on metadata page.
                            </Text>
                        </TextContent>
                    </>
                </Tab>
                <Tab
                    eventKey={'tab-test-details'}
                    title={
                        <>
                            <TabTitleIcon>
                                <ListIcon />
                            </TabTitleIcon>{' '}
                            <TabTitleText>Details</TabTitleText>{' '}
                        </>
                    }
                    aria-label="Tab with test details"
                >
                    <GreenwaveResultInfo state={aChild.gs} />
                    <KaiStateMapping artifact={artifact} state={aChild.ms} />
                </Tab>
            </Tabs>
        </>
    );
};

export interface ArtifactGreenwaveTestMsgStateProps extends ArtifactStateProps {
    aChild: ChildGreenwaveAndTestMsg;
}

export const ArtifactGreenwaveTestMsgState: React.FC<
    ArtifactGreenwaveTestMsgStateProps
> = (props) => {
    const {
        aChild,
        artifact,
        forceExpand,
        setExpandedResult,
        artifactDashboardUrl,
    } = props;

    /*
     * Expand a specific testcase according to query string and scroll to it
     * ?focus=tc:<test-case-name> or ?focus=id:<pipeline-id>
     */
    const onToggle = () => {
        if (forceExpand) {
            setExpandedResult('');
        } else {
            const key = aChild.gs.testcase;
            setExpandedResult(key);
        }
    };

    /** Note for info test results */
    const key = aChild.gs.testcase;
    const resultClasses = classNames(styles.helpSelect, {
        [styles.expandedResult]: forceExpand,
    });

    const toRender = (
        <DataListItem
            aria-labelledby="artifact-item-result"
            className={resultClasses}
            isExpanded={forceExpand}
            key={key}
        >
            <DataListItemRow>
                <DataListToggle
                    id="toggle"
                    isExpanded={forceExpand}
                    onClick={onToggle}
                />
                <DataListItemCells
                    className="pf-u-m-0 pf-u-p-0"
                    dataListCells={[
                        <DataListCell
                            className="pf-u-m-0 pf-u-p-0"
                            key="secondary content"
                        >
                            <FaceForGreenwaveTestMsgState
                                artifact={artifact}
                                artifactDashboardUrl={artifactDashboardUrl}
                                aChild={aChild}
                            />
                        </DataListCell>,
                    ]}
                />
            </DataListItemRow>
            <DataListContent
                aria-label="Detailed information on test result"
                id="ex-result-expand1"
                isHidden={!forceExpand}
            >
                <BodyForGreenwaveTestMsgState
                    state={aChild}
                    artifact={artifact}
                    isVisible={forceExpand}
                />
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};
