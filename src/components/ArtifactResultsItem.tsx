/*
 * This file is part of ciboard

 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
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
import * as React from 'react';
import moment from 'moment';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import {
    Flex,
    Alert,
    Label,
    Text,
    Badge,
    Button,
    FlexItem,
    TextContent,
    DataListCell,
    DataListItem,
    DataListToggle,
    DataListItemRow,
    DataListItemCells,
    DataListContent,
} from '@patternfly/react-core';

import Linkify from 'linkifyjs/react';

import {
    ArrowIcon,
    RebootingIcon,
    OutlinedThumbsUpIcon,
    OutlinedEnvelopeIcon,
} from '@patternfly/react-icons';

import styles from '../custom.module.css';
import TestSuites from './TestSuites';
import { config } from '../config';
import {
    getThreadID,
    getTestcaseName,
    renderStatusIcon,
} from '../utils/artifactUtils';
import { DB, MSG_V_1, MSG_V_0_1, BrokerMessagesType } from '../types';

type ContactEntryNameType = 'email' | 'irc' | 'name';

const getContactField = (
    broker_msg_body: BrokerMessagesType,
    name: ContactEntryNameType,
) => {
    if (MSG_V_0_1.isMsg(broker_msg_body)) {
        if (
            broker_msg_body.ci &&
            broker_msg_body.ci[name] &&
            broker_msg_body.ci[name] !== 'null'
        )
            return broker_msg_body.ci[name];
    }
    if (MSG_V_1.isMsg(broker_msg_body)) {
        if (
            broker_msg_body.contact &&
            broker_msg_body.contact[name] &&
            broker_msg_body.contact[name] !== 'null'
        )
            return broker_msg_body.contact[name];
    }
    /** uknown contact field */
    return 'n/a';
};

const renderError = (broker_msg_body: BrokerMessagesType) => {
    let reasonStr = '';
    if (MSG_V_0_1.isMsg(broker_msg_body) && 'reason' in broker_msg_body) {
        reasonStr = broker_msg_body.reason;
    }
    if (MSG_V_1.isMsg(broker_msg_body) && 'error' in broker_msg_body) {
        reasonStr = broker_msg_body.error.reason;
    }
    const reason = _.find([reasonStr, 'Error without any reason.'], _.identity);
    return (
        <div>
            <Alert isInline type="warning" title={reason} />
        </div>
    );
};

interface StageNameProps {
    state: DB.StateType;
}

const StageName: React.FC<StageNameProps> = (props) => {
    const {
        state: { kai_state, broker_msg_body },
    } = props;
    if (kai_state.stage === 'dispatch') {
        return <>`dispatcher / ${getContactField(broker_msg_body, 'name')}`</>;
    }
    if (kai_state.stage === 'build') {
        return <>'build'</>;
    }
    const name = getTestcaseName({ broker_msg_body });
    return (
        <TextContent>
            <Text>{name}</Text>
        </TextContent>
    );
};

