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
import { Button } from '@patternfly/react-core';
import { RedoIcon, BookIcon } from '@patternfly/react-icons';
import styles from '../custom.module.css';
import { Metadata, AChildTestMsg } from '../types';

export interface PropsWithTestMsgAChild {
    aChild: AChildTestMsg;
    metadata?: Metadata;
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

// DELETE:

//
// export const TestMsgStateActions: React.FC<PropsWithTestMsgAChild> = (
//     props,
// ) => {
//     const { aChild } = props;
//     const brokerMsgBody = getTestMsgBody(aChild);
//     const docsUrl = getUmbDocsUrl(brokerMsgBody);
//     const rerunUrl = getRerunUrl(aChild);
//     return (
//         <Flex style={{ minWidth: '20em' }}>
//             <Flex flex={{ default: 'flex_1' }}></Flex>
//             <Flex flex={{ default: 'flex_1' }}>
//                 <TestMsgRerunButton rerunUrl={rerunUrl} />
//             </Flex>
//             <Flex flex={{ default: 'flex_1' }}>
//                 <TestMsgDocsButton docsUrl={docsUrl} />
//             </Flex>
//         </Flex>
//     );
// };
//

// export interface TestMsgStateMappingProps extends PropsWithTestMsgAChild {
//     artifact: Artifact;
// }
//
// export const TestMsgStateMapping: React.FC<TestMsgStateMappingProps> = (
//     props,
// ) => {
//     const { artifact, aChild } = props;
//     const brokerMsgBody = getTestMsgBody(aChild);
//     const brokerMsgId = getMsgId(aChild);
//     let pairs: string[][] = [];
//     if (MSG_V_1.isMsg(brokerMsgBody)) {
//         pairs = mkPairs(schemaMappingV1, brokerMsgBody);
//     } else if (MSG_V_0_1.isMsg(brokerMsgBody)) {
//         pairs = mkPairs(schemaMappingV01, brokerMsgBody);
//     } else {
//         return null;
//     }
//     const aType = getAType(artifact);
//     const brokerMsgUrl = getDatagrepperUrl(brokerMsgId, aType);
//     pairs.push(['broker msg', brokerMsgUrl]);
//     const elements: JSX.Element[] = _.map(pairs, ([name, value]) =>
//         mkLabel(name, value, 'green'),
//     );
//     return (
//         <Flex>
//             <FlexItem>
//                 <AChildDetailsEntry caption="Result details">
//                     <Flex direction={{ default: 'column' }}>
//                         <FlexItem key="1">
//                             <StateExplain aChild={aChild} />
//                         </FlexItem>
//                         <FlexItem key="2">
//                             <DescriptionList
//                                 isCompact
//                                 isHorizontal
//                                 columnModifier={{
//                                     default: '2Col',
//                                 }}
//                             >
//                                 {elements}
//                             </DescriptionList>
//                         </FlexItem>
//                     </Flex>
//                 </AChildDetailsEntry>
//             </FlexItem>
//         </Flex>
//     );
// };

// const schemaMappingV01 = [
//     ['notification.recipients', 'recipients'],
//     ['reason', 'error reason'],
// ];
//
// const StateExplain: React.FC<PropsWithTestMsgAChild> = (props) => {
//     const { aChild } = props;
//     const brokerMsgBody = getTestMsgBody(aChild);
//     const explain: { [key in MsgStateName]?: JSX.Element } = {
//         running: (
//             <Alert isInline isPlain title="Test running" variant="info">
//                 Testing has been started and is in progress.
//             </Alert>
//         ),
//         queued: (
//             <Alert isInline isPlain title="Test queued" variant="info">
//                 Test has been queued, but has not yet started.
//             </Alert>
//         ),
//         error: (
//             <Alert isInline isPlain title="Test error." variant="warning">
//                 Testing was aborted due to an error in the pipeline. This might
//                 be, for instance, an infrastructure error or a CI system error.
//                 Please, contact the CI system maintainers for further
//                 information.
//             </Alert>
//         ),
//     };
//     const columns: JSX.Element[] = [];
//     const mgStateName = getMsgStateName(aChild);
//     const stateExplanation = _.get(explain, mgStateName, null);
//     if (stateExplanation) {
//         columns.push(stateExplanation);
//     }
//     let errorReason: string | undefined;
//     let errorIssueUrl: string | undefined;
//     if (MSG_V_1.isMsg(brokerMsgBody)) {
//         errorReason = _.get(brokerMsgBody, 'error.reason');
//         errorIssueUrl = _.get(brokerMsgBody, 'error.issue_url');
//     } else if (MSG_V_0_1.isMsg(brokerMsgBody)) {
//         errorReason = _.get(brokerMsgBody, 'reason');
//         errorIssueUrl = _.get(brokerMsgBody, 'issue_url');
//     }
//     if (!_.isNil(errorReason)) {
//         const jsxElement = (
//             <Alert isInline isPlain title="CI system error" variant="warning">
//                 {errorReason} <LinkifyNewTab>{errorIssueUrl}</LinkifyNewTab>
//             </Alert>
//         );
//         columns.push(jsxElement);
//     }
//     if (_.size(columns)) {
//         return (
//             <Flex direction={{ default: 'column' }}>
//                 {_.map(columns, (c) => (
//                     <FlexItem>{c}</FlexItem>
//                 ))}
//             </Flex>
//         );
//     }
//     return null;
// };

// /**
//  * v 1.x
//  */
// const schemaMappingV1 = [
//     ['contact.name', 'ci name'],
//     ['contact.team', 'ci team'],
//     ['contact.docs', 'ci docs'],
//     ['contact.email', 'ci email'],
//     ['contact.url', 'ci web ui'],
//     ['contact.irc', 'ci irc'],
//     ['contact.slack', 'ci slack'],
//     ['contact.version', 'ci version'],
//     ['notification.recipients', 'recipients'],
//     ['run.url', 'run details'],
//     ['run.log', 'logs'],
//     ['test.category', 'test category'],
//     ['test.docs', 'test docs'],
//     ['test.label', 'test label'],
//     ['test.lifetime', 'test lifetime'],
//     ['test.lifetime', 'test namespace'],
//     ['test.note', 'test note'],
//     ['test.progress', 'test progress'],
//     ['test.type', 'test type'],
//     ['test.scenario', 'test scenario'],
// ];

// /**
//  * Display the note associated with a result as provided by the CI system if available.
//  */
// export function ResultNote(props: PropsWithTestMsgAChild) {
//     const { aChild } = props;
//     const brokerMsgBody = getTestMsgBody(aChild);
//     let note: string | undefined;
//     if (MSG_V_0_1.isMsg(brokerMsgBody)) {
//         note = brokerMsgBody.note;
//     } else if (MSG_V_1.isMsg(brokerMsgBody)) {
//         note = brokerMsgBody.test.note;
//     }
//     if (_.isEmpty(note)) return null;
//     return (
//         <Alert isInline title="Note from CI system" variant="info">
//             {note}
//         </Alert>
//     );
// }
