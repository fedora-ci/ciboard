/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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
import classNames from 'classnames';
import { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {
    Tab,
    Tabs,
    Text,
    List,
    Flex,
    Label,
    Alert,
    Button,
    Spinner,
    ListItem,
    FlexItem,
    TabsProps,
    AlertProps,
    TextContent,
    TextVariants,
    TabTitleIcon,
    TabTitleText,
    DataListCell,
    DataListItem,
    DataListToggle,
    DataListContent,
    DataListItemRow,
    DescriptionList,
    DataListItemCells,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
} from '@patternfly/react-core';
import {
    ListIcon,
    WeeblyIcon,
    RegistryIcon,
    HandPaperIcon,
    RegisteredIcon,
    InfoCircleIcon,
    OutlinedThumbsUpIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
} from '@patternfly/react-icons';

import { ExternalLink } from './ExternalLink';
import { KaiDocsButton, KaiRerunButton } from './AChildTestMsg';
import styles from '../custom.module.css';
import { useAppDispatch } from '../hooks';
import {
    LinkifyNewTab,
    TestStatusIcon,
    timestampForUser,
    isResultWaivable,
} from '../utils/utils';
import {
    Artifact,
    getRerunUrl,
    ChildGreenwave,
    getTestcaseName,
    GreenwaveWaiveType,
    getArtifactProduct,
    getGreenwaveDocsUrl,
    GreenwaveRequirement,
} from '../types';
import { isResultMissing } from '../utils/utils';
import {
    mkLabel,
    mkPairs,
    AChildLink,
    AChildProps,
    AChildDetailsEntry,
} from './AChild';
import { createWaiver } from '../actions';
import { docs } from '../config';
import { MetadataQuery } from '../queries/Metadata';
import {
    TestInfo,
    useOnceCall,
    TestDependency,
    TestKnownIssues,
    MetadataQueryResult,
} from './MetadataInfo';

export interface PropsWithGreenwaveState {
    aChild: ChildGreenwave;
}

export interface WaiveButtonProps {
    artifact: Artifact;
    testcase?: string;
}

export const WaiveButton: React.FC<WaiveButtonProps> = (props) => {
    const { artifact, testcase } = props;
    const dispatch = useAppDispatch();

    if (_.isEmpty(testcase)) return null;
    const onClick: React.MouseEventHandler = (e) => {
        e.stopPropagation();
        dispatch(createWaiver(artifact, testcase));
    };
    const resultClasses = classNames(styles['actionButton']);

    return (
        <Button
            className={resultClasses}
            icon={<OutlinedThumbsUpIcon />}
            isSmall
            onClick={onClick}
            variant="control"
        >
            waive
        </Button>
    );
};

export interface GreenwaveStateActionsProps extends PropsWithGreenwaveState {
    artifact: Artifact;
}

// XXX was: GreenwaveStateActions
export const AChildGreenwaveActions: React.FC<GreenwaveStateActionsProps> = (
    props,
) => {
    const { artifact, aChild } = props;
    const docsUrl = getGreenwaveDocsUrl(aChild);
    const rerunUrl = getRerunUrl(aChild);
    const showWaiveButton = isResultWaivable(aChild);
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

const resultMapping = [
    ['submit_time', 'submited', _.partialRight(timestampForUser, true)],
    ['id', 'result id'],
    ['href', 'resultsdb url'],
    ['note', 'note'],
    ['outcome', 'outcome'],
    /**
     * based on internal resultdb logic
     * https://github.com/release-engineering/resultsdb-updater/pull/131
     * https://issues.redhat.com/browse/RHELWF-5987
     */
    ['testcase.ref_url', 'testcase info'],
];

export const GreenwaveResultInfo: React.FC<PropsWithGreenwaveState> = (
    props,
) => {
    const { result } = props.aChild;
    if (!result) return null;
    const pairs = mkPairs(resultMapping, result);
    if (_.isEmpty(pairs)) return null;
    const elements: JSX.Element[] = _.map(pairs, ([name, value]) =>
        mkLabel(name, value, 'orange'),
    );
    return (
        <AChildDetailsEntry caption="Result info">
            <Flex>
                <FlexItem>
                    <DescriptionList
                        isCompact
                        isHorizontal
                        columnModifier={{
                            default: '2Col',
                        }}
                    >
                        {elements}
                    </DescriptionList>
                </FlexItem>
            </Flex>
        </AChildDetailsEntry>
    );
};

export interface GreenwaveWaiverProps {
    waiver?: GreenwaveWaiveType;
}

export const GreenwaveWaiver: React.FC<GreenwaveWaiverProps> = (props) => {
    const { waiver } = props;
    if (!waiver) return null;
    const humanTime = timestampForUser(waiver.timestamp);
    return (
        <Alert
            className="pf-u-mt-md"
            customIcon={<HandPaperIcon />}
            isExpandable
            isInline
            title="Test result waived"
            variant="warning"
        >
            <TextContent className="pf-u-font-size-sm">
                <Text component="p">
                    This test result was waived by <b>{waiver.username}</b> on{' '}
                    {humanTime} with the following comment:
                </Text>
                <Text className="pf-u-py-xs" component="blockquote">
                    <LinkifyNewTab>{waiver.comment}</LinkifyNewTab>
                </Text>
            </TextContent>
        </Alert>
    );
};

interface GreenwaveDetailsProps {
    requirement?: GreenwaveRequirement;
}

export const GreenwaveDetails: React.FC<GreenwaveDetailsProps> = ({
    requirement,
}) => {
    if (!requirement || !requirement.details) return null;

    const icon = <TestStatusIcon status={requirement.type} />;
    let title = 'Result details';
    let variant: AlertProps['variant'] = 'default';

    if (
        requirement.type === 'invalid-gating-yaml' ||
        requirement.type === 'invalid-gating-yaml-waived'
    ) {
        title = 'gating.yaml validation failed';
        variant = 'danger';
    }

    return (
        <Alert customIcon={icon} isInline title={title} variant={variant}>
            <TextContent className="pf-u-font-size-sm">
                <Text component="pre">{requirement.details}</Text>
            </TextContent>
        </Alert>
    );
};

export const GreenwaveResultData: React.FC<PropsWithGreenwaveState> = (
    props,
) => {
    const { aChild } = props;
    const { result } = aChild;
    if (_.isUndefined(result) || !_.isObject(result?.data)) {
        return null;
    }
    const mkItem = (name: string, values: string[]): JSX.Element => {
        const valuesRendered: Array<JSX.Element | string> = _.map(
            values,
            (v, index) => {
                return <LinkifyNewTab key={index}>{v}</LinkifyNewTab>;
            },
        );
        return (
            <DescriptionListGroup key={name}>
                <DescriptionListTerm>{name}</DescriptionListTerm>
                <DescriptionListDescription>
                    <Label
                        isCompact
                        color="cyan"
                        icon={null}
                        variant="filled"
                        isTruncated
                    >
                        {valuesRendered}
                    </Label>
                </DescriptionListDescription>
            </DescriptionListGroup>
        );
    };
    const items: Array<JSX.Element> = [];
    /* result.data is array */
    _.map(result.data, (values, k) => {
        if (!values) return;
        const item = mkItem(k, values);
        items.push(item);
    });
    if (_.isEmpty(items)) {
        return null;
    }
    return (
        <AChildDetailsEntry caption="Result data">
            <Flex>
                <DescriptionList
                    columnModifier={{
                        default: '2Col',
                    }}
                    isCompact
                    isHorizontal
                >
                    {items}
                </DescriptionList>
            </Flex>
        </AChildDetailsEntry>
    );
};

export interface FaceForGreenwaveStateProps extends PropsWithGreenwaveState {
    artifact: Artifact;
    artifactDashboardUrl: string;
}

export const FaceForGreenwaveState: React.FC<FaceForGreenwaveStateProps> = (
    props,
) => {
    const { artifact, artifactDashboardUrl, aChild } = props;
    const { waiver } = aChild;
    const isWaived = _.isNumber(waiver?.id);
    const isGatingResult = _.isString(aChild.requirement?.testcase);
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
    const resultOutcome = aChild.result?.outcome;
    const requirementType = aChild.requirement?.type;
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
                    <Text className="pf-u-text-nowrap">{aChild.testcase}</Text>
                </TextContent>
                <Flex spaceItems={{ default: 'spaceItemsXs' }}>{labels}</Flex>
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <AChildGreenwaveActions artifact={artifact} aChild={aChild} />
                <AChildLink
                    artifactDashboardUrl={artifactDashboardUrl}
                    aChild={aChild}
                />
            </Flex>
        </Flex>
    );
};

interface BodyForGreenwaveStateProps {
    aChild: ChildGreenwave;
    artifact: Artifact;
    isVisible: boolean;
}

export const BodyForGreenwaveState: React.FC<BodyForGreenwaveStateProps> = (
    props,
) => {
    const { artifact, isVisible, aChild } = props;
    const [activeTabKey, setActiveTabKey] = useState<number | string>(
        'InitialState',
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

    const isTestResultsTabHidden =
        !isResultMissing(aChild) &&
        !aChild.waiver &&
        !aChild.requirement?.details;
    const isTestKnownIssuesTabHidden = !known_issues;
    const isTestDependencyTabHidden = !dependency;
    const isTestInfoTabHidden = !description && !contact;
    const isTestDetailsTabHidden = !aChild.result;
    if (activeTabKey === 'InitialState') {
        /* find first tab with info */
        const activeTab = _.findIndex([
            !isTestResultsTabHidden,
            !isTestKnownIssuesTabHidden,
            !isTestDependencyTabHidden,
            !isTestInfoTabHidden,
            !isTestDetailsTabHidden,
        ]);
        setActiveTabKey(activeTab);
    }
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
                    eventKey={0}
                    isHidden={isTestResultsTabHidden}
                    title={
                        <>
                            <TabTitleIcon>
                                <RegistryIcon />
                            </TabTitleIcon>{' '}
                            <TabTitleText>Result</TabTitleText>{' '}
                        </>
                    }
                    aria-label="Tab with results info"
                >
                    <GreenwaveWaiver waiver={aChild.waiver} />
                    <GreenwaveDetails requirement={aChild.requirement} />
                    {isResultMissing(aChild) && <GreenwaveMissingHints />}
                </Tab>
                <Tab
                    eventKey={1}
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
                    eventKey={2}
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
                    eventKey={3}
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
                    eventKey={4}
                    title={
                        <>
                            <TabTitleIcon>
                                <ListIcon />
                            </TabTitleIcon>{' '}
                            <TabTitleText>Details</TabTitleText>{' '}
                        </>
                    }
                    isHidden={isTestDetailsTabHidden}
                    aria-label="Tab with test details"
                >
                    <GreenwaveResultInfo aChild={aChild} />
                    <GreenwaveResultData aChild={aChild} />
                </Tab>
            </Tabs>
        </>
    );
};

export const GreenwaveMissingHints: React.FC<{}> = (props) => (
    <Alert isInline variant="info" title="Required gating test">
        <TextContent className="pf-u-font-size-sm">
            <Text component="p">
                This required gating test has missing results. If this situation
                persists for more then few minutes, it can mean the following:
            </Text>
            <List component="ol">
                <ListItem>
                    It s a manual testcase and it is waiting to be submitted via
                    the{' '}
                    <ExternalLink href={docs.manual_gating_workflow}>
                        manual gating workflow
                    </ExternalLink>
                    .
                </ListItem>
                <ListItem>
                    <p>
                        Your <code>gating.yaml</code> file is misconfigured and
                        gating is expecting a testcase that will never run for
                        the artifact. Make sure all testcases are configured
                        correctly in the <code>gating.yaml</code> file. For a
                        list of possible testcases see the{' '}
                        <ExternalLink href={docs.gating_tests_overview}>
                            gating documentation.
                        </ExternalLink>
                    </p>
                    <p>
                        Note that some of the tests are configured globally,
                        like{' '}
                        <code>osci.brew-build.installability.functional</code>{' '}
                        or <code>osci.brew-build.rpmdeplint.functional</code>.
                        Missing tests for these are expected for older builds.
                    </p>
                </ListItem>
                <ListItem>
                    If this is a <code>leapp.brew-build.upgrade.distro</code>{' '}
                    test, it depends on a possibly unfinished or failed tests,{' '}
                    <code>osci.brew-build.compose-ci.integration</code> (RHEL8){' '}
                    or <code>osci.brew-build.test-compose.integration</code>{' '}
                    (RHEL9), and therefore restart these tests or contact #osci
                    for help with these tests.
                </ListItem>
                <ListItem>
                    There is an outage or significant load affecting CI systems
                    or Gating.
                </ListItem>
                <ListItem>
                    There is some other problem. Contact the OSCI team for help
                    – <code>#osci</code> on IRC or email at{' '}
                    <code>osci-list@redhat.com</code>.
                </ListItem>
                <ListItem>
                    If this cannot wait,{' '}
                    <ExternalLink href={docs.waiving}>
                        waive the missing test via CLI.
                    </ExternalLink>
                </ListItem>
            </List>
        </TextContent>
    </Alert>
);

export type AChildGreenwaveProps = AChildProps & PropsWithGreenwaveState;

export const AChildGreenwave: React.FC<AChildGreenwaveProps> = (props) => {
    const {
        aChild,
        artifact,
        forceExpand,
        setExpandedResult,
        artifactDashboardUrl,
    } = props;

    const { testcase } = aChild;
    /*
     * Expand a specific testcase according to query string and scroll to it
     * ?focus=tc:<test-case-name> or ?focus=id:<pipeline-id>
     */
    const onToggle = () => {
        setExpandedResult(forceExpand ? '' : testcase);
    };
    /** Note for info test results */
    const resultClasses = classNames(styles.helpSelect, {
        [styles.expandedResult]: forceExpand,
    });
    const toRender = (
        <DataListItem
            key={testcase}
            isExpanded={forceExpand}
            className={resultClasses}
            aria-labelledby="artifact-item-result"
        >
            <DataListItemRow>
                <DataListToggle
                    id="toggle"
                    onClick={onToggle}
                    isExpanded={forceExpand}
                />
                <DataListItemCells
                    className="pf-u-m-0 pf-u-p-0"
                    dataListCells={[
                        <DataListCell
                            className="pf-u-m-0 pf-u-p-0"
                            key="secondary content"
                        >
                            <FaceForGreenwaveState
                                aChild={aChild}
                                artifact={artifact}
                                artifactDashboardUrl={artifactDashboardUrl}
                            />
                        </DataListCell>,
                    ]}
                />
            </DataListItemRow>
            <DataListContent
                aria-label="Primary Content Result Details"
                id="ex-result-expand1"
                isHidden={!forceExpand}
            >
                <BodyForGreenwaveState
                    aChild={aChild}
                    artifact={artifact}
                    isVisible={forceExpand}
                />
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};