/** Return true if result is gating, false otherwise */
const isResultGating = (
    state: DB.StateType,
    artifact: DB.ArtifactType,
): boolean => {
    const { broker_msg_body, kai_state } = state;
    const testcase = getTestcaseName({ broker_msg_body, kai_state });
    const decision = artifact.gating_decision;
    if (_.isEmpty(decision) || _.isEmpty(decision?.summary)) {
        return false;
    }
    const satisfied = decision?.satisfied_requirements;
    const unsatisfied = decision?.unsatisfied_requirements;
    const decisionResults = decision?.results;
    let testcaseUrl = null;
    if ('run' in broker_msg_body) testcaseUrl = broker_msg_body.run.url;
    if (
        _.isNil(satisfied) ||
        _.isNil(unsatisfied) ||
        _.isNil(decisionResults)
    ) {
        return false;
    }
    for (let index = 0; index < _.size(satisfied); index++) {
        const decisionTestcase = satisfied[index].testcase;
        const decisionTestcaseID = satisfied[index].result_id;
        const decisionTest = decisionResults.filter(
            (r) => r.result_id === decisionTestcaseID,
        )[0];
        /** not interrested in test case name that is not the one requested */
        // XXX: decisionTestcase !== testcase
        if (decisionTestcase.name !== testcase) {
            continue;
        }
        /** a missing gating test is always gating */
        if (!decisionTest) {
            return true;
        }
        const decisionTesturl = decisionTest.ref_url;
        /** testcase can be an object or directly a string */
        if (testcaseUrl && testcaseUrl === decisionTesturl) {
            return true;
        }
    }
    for (let index = 0; index < _.size(unsatisfied); index++) {
        const decisionTestcase = unsatisfied[index].testcase;
        const decisionType = unsatisfied[index].type;
        if (
            decisionType === 'test-result-failed' ||
            decisionType === 'test-result-missing'
        ) {
            const decisionTestcaseID = unsatisfied[index].result_id;
            const decisionTest = decisionResults.filter(
                (r) => r.id === decisionTestcaseID,
            )[0];
            /** a missing gating test is always gating */
            if (!decisionTest) {
                return true;
            }
            /** not interrested in test case name that is not the one requested */
            if (
                decisionTestcase.name !== testcase &&
                decisionTestcase !== testcase
            ) {
                continue;
            }
            const decisionTesturl = decisionTest.ref_url;
            if (testcaseUrl && testcaseUrl === decisionTesturl) {
                return true;
            }
        } else {
            /** testcase can be an object or directly a string */
            if (
                decisionTestcase.name === testcase ||
                decisionTestcase === testcase
            ) {
                return true;
            }
        }
    }
    return false;
};

/** Return the waiver if present for the result, null otherwise */
export const getResultWaiver = (
    state: DB.StateType,
    artifact: DB.ArtifactType,
) => {
    const { broker_msg_body } = state;
    if (!artifact.gating_decision) return null;
    const { waivers } = artifact.gating_decision;
    if (!waivers || _.size(waivers) === 0) return null;
    const testcase = getTestcaseName({ broker_msg_body });
    for (let index = 0; index < _.size(waivers); index++) {
        const waivedTestcase = waivers[index].testcase;
        /** testcase can be an object or directly a string */
        if (waivedTestcase === testcase) {
            /** eslint-disable-next-line consistent-return */
            return waivers[index];
        }
    }
    return null;
};

/**
 * 0.1.x: .label - string
 * 0.2.x: test.label - string[]
 */
