/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2023 Andrei Stepanov <astepano@redhat.com>
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
import moment from 'moment';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import classNames from 'classnames';
import {
    Tab,
    Tabs,
    List,
    Flex,
    Alert,
    Spinner,
    FlexItem,
    ListItem,
    OrderType,
    HelperText,
    TabTitleText,
    ListComponent,
    HelperTextItem,
    DescriptionList,
    HelperTextItemProps,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
} from '@patternfly/react-core';
import {
    Td,
    Th,
    Tr,
    Tbody,
    Thead,
    TableComposable,
} from '@patternfly/react-table';

import styles from '../../custom.module.css';
import { config, mappingDatagrepperUrl } from '../../config';
import {
    getANvr,
    getMsgId,
    getAType,
    getATaskid,
    getABuildId,
    getEtaMsgBody,
    getAEtaChildren,
    TabClickHandlerType,
    ErrataAutomationBugCiStatus,
} from '../../types';
import {
    ArtifactsDetailedInfoKojiTask,
    ArtifactsDetailedInfoModuleBuild,
    ArtifactsDetailedInfoKojiTaskData,
    ArtifactsDetailedInfoModuleBuildData,
} from '../../queries/Artifacts';
import {
    LinkedErrataAdvisories,
    ErrataLinkedAdvisoriesReply,
} from '../../queries/Errata';
import {
    Artifact,
    ArtifactRpm,
    AChildEtaMsg,
    KojiBuildTag,
    kojiInstance,
    KojiInstance,
    isArtifactMbs,
    isArtifactRpm,
    KojiBuildInfo,
    KojiBuildTagging,
    ErrataLinkedAdvisory,
} from '../../types';
import {
    LinkifyNewTab,
    mkLinkMbsBuild,
    mkLinkFileInGit,
    mkLinkKojiWebTask,
    mkLinkKojiWebTagId,
    mkLinkKojiWebUserId,
    mkLinkKojiWebBuildId,
    mkCommitHashFromSource,
    mkLinkPkgsDevelFromSource,
} from '../../utils/utils';
import { ExternalLink } from '../ExternalLink';
import { secondsToTimestampWithTz } from '../../utils/timeUtils';

interface NoDataProps {
    show: boolean;
}
const NoData: React.FC<NoDataProps> = (props) => {
    const { show } = props;
    if (!show) {
        return null;
    }
    return (
        <Flex className="pf-u-p-lg">
            <Alert
                isInline
                isPlain
                title="No build information available"
                variant="info"
            />
        </Flex>
    );
};

export interface LoadingDataProps {
    show: boolean;
}

export const LoadingData: React.FC<LoadingDataProps> = (props) => {
    const { show } = props;
    if (!show) {
        return null;
    }
    return (
        <Flex className="pf-u-p-lg">
            <FlexItem>
                <Spinner className="pf-u-mr-md" size="md" /> Loading build info…
            </FlexItem>
        </Flex>
    );
};

