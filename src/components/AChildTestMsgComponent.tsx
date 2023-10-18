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
import React, { useState } from 'react';
import classNames from 'classnames';
import { useLazyQuery } from '@apollo/client';
import {
    Tab,
    Tabs,
    Text,
    Flex,
    Alert,
    Button,
    Spinner,
    FlexItem,
    TabsProps,
    TextContent,
    TextVariants,
    TabTitleIcon,
    TabTitleText,
    DataListCell,
    DataListItem,
    DataListToggle,
    DescriptionList,
    DataListContent,
    DataListItemRow,
    DataListItemCells,
} from '@patternfly/react-core';
import {
    ListIcon,
    RedoIcon,
    BookIcon,
    RegistryIcon,
    InfoCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import styles from '../custom.module.css';
//import { TestSuites } from './TestSuites';
import { LinkifyNewTab, TestStatusIcon } from '../utils/utils';
import {
    MSG_V_1,
    getAType,
    Metadata,
    Artifact,
    getMsgId,
    MSG_V_0_1,
    getRerunUrl,
    getThreadID,
    MsgStateName,
    AChildTestMsg,
    getUmbDocsUrl,
    getTestMsgBody,
    getMsgStageName,
    getTestcaseName,
    TestMsgStateName,
    getDatagrepperUrl,
    getArtifactProduct,
    getMsgStateName,
    getTestMsgExtendedStatus,
} from '../types';
import {
    mkLabel,
    mkPairs,
    AChildLink,
    AChildProps,
    AChildDetailsEntry,
} from './AChildComponent';
import {
    TestInfo,
    useOnceCall,
    TestDependency,
    TestKnownIssues,
    MetadataQueryResult,
} from './MetadataInfo';
import { MetadataQuery } from '../queries/Metadata';

export interface PropsWithTestMsgAChild {
    aChild: AChildTestMsg;
    metadata?: Metadata;
}

/**
 * Display the note associated with a result as provided by the CI system if available.
 */
export function ResultNote(props: PropsWithTestMsgAChild) {
    const { aChild } = props;
    const brokerMsgBody = getTestMsgBody(aChild);
    let note: string | undefined;
    if (MSG_V_0_1.isMsg(brokerMsgBody)) {
        note = brokerMsgBody.note;
    } else if (MSG_V_1.isMsg(brokerMsgBody)) {
        note = brokerMsgBody.test.note;
    }
    if (_.isEmpty(note)) return null;
    return (
        <Alert isInline title="Note from CI system" variant="info">
            {note}
        </Alert>
    );
}

export interface TestMsgDocsButtonProps {
    docsUrl?: string;
}

export const TestMsgDocsButton: React.FC<TestMsgDocsButtonProps> = (props) => {
    const { docsUrl } = props;
    if (_.isEmpty(docsUrl)) return null;
    return (
        <Button
            rel="noopener noreferrer"
            icon={<BookIcon />}
            href={docsUrl}
            title="Documentation for this test provided by the CI system."
            target="_blank"
            isSmall
            variant="secondary"
            component="a"
            className={styles.actionButton}
        >
            docs
        </Button>
    );
};

export interface TestMsgRerunButtonProps {
    rerunUrl?: string;
}

export const TestMsgRerunButton: React.FC<TestMsgRerunButtonProps> = (
    props,
) => {
    const { rerunUrl } = props;
    if (_.isEmpty(rerunUrl)) return null;
    return (
        <Button
            className={styles.actionButton}
            component="a"
            href={rerunUrl}
            icon={<RedoIcon />}
            isSmall
            onClick={(e) => {
                e.stopPropagation();
            }}
            rel="noopener noreferrer"
            target="_blank"
            title="Rerun testing. Note login to the linked system might be required."
            variant="control"
        >
            rerun
        </Button>
    );
};

/**
 * v 1.x
 */
const schemaMappingV1 = [
    ['contact.name', 'ci name'],
    ['contact.team', 'ci team'],
    ['contact.docs', 'ci docs'],
    ['contact.email', 'ci email'],
    ['contact.url', 'ci web ui'],
    ['contact.irc', 'ci irc'],
    ['contact.slack', 'ci slack'],
    ['contact.version', 'ci version'],
    ['notification.recipients', 'recipients'],
    ['run.url', 'run details'],
    ['run.log', 'logs'],
    ['test.category', 'test category'],
    ['test.docs', 'test docs'],
    ['test.label', 'test label'],
    ['test.lifetime', 'test lifetime'],
    ['test.lifetime', 'test namespace'],
    ['test.note', 'test note'],
    ['test.progress', 'test progress'],
    ['test.type', 'test type'],
    ['test.scenario', 'test scenario'],
];

const schemaMappingV01 = [
    ['notification.recipients', 'recipients'],
    ['reason', 'error reason'],
];

const StateExplain: React.FC<PropsWithTestMsgAChild> = (props) => {
    const { aChild } = props;
    const brokerMsgBody = getTestMsgBody(aChild);
    const explain: { [key in MsgStateName]?: JSX.Element } = {
        running: (
            <Alert isInline isPlain title="Test running" variant="info">
                Testing has been started and is in progress.
            </Alert>
        ),
        queued: (
            <Alert isInline isPlain title="Test queued" variant="info">
                Test has been queued, but has not yet started.
            </Alert>
        ),
        error: (
            <Alert isInline isPlain title="Test error." variant="warning">
                Testing was aborted due to an error in the pipeline. This might
                be, for instance, an infrastructure error or a CI system error.
                Please, contact the CI system maintainers for further
                information.
            </Alert>
        ),
    };
    const columns: JSX.Element[] = [];
    const mgStateName = getMsgStateName(aChild);
    const stateExplanation = _.get(explain, mgStateName, null);
    if (stateExplanation) {
        columns.push(stateExplanation);
    }
    let errorReason: string | undefined;
    let errorIssueUrl: string | undefined;
    if (MSG_V_1.isMsg(brokerMsgBody)) {
        errorReason = _.get(brokerMsgBody, 'error.reason');
        errorIssueUrl = _.get(brokerMsgBody, 'error.issue_url');
    } else if (MSG_V_0_1.isMsg(brokerMsgBody)) {
        errorReason = _.get(brokerMsgBody, 'reason');
        errorIssueUrl = _.get(brokerMsgBody, 'issue_url');
    }
    if (!_.isNil(errorReason)) {
        const jsxElement = (
            <Alert isInline isPlain title="CI system error" variant="warning">
                {errorReason} <LinkifyNewTab>{errorIssueUrl}</LinkifyNewTab>
            </Alert>
        );
        columns.push(jsxElement);
    }
    if (_.size(columns)) {
        return (
            <Flex direction={{ default: 'column' }}>
                {_.map(columns, (c) => (
                    <FlexItem>{c}</FlexItem>
                ))}
            </Flex>
        );
    }
    return null;
};

export interface TestMsgStateMappingProps extends PropsWithTestMsgAChild {
    artifact: Artifact;
}

export const TestMsgStateMapping: React.FC<TestMsgStateMappingProps> = (
    props,
) => {
    const { artifact, aChild } = props;
    const brokerMsgBody = getTestMsgBody(aChild);
    const brokerMsgId = getMsgId(aChild);
    let pairs: string[][] = [];
    if (MSG_V_1.isMsg(brokerMsgBody)) {
        pairs = mkPairs(schemaMappingV1, brokerMsgBody);
    } else if (MSG_V_0_1.isMsg(brokerMsgBody)) {
        pairs = mkPairs(schemaMappingV01, brokerMsgBody);
    } else {
        return null;
    }
    const aType = getAType(artifact);
    const brokerMsgUrl = getDatagrepperUrl(brokerMsgId, aType);
    pairs.push(['broker msg', brokerMsgUrl]);
    const elements: JSX.Element[] = _.map(pairs, ([name, value]) =>
        mkLabel(name, value, 'green'),
    );
    return (
        <Flex>
            <FlexItem>
                <AChildDetailsEntry caption="Result details">
                    <Flex direction={{ default: 'column' }}>
                        <FlexItem key="1">
                            <StateExplain aChild={aChild} />
                        </FlexItem>
                        <FlexItem key="2">
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
            </FlexItem>
        </Flex>
    );
};

export const TestMsgStateActions: React.FC<PropsWithTestMsgAChild> = (
    props,
) => {
    const { aChild } = props;
    const brokerMsgBody = getTestMsgBody(aChild);
    const docsUrl = getUmbDocsUrl(brokerMsgBody);
    const rerunUrl = getRerunUrl(aChild);
    return (
        <Flex style={{ minWidth: '20em' }}>
            <Flex flex={{ default: 'flex_1' }}></Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <TestMsgRerunButton rerunUrl={rerunUrl} />
            </Flex>
            <Flex flex={{ default: 'flex_1' }}>
                <TestMsgDocsButton docsUrl={docsUrl} />
            </Flex>
        </Flex>
    );
};

// TO REMOVE:

// export interface TestMsgDetailedResultsProps extends PropsWithTestMsgAChild {
//     artifact: Artifact;
// }
//
// export const TestMsgDetailedResults: React.FC<TestMsgDetailedResultsProps> = (
//     props,
// ) => {
//     const { aChild, artifact } = props;
//     const testMsgStateName = getTestMsgStateName(aChild);
//     /* [OSCI-1861]: info messages also can have xunit */
//     /* https://pagure.io/fedora-ci/messages/blob/master/f/schemas/test-common.yaml#_120 */
//     const showFor: TestMsgStateName[] = [
//         'error',
//         'queued',
//         'running',
//         'complete',
//     ];
//     if (!_.includes(showFor, testMsgStateName)) return null;
//     const render = (
//         <AChildDetailsEntry caption="Test results">
//             <TestSuites aChild={aChild} artifact={artifact} />
//         </AChildDetailsEntry>
//     );
//     return render;
// };

// interface BodyForTestMsgStateProps {
//     aChild: AChildTestMsg;
//     artifact: Artifact;
//     isVisible: boolean;
// }
//
// export const BodyForTestMsgState: React.FC<BodyForTestMsgStateProps> = (
//     props,
// ) => {
//     const { artifact, isVisible, aChild } = props;
//     const [activeTabKey, setActiveTabKey] = useState<number | string>(0);
//     const handleTabClick: TabsProps['onSelect'] = (event, tabIndex) => {
//         setActiveTabKey(tabIndex);
//     };
//     const testcaseName = getTestcaseName(aChild);
//     const productVersion = getArtifactProduct(artifact);
//     const variables: any = { testcaseName };
//     if (!_.isNil(productVersion)) {
//         variables.product_version = productVersion;
//     }
//     const [getMetadata, { loading: metadataLoading, error: _error, data }] =
//         useLazyQuery<MetadataQueryResult>(MetadataQuery, {
//             variables,
//             errorPolicy: 'all',
//             /* need to re-fetch each time when user press save/back button */
//             fetchPolicy: 'cache-and-network',
//             notifyOnNetworkStatusChange: true,
//         });
//     useOnceCall(() => {
//         /* Fetch data only when ci-system is expanded. */
//         getMetadata();
//     }, isVisible);
//     if (!isVisible) {
//         return null;
//     }
//     if (metadataLoading) {
//         return (
//             <Flex className="pf-u-p-lg">
//                 <FlexItem>
//                     <Spinner className="pf-u-mr-md" size="md" /> Loading test
//                     information…
//                 </FlexItem>
//             </Flex>
//         );
//     }
//     const metadata = data?.metadata_consolidated;
//     if (_.isNil(metadata) || _.isNil(metadata?.payload)) {
//         return (
//             <Flex className="pf-u-p-lg">
//                 <FlexItem>Cannot fetch metadata info.</FlexItem>
//             </Flex>
//         );
//     }
//     const { contact, dependency, description, known_issues } = metadata.payload;
//     const isTestKnownIssuesTabHidden = !known_issues;
//     const isTestDependencyTabHidden = !dependency;
//     const isTestInfoTabHidden = !description && !contact;
//     return (
//         <>
//             <Tabs
//                 activeKey={activeTabKey}
//                 onSelect={handleTabClick}
//                 isBox
//                 aria-label="Tabs with ci-system info"
//                 role="region"
//             >
//                 <Tab
//                     eventKey={0}
//                     title={
//                         <>
//                             <TabTitleIcon>
//                                 <RegistryIcon />
//                             </TabTitleIcon>{' '}
//                             <TabTitleText>Result</TabTitleText>{' '}
//                         </>
//                     }
//                     aria-label="Tab with results info"
//                 >
//                     <ResultNote aChild={aChild} />
//                     <TestMsgDetailedResults
//                         aChild={aChild}
//                         artifact={artifact}
//                     />
//                 </Tab>
//                 <Tab
//                     eventKey={1}
//                     isHidden={isTestKnownIssuesTabHidden}
//                     title={
//                         <>
//                             <TabTitleIcon>
//                                 <ExclamationCircleIcon />
//                             </TabTitleIcon>
//                             <TabTitleText>Known issues</TabTitleText>
//                         </>
//                     }
//                     aria-label="Tab with known issues"
//                 >
//                     <>
//                         <TestKnownIssues metadata={metadata} />
//                     </>
//                 </Tab>
//                 <Tab
//                     eventKey={2}
//                     isHidden={isTestDependencyTabHidden}
//                     title={
//                         <>
//                             <TabTitleIcon>
//                                 <ExclamationTriangleIcon />
//                             </TabTitleIcon>
//                             <TabTitleText>Dependency</TabTitleText>
//                         </>
//                     }
//                     aria-label="Tab with dependency information"
//                 >
//                     <>
//                         <TestDependency metadata={metadata} />
//                     </>
//                 </Tab>
//                 <Tab
//                     eventKey={3}
//                     isHidden={isTestInfoTabHidden}
//                     title={
//                         <>
//                             <TabTitleIcon>
//                                 <InfoCircleIcon />
//                             </TabTitleIcon>
//                             <TabTitleText>Test info</TabTitleText>
//                         </>
//                     }
//                     aria-label="Tab with test info"
//                 >
//                     <>
//                         <TestInfo metadata={metadata} />
//                         <TextContent>
//                             <Text component={TextVariants.small}>
//                                 CI owners can update info on metadata page.
//                             </Text>
//                         </TextContent>
//                     </>
//                 </Tab>
//                 <Tab
//                     eventKey={4}
//                     title={
//                         <>
//                             <TabTitleIcon>
//                                 <ListIcon />
//                             </TabTitleIcon>{' '}
//                             <TabTitleText>Details</TabTitleText>{' '}
//                         </>
//                     }
//                     aria-label="Tab with test details"
//                 >
//                     <TestMsgStateMapping aChild={aChild} artifact={artifact} />
//                 </Tab>
//             </Tabs>
//         </>
//     );
// };

// // XXX: was: PropsWithKaiState / ArtifactKaiStateProps
// export type ArtifactTestMsgStateProps = AChildProps & PropsWithTestMsgAChild;
//
// // XXX: was: ArtifactKaiState
// export const AChildTestMsgComponent: React.FC<ArtifactTestMsgStateProps> = (
//     props,
// ) => {
//     const {
//         aChild,
//         artifact,
//         forceExpand,
//         setExpandedResult,
//         artifactDashboardUrl,
//     } = props;
//
//     const brokerMsgBody = getTestMsgBody(aChild);
//     const testcaseName = getTestcaseName(aChild);
//     /*
//      * Expand a specific testcase according to query string and scroll to it
//      * ?focus=tc:<test-case-name>
//      */
//     const onToggle = () => {
//         if (forceExpand) {
//             setExpandedResult('');
//         } else {
//             const key = testcaseName;
//             setExpandedResult(key);
//         }
//     };
//     /** Note for info test results */
//     const thread_id = getThreadID({ brokerMsgBody });
//     const resultClasses = classNames(styles.helpSelect, {
//         [styles.expandedResult]: forceExpand,
//     });
//     const toRender = (
//         <DataListItem
//             key={thread_id}
//             isExpanded={forceExpand}
//             className={resultClasses}
//             aria-labelledby="artifact-item-result"
//         >
//             <DataListItemRow>
//                 <DataListToggle
//                     id="toggle"
//                     onClick={onToggle}
//                     isExpanded={forceExpand}
//                 />
//                 <DataListItemCells
//                     className="pf-u-m-0 pf-u-p-0"
//                     dataListCells={[
//                         <DataListCell
//                             className="pf-u-m-0 pf-u-p-0"
//                             key="secondary content"
//                         >
//                             <FaceForAChildTestMsg
//                                 aChild={aChild}
//                                 artifactDashboardUrl={artifactDashboardUrl}
//                             />
//                         </DataListCell>,
//                     ]}
//                 />
//             </DataListItemRow>
//             <DataListContent
//                 aria-label="State details"
//                 id="ex-result-expand"
//                 isHidden={!forceExpand}
//             >
//                 <BodyForTestMsgState
//                     aChild={aChild}
//                     artifact={artifact}
//                     isVisible={forceExpand}
//                 />
//             </DataListContent>
//         </DataListItem>
//     );
//
//     return toRender;
// };

// // XXX Was: FaceForKaiState
// const FaceForAChildTestMsg: React.FC<FaceForTestMsgStateProps> = (props) => {
//     const { artifactDashboardUrl, aChild } = props;
//     let result = getTestMsgExtendedStatus(aChild);
//     return (
//         <Flex>
//             <Flex flex={{ default: 'flex_1' }}>
//                 <Flex>
//                     <TestStatusIcon status={result} />
//                 </Flex>
//                 <Flex flexWrap={{ default: 'nowrap' }}>
//                     <StageName aChild={aChild} />
//                 </Flex>
//             </Flex>
//             <Flex flex={{ default: 'flex_1' }}>
//                 <Flex>
//                     <TestMsgStateActions aChild={aChild} />
//                 </Flex>
//                 <Flex>
//                     <AChildLink
//                         artifactDashboardUrl={artifactDashboardUrl}
//                         aChild={aChild}
//                     />
//                 </Flex>
//             </Flex>
//         </Flex>
//     );
// };

//const StageName: React.FC<PropsWithTestMsgAChild> = (props) => {
//    const { aChild } = props;
//    const brokerMsgBody = getTestMsgBody(aChild);
//    const msgStageName = getMsgStageName(aChild);
//    if (msgStageName === 'dispatch') {
//        return <>{`dispatcher / ${_.get(brokerMsgBody, 'ci.name')}`}</>;
//    }
//    if (msgStageName === 'build') {
//        return <>build</>;
//    }
//    const testcaseName = getTestcaseName(aChild);
//    return (
//        <TextContent>
//            <Text>{testcaseName}</Text>
//        </TextContent>
//    );
//};
//
//interface FaceForTestMsgStateProps extends PropsWithTestMsgAChild {
//    artifactDashboardUrl: string;
//}