const mkLabels = (broker_msg_body: BrokerMessagesType): Array<JSX.Element> => {
    let labels: string | Array<string> = [];
    if (MSG_V_0_1.isMsg(broker_msg_body)) {
        if (!broker_msg_body.label) {
            return [];
        }
        labels = broker_msg_body.label;
    }
    if (MSG_V_1.isMsg(broker_msg_body)) {
        if (!broker_msg_body.test.label) {
            return [];
        }
        labels = broker_msg_body.test.label;
    }
    var labels_str: Array<string> = [];
    if (typeof labels === 'string') {
        /** Workaround with convert array string to array */
        if (labels.startsWith('[')) {
            labels_str = labels.replace(/^\[|\]$|'|\s+/g, '').split(',');
            /** Get rid of python unicode identifier 'u' */
            for (const key in labels_str) {
                if (labels_str.hasOwnProperty(key))
                    labels_str[key] = labels_str[key].substr(1);
            }
        } else {
            labels_str.push(labels);
        }
    } else {
        labels_str.push(...labels);
    }
    const components: Array<JSX.Element> = [];
    for (const key in labels_str) {
        if (_.has(labels_str, key)) {
            components.push(
                <Badge isRead key={labels_str[key]}>
                    <TextContent>
                        <Text component="small">{labels_str[key]}</Text>
                    </TextContent>
                </Badge>,
                <>' '</>,
            );
        }
    }
    return components;
};

interface TimestampForUserProps {
    timestamp: string;
    fromNow?: boolean;
}
const TimestampForUser: React.FC<TimestampForUserProps> = (props) => {
    const { timestamp, fromNow = false } = props;
    const time = moment.utc(timestamp).local().format('YYYY-MM-DD HH:mm Z');
    if (!fromNow) {
        return <>{time}</>;
    }
    const passed = moment.utc(timestamp).local().fromNow();
    const ret = time + ' (' + passed + ')';
    return <>{ret}</>;
};

interface WaiverInfoProps {
    waiver: any;
}
export const WaiverInfo: React.FC<WaiverInfoProps> = (props) => {
    const { waiver } = props;
    if (!waiver) {
        return <></>;
    }
    const element = (
        <>
            <h3>
                Waived by {waiver.username} on{' '}
                <TimestampForUser timestamp={waiver.timestamp} />
            </h3>
            <Alert isInline type="success" title="Waiver comment">
                <p>
                    <Linkify>{waiver.comment}</Linkify>
                </p>
            </Alert>
        </>
    );
    return element;
};

const MsgRunning: React.FC = () => {
    const element = <Alert isInline type="info" title="Test is in progress." />;
    return element;
};

const MsgError: React.FC = () => {
    const element = (
        <>
            <Alert isInline type="info" title="Test error." />
        </>
    );
    return element;
};

const MsgMissing = () => {
    /** XXX: time based check and provide a more reasonable error */
    const element = (
        <Alert isInline variant="info" title="Required gating test">
            <div>
                This required gating test has missing results. If this situation
                persists for more then few minutes, it can mean the following:
            </div>
            <div>
                <ol>
                    <li>
                        It s a manual testcase and it is waiting to be submitted
                        via the{' '}
                        <a href="https://docs.engineering.redhat.com/display/RHELPLAN/Manual+Gating+workflow">
                            manual gating workflow
                        </a>
                        .
                    </li>
                    <li>
                        Your gating.yaml is misconfigured and is expecting a
                        testcase that will never run for the artifact. Make sure
                        all testcases are configured correctly in the
                        gating.yaml file. For list of possible testcases{' '}
                        <a href="https://docs.engineering.redhat.com/display/RHELPLAN/Available+tests+and+gating+overview">
                            see this list.
                        </a>{' '}
                        Note that some of the tests are configured globally,
                        like osci.brew-build.installability.functional or
                        osci.brew-build.rpmdeplint.functional. Missing tests for
                        these are expected for older builds.
                    </li>
                    <li>
                        There is an outage or significant load affecting CI
                        systems or Gating.
                    </li>
                    <li>
                        There is some other problem. Contact #osci or
                        osci-list@redhat.com for help.
                    </li>
                    <li>
                        If this cannot wait,{' '}
                        <a href="https://mojo.redhat.com/docs/DOC-1166445#jive_content_id_How_to_submit_a_waiver">
                            waive the missing test via cli.
                        </a>
                    </li>
                </ol>
            </div>
        </Alert>
    );
    return element;
};

const MsgQueued: React.FC = () => {
    const element = (
        <Alert isInline type="info" title="Queued test">
            Test was queued and it waiting to be run. If this takes more then an
            hour, please manually retest.
        </Alert>
    );
    return element;
};

interface WaiveButtonProps {
    artifact: DB.ArtifactType;
    stateName: DB.CurrentStateExtendedNameType;
    broker_msg_body: BrokerMessagesType;
}
const WaiveButton: React.FC<WaiveButtonProps> = (props) => {
    const { artifact, stateName, broker_msg_body } = props;
    const dispatch = useDispatch();
    if (!artifact.gate_tag_name) {
        /** XXX: https://projects.engineering.redhat.com/browse/OSCI-1384 */
        return null;
    }
    const can_be_waived =
        (stateName === 'error' || stateName === 'failed') &&
        (artifact.type !== 'brew-build' ||
            (artifact.type === 'brew-build' &&
                artifact.payload.scratch === false));
    if (!can_be_waived) {
        return null;
    }
    const onClick: React.MouseEventHandler = (e) => {
        e.stopPropagation();
        // XXX: dispatch(createWaiver(artifact, broker_msg_body));
    };
    return (
        <Button key="waived" variant="secondary" onClick={onClick}>
            <OutlinedThumbsUpIcon />
            <span className={styles.waive}>waive</span>
        </Button>
    );
};

interface ReTestButtonProps {
    state: DB.StateType;
}

const ReTestButton: React.FC<ReTestButtonProps> = (props) => {
    const {
        state: { kai_state, broker_msg_body },
    } = props;
    if (!broker_msg_body.run) {
        return null;
    }
    return (
        <a
            href={broker_msg_body.run.rebuild}
            key={kai_state.thread_id}
            target="_blank"
            title="Rerun testing. Note login to the linked system might be required."
            rel="noopener noreferrer"
        >
            <Button
                variant="secondary"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <RebootingIcon />
            </Button>
        </a>
    );
};

interface LogLinkProps {
    broker_msg_body: BrokerMessagesType;
}
const LogLink: React.FC<LogLinkProps> = (props) => {
    const { broker_msg_body } = props;
    if (!broker_msg_body.run || !broker_msg_body.run.log) {
        return null;
    }
    return (
        <a
            href={broker_msg_body.run.log}
            target="_blank"
            key="log"
            title="Log from the testing."
            rel="noopener noreferrer"
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            log
        </a>
    );
};

interface DebugLogLinkProps {
    broker_msg_body: BrokerMessagesType;
}
const DebugLogLink: React.FC<DebugLogLinkProps> = (props) => {
    const { broker_msg_body } = props;
    if (!broker_msg_body.run || !broker_msg_body.run.debug) {
        return null;
    }
    return (
        <a
            href={broker_msg_body.run.debug}
            key="debuglog"
            target="_blank"
            title="Debug log from the testing."
            rel="noopener noreferrer"
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            debug
        </a>
    );
};

interface DocsLinkProps {
    stateName: DB.CurrentStateExtendedNameType;
    isGatingResult: boolean;
    broker_msg_body: BrokerMessagesType;
}

const DocsLink: React.FC<DocsLinkProps> = (props) => {
    const { broker_msg_body, stateName, isGatingResult } = props;
    let docs: string | undefined = '';
    if (MSG_V_0_1.isMsg(broker_msg_body) && 'docs' in broker_msg_body) {
        docs = broker_msg_body.docs;
    } else if (MSG_V_1.isMsg(broker_msg_body)) {
        docs = broker_msg_body.test.docs;
    }
    if (_.isNil(docs)) {
        return null;
    }
    const isBold =
        isGatingResult &&
        !(
            stateName === 'complete' ||
            stateName === 'passed' ||
            stateName === 'waived'
        );
    var style: React.CSSProperties = isBold
        ? { fontWeight: 'bolder' }
        : { fontWeight: 'lighter' };
    return (
        <a
            href={docs}
            key="docslink"
            target="_blank"
            title="Documentation for test."
            rel="noopener noreferrer"
            style={style}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            docs
        </a>
    );
};

interface ResultLinkProps {
    broker_msg_body: BrokerMessagesType;
    artifactDashboardUrl: string;
}
const ResultLink: React.FC<ResultLinkProps> = (props) => {
    const { broker_msg_body, artifactDashboardUrl } = props;
    const thread_id = getThreadID({ broker_msg_body });
    return (
        <a
            href={`${artifactDashboardUrl}?focus=id:${thread_id}`}
            title="Result link"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            <ArrowIcon style={{ height: '0.75em' }} />
        </a>
    );
};

/** XXX : spec 0.1.x 
interface WowProps {
    broker_msg_body: BrokerMessagesType;
}
const Wow: React.FC<WowProps> = (props) => {
    const { broker_msg_body } = props;
    if (!broker_msg_body.run || !broker_msg_body.run.additional_info) {
        return null;
    }
    if (
        !('run' in broker_msg_body) ||
        !('additional_info' in broker_msg_body.run) ||
        !('wow_options' in broker_msg_body.run.additional_info)
    )
        return null;
    return (
        <span>
            <Label>wow</Label>
            <Label>{result.run.additional_info.argv[0]}</Label>
        </span>
    );
};
*/

interface FaceForResultsProps {
    state: DB.StateType;
    isWaived: boolean;
    artifact: DB.ArtifactType;
    artifactDashboardUrl: string;
}

const FaceForResults: React.FC<FaceForResultsProps> = (props) => {
    const { state, isWaived, artifact, artifactDashboardUrl } = props;
    const { broker_msg_body, kai_state } = state;
    const labels = mkLabels(broker_msg_body);
    var badgeClasses = classNames(styles.isRedBG, {
        [styles.isHidden]: !isWaived,
    });
    labels.push(
        <Badge key="waived" className={badgeClasses}>
            waived
        </Badge>,
    );
    const isGatingResult = isResultGating(state, artifact);
    badgeClasses = classNames({
        [styles.isHidden]: !isGatingResult,
    });
    labels.push(
        <Badge key="required" className={badgeClasses}>
            required for gating
        </Badge>,
    );
    const element = (
        <Flex style={{ minHeight: '34px' }}>
            <FlexItem>{renderStatusIcon(kai_state.state)}</FlexItem>
            <Flex flexWrap={{ default: 'nowrap' }}>
                <StageName state={state} />
            </Flex>
            <Flex grow={{ default: 'grow' }}>
                <FlexItem align={{ default: 'alignRight' }}>{labels}</FlexItem>
            </Flex>
            <Flex
                align={{ default: 'alignRight' }}
                style={{ minWidth: '26ch' }}
            >
                <FlexItem style={{ minWidth: '5ch' }}>
                    <WaiveButton
                        broker_msg_body={broker_msg_body}
                        stateName={kai_state.state}
                        artifact={artifact}
                    />
                </FlexItem>
                <FlexItem>
                    <ReTestButton state={state} />
                </FlexItem>
                <FlexItem>
                    <LogLink broker_msg_body={broker_msg_body} />
                </FlexItem>
                <FlexItem style={{ minWidth: '5ch' }}>
                    <DebugLogLink broker_msg_body={broker_msg_body} />
                </FlexItem>
                <FlexItem style={{ minWidth: '4ch' }}>
                    <DocsLink
                        broker_msg_body={broker_msg_body}
                        stateName={kai_state.state}
                        isGatingResult={isGatingResult}
                    />
                </FlexItem>
                <Flex align={{ default: 'alignRight' }}>
                    <ResultLink
                        broker_msg_body={broker_msg_body}
                        artifactDashboardUrl={artifactDashboardUrl}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
    return element;
};

interface ArtifactResultsItemProps {
    state: DB.StateType;
    artifact: DB.ArtifactType;
    stateName: DB.CurrentStateExtendedNameType;
    forceExpand: boolean;
    setExpandedResult: React.Dispatch<React.SetStateAction<string>>;
    artifactDashboardUrl: string;
}

const ArtifactResultsItem: React.FC<ArtifactResultsItemProps> = (props) => {
    const {
        state,
        artifact,
        stateName,
        forceExpand,
        setExpandedResult,
        artifactDashboardUrl,
    } = props;
    const { broker_msg_body, kai_state } = state;
    /**
    * state: waived missing, missing, error, info
    * result.xunit
    * result.label
    * labels is [] if <Label>

    * this.state = {
    *     error: null,
    *     showWaiveForm: false,
    *     waiveError: undefined,
    * };
    * const query = undefined;
    * const reason = undefined;
    */
    /*
     * Expand a specific testcase according to query string and scroll to it
     * ?focus=tc:<test-case-name> or ?focus=id:<pipeline-id>
     */
    const onToggle = () => {
        if (!forceExpand) {
            const key = kai_state.msg_id || kai_state.test_case_name;
            setExpandedResult(key);
        } else if (forceExpand) {
            setExpandedResult('');
        }
    };

    /** note for info test results */
    let resultNote =
        'This testing was skipped. The CI system did not provide any reason why. Contact the CI system according to given contacts to find out more.';
    if (MSG_V_1.isMsg(broker_msg_body)) {
        const note = broker_msg_body.test.note;
        if (note) {
            resultNote = note;
        }
    }
    let resultClasses = classNames(styles['helpSelect'], {
        [styles.expandedResult]: forceExpand,
    });
    let recipients = null;
    if (
        'notification' in broker_msg_body &&
        broker_msg_body.notification?.recipients &&
        _.size(broker_msg_body.notification?.recipients)
    ) {
        recipients = (
            <Label>
                <Flex>
                    <FlexItem>
                        <TextContent>
                            <Text component="small">
                                <OutlinedEnvelopeIcon size="sm" />
                            </Text>
                        </TextContent>
                    </FlexItem>
                    <FlexItem>
                        <TextContent>
                            <Text component="small">
                                {broker_msg_body.notification.recipients.join(
                                    ', ',
                                )}
                            </Text>
                        </TextContent>
                    </FlexItem>
                </Flex>
            </Label>
        );
    }
    let umb_msg = null;
    if (kai_state.msg_id) {
        /** XXX: for Fedora Datagrepper add prefix: 2021- */
        umb_msg = (
            <>
                {
                    <a
                        href={`${config.datagrepper.url}/id?id=${kai_state.msg_id}&is_raw=true&size=extra-large`}
                        target="_blank"
                        title="Result UMB message."
                        rel="noopener noreferrer"
                    >
                        <Label>
                            <TextContent>
                                <Text component="small">UMB msg</Text>
                            </TextContent>
                        </Label>
                    </a>
                }
            </>
        );
    }
    let docs_link = null;
    if (MSG_V_1.isMsg(broker_msg_body) && broker_msg_body.contact.docs) {
        docs_link = (
            <>
                {
                    <a
                        href={broker_msg_body.contact.docs}
                        target="_blank"
                        title="Link to documentation with details about the system."
                        rel="noopener noreferrer"
                    >
                        <Label>
                            <TextContent>
                                <Text component="small">
                                    About the test-system
                                </Text>
                            </TextContent>
                        </Label>
                    </a>
                }
            </>
        );
    }
    let url_link = null;
    if (MSG_V_1.isMsg(broker_msg_body) && broker_msg_body.contact.url) {
        url_link = (
            <>
                {
                    <a
                        href={broker_msg_body.contact.url}
                        target="_blank"
                        title="URL link to the system or system's web interface."
                        rel="noopener noreferrer"
                    >
                        <Label>
                            <TextContent>
                                <Text component="small">WebUI</Text>
                            </TextContent>
                        </Label>
                    </a>
                }
            </>
        );
    }
    const thread_id = getThreadID({ broker_msg_body });
    const toRender = (
        <DataListItem
            key={thread_id}
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
                            <FaceForResults
                                isWaived={false}
                                state={state}
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
                {forceExpand && (
                    <>
                        <Flex>
                            <FlexItem>
                                <Label>
                                    <TextContent>
                                        <Text component="small">
                                            <TimestampForUser
                                                timestamp={_.toString(
                                                    broker_msg_body.generated_at,
                                                )}
                                                fromNow
                                            />
                                        </Text>
                                    </TextContent>
                                </Label>
                            </FlexItem>
                            <FlexItem>
                                <Label>
                                    <TextContent>
                                        <Text component="small">
                                            contact:{' '}
                                            {getContactField(
                                                broker_msg_body,
                                                'email',
                                            )}
                                        </Text>
                                    </TextContent>
                                </Label>
                            </FlexItem>
                            <FlexItem>
                                <Label>
                                    <TextContent>
                                        <Text component="small">
                                            irc:{' '}
                                            {getContactField(
                                                broker_msg_body,
                                                'irc',
                                            )}
                                        </Text>
                                    </TextContent>
                                </Label>
                            </FlexItem>
                            <FlexItem>{docs_link}</FlexItem>
                            <FlexItem>{url_link}</FlexItem>
                            <FlexItem>{recipients}</FlexItem>
                            <FlexItem></FlexItem>
                            <FlexItem>{umb_msg}</FlexItem>
                        </Flex>
                        {stateName === 'error' && renderError(broker_msg_body)}
                        {stateName === 'info' &&
                            kai_state.stage === 'dispatcher' && (
                                <Alert isInline type="info" title="No results">
                                    CI has reacted on this build, if no other
                                    results are available, it means no testing
                                    was enabled. Contact #osci or #baseosci for
                                    info how to add new tests.
                                </Alert>
                            )}
                        {stateName === 'info' && kai_state.stage === 'test' && (
                            <Alert isInline type="info" title="Result note">
                                {resultNote}
                            </Alert>
                        )}
                        {stateName === 'running' && <MsgRunning />}
                        {stateName === 'queued' && <MsgQueued />}
                        {stateName === 'missing' && <MsgMissing />}
                        {stateName === 'error' && <MsgError />}
                        {(stateName === 'passed' ||
                            stateName === 'failed' ||
                            /** XXX: [OSCI-1861]: info messages also can have xunit */
                            stateName === 'info') && (
                            <TestSuites state={state} artifact={artifact} />
                        )}
                    </>
                )}
            </DataListContent>
        </DataListItem>
    );

    return toRender;
};

export default ArtifactResultsItem;