interface BuildInfoProps {
    build: KojiBuildInfo | undefined;
    instance: KojiInstance;
}
const BuildInfo: React.FC<BuildInfoProps> = (props) => {
    const { build, instance } = props;
    if (_.isNil(build)) {
        return null;
    }
    /* Time of build */
    const buildTimeLocal = moment.unix(build.completion_ts).local();
    const buildTimeWithTz = buildTimeLocal.format('YYYY-MM-DD HH:mm ZZ');
    /* Time of commit */
    let commitTimeWithTz = 'n/a';
    if (build.commit_obj) {
        const commitTimeLocal = moment
            .unix(build.commit_obj.committer_date_seconds)
            .local();
        if (commitTimeLocal.isValid())
            commitTimeWithTz = commitTimeLocal.format('YYYY-MM-DD HH:mm ZZ');
    }

    const descListClassName = classNames(
        'pf-u-px-lg',
        'pf-u-py-md',
        styles['buildInfo'],
    );

    return (
        <DescriptionList
            className={descListClassName}
            columnModifier={{ default: '2Col' }}
            isAutoColumnWidths
            isCompact
            isHorizontal
        >
            <DescriptionListGroup>
                <DescriptionListTerm>Build ID</DescriptionListTerm>
                <DescriptionListDescription>
                    <a
                        href={mkLinkKojiWebBuildId(build.build_id, instance)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {build.build_id}
                    </a>
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Git commit</DescriptionListTerm>
                <DescriptionListDescription>
                    <a
                        className={styles['commitHash']}
                        href={mkLinkPkgsDevelFromSource(build.source, instance)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {mkCommitHashFromSource(build.source)}
                    </a>
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Build owner</DescriptionListTerm>
                <DescriptionListDescription>
                    <a
                        href={mkLinkKojiWebUserId(build.owner_id, instance)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {build.owner_name}
                    </a>
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Committer</DescriptionListTerm>
                <DescriptionListDescription>
                    {build.commit_obj?.committer_name || 'n/a'}
                    &nbsp;&lt;
                    {build.commit_obj?.committer_email || 'n/a'}
                    &gt;
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Build completed</DescriptionListTerm>
                <DescriptionListDescription className={styles['timestamp']}>
                    {buildTimeWithTz}
                </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Commit time</DescriptionListTerm>
                <DescriptionListDescription className={styles['timestamp']}>
                    {commitTimeWithTz}
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>
    );
};

export interface TagsListProps {
    instance: KojiInstance;
    tags?: KojiBuildTag[];
}

export const TagsList: React.FC<TagsListProps> = (props) => {
    const { instance, tags } = props;

    if (_.isNil(tags)) {
        return null;
    }

    return (
        <List
            className="pf-u-font-size-sm"
            component={ListComponent.ol}
            type={OrderType.number}
        >
            {_.map(tags, (tag) => (
                <ListItem key={tag.id}>
                    <ExternalLink href={mkLinkKojiWebTagId(tag.id, instance)}>
                        {tag.name}
                    </ExternalLink>
                </ListItem>
            ))}
        </List>
    );
};

/**
 * Different artifact types have different detailed info.
 */
interface ArtifactDetailedInfoKojiBuildProps {
    artifact: ArtifactRpm;
}
const ArtifactDetailedInfoKojiBuild: React.FC<
    ArtifactDetailedInfoKojiBuildProps
> = (props) => {
    const { artifact } = props;
    const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
    const handleTabClick: TabClickHandlerType = (_event, tabIndex) => {
        setActiveTabKey(tabIndex);
    };
    const aType = getAType(artifact);
    const taskId = getATaskid(artifact);
    const instance = kojiInstance(aType);
    const { loading: loadingCurrentState, data: dataKojiTask } =
        useQuery<ArtifactsDetailedInfoKojiTaskData>(
            ArtifactsDetailedInfoKojiTask,
            {
                variables: {
                    task_id: _.toNumber(taskId),
                    koji_instance: instance,
                    distgit_instance: instance,
                },
                errorPolicy: 'all',
                notifyOnNetworkStatusChange: true,
            },
        );
    const nvr = getANvr(artifact);
    const { loading: loadingETState, data: dataETState } =
        useQuery<ErrataLinkedAdvisoriesReply>(LinkedErrataAdvisories, {
            variables: {
                nvrs: [nvr],
            },
            errorPolicy: 'all',
            notifyOnNetworkStatusChange: true,
        });
    const haveData =
        !loadingCurrentState &&
        dataKojiTask &&
        !_.isEmpty(dataKojiTask.kojiTask?.builds);
    const build = _.first(dataKojiTask?.kojiTask?.builds);
    return (
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
            <Tab eventKey={0} title={<TabTitleText>Build Info</TabTitleText>}>
                <NoData show={!haveData && !loadingCurrentState} />
                <LoadingData show={loadingCurrentState} />
                <BuildInfo build={build} instance={instance} />
            </Tab>
            <Tab
                eventKey={1}
                title={<TabTitleText>Active Koji Tags</TabTitleText>}
            >
                <LimitWithScroll>
                    <TagsList instance={instance} tags={build?.tags} />
                </LimitWithScroll>
            </Tab>
            <Tab eventKey={2} title={<TabTitleText>Koji History</TabTitleText>}>
                <LimitWithScroll>
                    <HistoryList history={build?.history?.tag_listing} />
                </LimitWithScroll>
            </Tab>
            <Tab
                eventKey={3}
                title={<TabTitleText>Errata Automation</TabTitleText>}
            >
                <LoadingData show={loadingETState} />
                <LimitWithScroll>
                    <ErrataAutomation artifact={artifact} />
                </LimitWithScroll>
            </Tab>
            <Tab
                eventKey={4}
                title={<TabTitleText>Related Advisories</TabTitleText>}
            >
                <LoadingData show={loadingETState} />
                <LimitWithScroll>
                    <LinkedAdvisories
                        linkedAdvisories={dataETState?.teiidEtLinkedAdvisories}
                    />
                </LimitWithScroll>
            </Tab>
        </Tabs>
    );
};

export interface LinkedAdvisoriesProps {
    linkedAdvisories?: ErrataLinkedAdvisory[];
}

export const LinkedAdvisories: React.FC<LinkedAdvisoriesProps> = (props) => {
    const { linkedAdvisories } = props;
    if (_.isNil(linkedAdvisories)) {
        return (
            <Alert
                isInline
                isPlain
                title="No advisories linked to this artifact"
                variant="info"
            />
        );
    }
    const advs: JSX.Element[] = [];
    for (const adv of linkedAdvisories) {
        advs.push(
            <Tr key={adv.product_name}>
                <Td dataLabel="product">{adv.product_name}</Td>
                <Td dataLabel="status">{adv.advisory_status}</Td>
                <Td dataLabel="name">
                    <a
                        href={`${config.et.url}/advisory/${adv.advisory_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {adv.advisory_name}
                    </a>
                </Td>
            </Tr>,
        );
    }
    return (
        <TableComposable
            aria-label="Simple table"
            variant="compact"
            borders={false}
        >
            <Thead>
                <Tr>
                    <Th>Product name</Th>
                    <Th>Status</Th>
                    <Th>Name</Th>
                </Tr>
            </Thead>
            <Tbody>{advs}</Tbody>
        </TableComposable>
    );
};

const ErrataAutomationBugCiStatusHumanReadable: {
    [key in ErrataAutomationBugCiStatus]: string;
} = {
    BUG_READY: 'ready',
    BUG_IN_ADVISORY: 'in advisory',
    BUG_VERIFIED_TESTED_MISSING: 'Verified:Tested missing',
};

const getEtaMessageUrl = (artifact: Artifact, aChild: AChildEtaMsg) => {
    const msgId = getMsgId(aChild);
    const aType = getAType(artifact);
    const brokerMsgUrl: string = new URL(
        `id?id=${msgId}&is_raw=true&size=extra-large`,
        mappingDatagrepperUrl[aType],
    ).toString();
    return brokerMsgUrl;
};

export interface ErrataAutomationProps {
    artifact: Artifact;
}

export const ErrataAutomation: React.FC<ErrataAutomationProps> = (props) => {
    const { artifact } = props;
    const latestAChildEta = getAEtaChildren(artifact)?.at(-1);
    if (_.isNil(latestAChildEta)) {
        return (
            <Flex className="pf-u-p-lg">
                <Alert
                    isInline
                    isPlain
                    title="No Errata Tool Automation activity known for this artifact"
                    variant="info"
                />
            </Flex>
        );
    }
    const advs: JSX.Element[] = [];
    const brokerMessage = getEtaMsgBody(latestAChildEta);
    const bugs = brokerMessage.bugs;
    /*
     * FIXME: Temporary workaround until the changes from the following patch propagate:
     * https://gitlab.cee.redhat.com/osci/errata-automation/-/merge_requests/252/
     */
    if (!_.isEmpty(bugs)) {
        for (const bug of bugs) {
            const bugCiState =
                ErrataAutomationBugCiStatusHumanReadable[bug.ci_status] ||
                'Unknown';
            advs.push(
                <Tr key={bug.id}>
                    <Td dataLabel="bug">
                        <ExternalLink
                            href={`${config.et.bz}/show_bug.cgi?id=${bug.id}`}
                        >
                            {bug.id}
                        </ExternalLink>
                    </Td>
                    <Td dataLabel="state">{bugCiState}</Td>
                    <Td dataLabel="fixed in">{bug.fixed_in_version}</Td>
                    <Td dataLabel="summary">{bug.summary}</Td>
                </Tr>,
            );
        }
    }
    const brokerMsgUrl = getEtaMessageUrl(artifact, latestAChildEta);
    const etaState: HelperTextItemProps['variant'] =
        brokerMessage.ci_run_outcome === 'CREATED' ? 'success' : 'warning';
    return (
        <>
            <HelperText>
                <HelperTextItem hasIcon variant={etaState}>
                    <LinkifyNewTab>
                        {brokerMessage.ci_run_explanation}
                    </LinkifyNewTab>
                </HelperTextItem>
            </HelperText>
            <TableComposable
                aria-label="Errata Automation State Table"
                variant="compact"
                borders={false}
            >
                <Thead>
                    <Tr>
                        <Th>Bug</Th>
                        <Th>State</Th>
                        <Th>Fixed in</Th>
                        <Th>Summary</Th>
                    </Tr>
                </Thead>
                <Tbody>{advs}</Tbody>
            </TableComposable>
            <small>
                <a
                    href={brokerMsgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Errata Tool Automation UMB message"
                >
                    UMB message
                </a>
                {' • '}
                <a
                    href={brokerMessage.ci_run_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Errata Tool Automation run"
                >
                    Pipeline run
                </a>
            </small>
        </>
    );
};

interface ArtifactDetailedInfoModuleBuildProps {
    artifact: Artifact;
}

const ArtifactDetailedInfoModuleBuild: React.FC<
    ArtifactDetailedInfoModuleBuildProps
> = ({ artifact }) => {
    const [activeTabKey, setActiveTabKey] = useState<string>('build-info');
    const handleTabClick: TabClickHandlerType = (_event, tabIndex) => {
        setActiveTabKey(tabIndex.toString());
    };
    const aType = getAType(artifact);
    const instance = kojiInstance(aType);
    const buildId = getABuildId(artifact);

    const { loading, data } = useQuery<ArtifactsDetailedInfoModuleBuildData>(
        ArtifactsDetailedInfoModuleBuild,
        {
            variables: {
                build_id: _.toNumber(buildId),
                mbs_instance: instance,
                koji_instance: instance,
                distgit_instance: instance,
            },
            errorPolicy: 'all',
            notifyOnNetworkStatusChange: true,
        },
    );

    if (loading) {
        return (
            <Flex className="pf-u-p-lg">
                <FlexItem>
                    <Spinner className="pf-u-mr-md" size="md" /> Loading build
                    info…
                </FlexItem>
            </Flex>
        );
    }

    const haveData = !loading && data && !_.isEmpty(data.mbsBuild);
    if (!haveData) {
        return (
            <Flex className="pf-u-p-lg">
                <Alert
                    isInline
                    isPlain
                    title="No build information available"
                    variant="info"
                />
            </Flex>
        );
    }

    const build = data.mbsBuild;
    if (_.isNil(build)) {
        console.error('No build found in data.');
        return null;
    }

    const moduleName = build.name;

    /* Time of build */
    const buildTimeLocal = moment(build.time_completed).local();
    const buildTimeWithTz = buildTimeLocal.format('YYYY-MM-DD HH:mm ZZ');
    /* Time of commit */
    let commitTimeWithTz = 'n/a';
    if (build.commit) {
        const commitTimeLocal = moment
            .unix(build.commit.committer_date_seconds)
            .local();
        if (commitTimeLocal.isValid())
            commitTimeWithTz = commitTimeLocal.format('YYYY-MM-DD HH:mm ZZ');
    }

    const buildWebUrl = mkLinkMbsBuild(build.id, instance);
    const buildIdCell =
        (buildWebUrl && (
            <ExternalLink href={buildWebUrl}>{build.id}</ExternalLink>
        )) ||
        build.id.toString();

    const gitCommitLink = build.scmurl && (
        <ExternalLink
            className={styles['commitHash']}
            href={mkLinkPkgsDevelFromSource(build.scmurl, instance)}
        >
            {mkCommitHashFromSource(build.scmurl)}
        </ExternalLink>
    );

    const modulemdLink = build.scmurl && (
        <ExternalLink
            href={mkLinkFileInGit(
                moduleName,
                'modules',
                // Let's assume the Git URL is correct for now.
                mkCommitHashFromSource(build.scmurl)!,
                `${moduleName}.yaml`,
                instance,
            )}
        >
            {moduleName}.yaml
        </ExternalLink>
    );

    const descListClassName = classNames(
        'pf-u-px-lg',
        'pf-u-py-md',
        styles['buildInfo'],
    );

    return (
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
            <Tab
                eventKey="build-info"
                title={<TabTitleText>Build Info</TabTitleText>}
            >
                <DescriptionList
                    className={descListClassName}
                    columnModifier={{ default: '3Col' }}
                    isAutoColumnWidths
                    isCompact
                    isHorizontal
                >
                    <DescriptionListGroup>
                        <DescriptionListTerm>Build ID</DescriptionListTerm>
                        <DescriptionListDescription>
                            {buildIdCell}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Git commit</DescriptionListTerm>
                        <DescriptionListDescription>
                            {gitCommitLink}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Modulemd</DescriptionListTerm>
                        <DescriptionListDescription>
                            {modulemdLink}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Build owner</DescriptionListTerm>
                        <DescriptionListDescription>
                            <ExternalLink
                                href={mkLinkKojiWebUserId(
                                    build.owner,
                                    instance,
                                )}
                            >
                                {build.owner}
                            </ExternalLink>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Committer</DescriptionListTerm>
                        <DescriptionListDescription>
                            {build.commit?.committer_name || 'n/a'}
                            &nbsp;&lt;
                            {build.commit?.committer_email || 'n/a'}
                            &gt;
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        {/* Intentionally left blank. */}
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>
                            Build completed
                        </DescriptionListTerm>
                        <DescriptionListDescription
                            className={styles['timestamp']}
                        >
                            {buildTimeWithTz}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Commit time</DescriptionListTerm>
                        <DescriptionListDescription
                            className={styles['timestamp']}
                        >
                            {commitTimeWithTz}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </Tab>
            <Tab
                eventKey="components"
                title={<TabTitleText>Components</TabTitleText>}
            >
                <Flex className="pf-u-p-md" flex={{ default: 'flexNone' }}>
                    <FlexItem
                        flex={{ default: 'flex_1' }}
                        style={{
                            height: '10em',
                            overflow: 'auto',
                        }}
                    >
                        <List
                            component={ListComponent.ol}
                            type={OrderType.number}
                        >
                            {_.map(build.tasks, (task) => (
                                <ListItem key={task.nvr}>
                                    {task.nvr}{' '}
                                    {task.id && (
                                        <ExternalLink
                                            href={mkLinkKojiWebTask(
                                                task.id,
                                                instance,
                                            )}
                                        >
                                            (task #{task.id})
                                        </ExternalLink>
                                    )}
                                </ListItem>
                            ))}
                        </List>
                    </FlexItem>
                </Flex>
            </Tab>
            <Tab
                eventKey="active-tags"
                title={<TabTitleText>Active Tags</TabTitleText>}
            >
                <Flex className="pf-u-p-md" flex={{ default: 'flexNone' }}>
                    <TagsList instance={instance} tags={build.tags} />
                </Flex>
            </Tab>
            <Tab
                eventKey="tagging-history"
                title={<TabTitleText>Tagging History</TabTitleText>}
            >
                <HistoryList history={build.tag_history?.tag_listing} />
            </Tab>
        </Tabs>
    );
};

interface TagActionHistoryType {
    action: string;
    active: boolean;
    person_id: number;
    person_name: string;
    tag_name: string;
    time: number;
}

export interface HistoryListProps {
    history?: KojiBuildTagging[];
}

export const HistoryList: React.FC<HistoryListProps> = (props) => {
    const { history } = props;
    if (_.isNil(history)) return null;
    const lines: TagActionHistoryType[] = [];
    _.forEach(history, (e) => {
        lines.push({
            action: 'tagged into',
            active: e.active,
            time: e.create_ts,
            tag_name: e.tag_name,
            person_id: e.creator_id,
            person_name: e.creator_name,
        });
        if (_.every([e.revoke_ts, e.revoker_name, e.revoker_id])) {
            lines.push({
                action: 'untagged from',
                active: false,
                time: e.revoke_ts!,
                tag_name: e.tag_name,
                person_id: e.revoker_id!,
                person_name: e.revoker_name!,
            });
        }
    });
    const log = _.orderBy(lines, ['time'], ['asc']);
    return (
        <List
            className="pf-u-font-size-sm"
            component={ListComponent.ol}
            type={OrderType.number}
        >
            {_.map(log, (entry) => {
                return (
                    <ListItem key={entry.action + entry.time}>
                        <HistoryListEntry entry={entry} />
                    </ListItem>
                );
            })}
        </List>
    );
};

export const LimitWithScroll = (
    props: React.PropsWithChildren<React.ReactNode>,
) => {
    const { children } = props;
    return (
        <Flex className="pf-u-p-md">
            <FlexItem
                flex={{ default: 'flex_1' }}
                style={{
                    maxHeight: '10em',
                    overflow: 'auto',
                }}
            >
                {children}
            </FlexItem>
        </Flex>
    );
};

interface HistoryListEntryProps {
    entry: TagActionHistoryType;
}

const HistoryListEntry: React.FC<HistoryListEntryProps> = (props) => {
    const {
        entry: { action, active, person_name, tag_name, time },
    } = props;
    const eventTimeWithTz = secondsToTimestampWithTz(time);
    const flag = active ? '[still active]' : '';
    return (
        <div style={{ whiteSpace: 'nowrap' }}>
            <span className={styles['timestamp']}>{eventTimeWithTz}</span>{' '}
            {action} {tag_name} by {person_name} {flag}
        </div>
    );
};

interface ArtifactDetailedInfoProps {
    artifact: Artifact;
}

export function ArtifactDetailedInfo({ artifact }: ArtifactDetailedInfoProps) {
    if (isArtifactRpm(artifact))
        return <ArtifactDetailedInfoKojiBuild artifact={artifact} />;
    else if (isArtifactMbs(artifact))
        return <ArtifactDetailedInfoModuleBuild artifact={artifact} />;
    return null;
}
