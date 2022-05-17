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
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import {
    Alert,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Flex,
    FlexItem,
    List,
    ListComponent,
    ListItem,
    OrderType,
    Spinner,
    Tab,
    TabTitleText,
    Tabs,
} from '@patternfly/react-core';

import styles from '../custom.module.css';
import { TabClickHandlerType } from '../types';
import {
    ArtifactsDetailedInfoKojiTask,
    ArtifactsDetailedInfoKojiTaskData,
} from '../queries/Artifacts';
import { Artifact, KojiBuildTagging, koji_instance } from '../artifact';
import {
    mkCommitHashFromSource,
    mkLinkKojiWebBuildId,
    mkLinkKojiWebTagId,
    mkLinkKojiWebUserId,
    mkLinkPkgsDevelFromSource,
} from '../utils/artifactUtils';
import { ExternalLink } from './ExternalLink';

/**
 * Different artifact types have different detailed info.
 */
interface ArtifactDetailedInfoKojiBuildProps {
    artifact: Artifact;
}
const ArtifactDetailedInfoKojiBuild: React.FC<
    ArtifactDetailedInfoKojiBuildProps
> = (props) => {
    const { artifact } = props;
    const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
    const handleTabClick: TabClickHandlerType = (_event, tabIndex) => {
        setActiveTabKey(tabIndex);
    };
    const instance = koji_instance(artifact.type);
    const { loading: loadingCurrentState, data: dataKojiTask } =
        useQuery<ArtifactsDetailedInfoKojiTaskData>(
            ArtifactsDetailedInfoKojiTask,
            {
                variables: {
                    task_id: _.toNumber(artifact.aid),
                    koji_instance: instance,
                    distgit_instance: instance,
                },
                errorPolicy: 'all',
                notifyOnNetworkStatusChange: true,
            },
        );
    if (loadingCurrentState) {
        return (
            <Flex className="pf-u-p-lg">
                <FlexItem>
                    <Spinner className="pf-u-mr-md" size="md" /> Loading build
                    info…
                </FlexItem>
            </Flex>
        );
    }
    const haveData =
        !loadingCurrentState &&
        dataKojiTask &&
        !_.isEmpty(dataKojiTask.koji_task?.builds);

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
    const build = _.first(dataKojiTask?.koji_task?.builds);
    if (_.isNil(build)) {
        console.error('No build found in data.');
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
    return (
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
            <Tab eventKey={0} title={<TabTitleText>Build Info</TabTitleText>}>
                <DescriptionList
                    className="pf-u-px-lg pf-u-py-md"
                    columnModifier={{ default: '2Col' }}
                    isAutoColumnWidths
                    isCompact
                    isHorizontal
                >
                    <DescriptionListGroup>
                        <DescriptionListTerm>Build ID</DescriptionListTerm>
                        <DescriptionListDescription>
                            <a
                                href={mkLinkKojiWebBuildId(
                                    build.build_id,
                                    instance,
                                )}
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
                                className={styles['buildInfoCommitHash']}
                                href={mkLinkPkgsDevelFromSource(
                                    build.source,
                                    instance,
                                )}
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
                                href={mkLinkKojiWebUserId(
                                    build.owner_id,
                                    instance,
                                )}
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
                        <DescriptionListTerm>
                            Build completed
                        </DescriptionListTerm>
                        <DescriptionListDescription
                            className={styles['buildInfoTimestamp']}
                        >
                            {buildTimeWithTz}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Commit time</DescriptionListTerm>
                        <DescriptionListDescription
                            className={styles['buildInfoTimestamp']}
                        >
                            {commitTimeWithTz}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </Tab>
            <Tab
                eventKey={1}
                title={<TabTitleText>Active Koji Tags</TabTitleText>}
            >
                <Flex className="pf-u-p-md" flex={{ default: 'flexNone' }}>
                    <List component={ListComponent.ol} type={OrderType.number}>
                        {build.tags.map((tag) => (
                            <ListItem key={tag.id}>
                                <ExternalLink
                                    href={mkLinkKojiWebTagId(tag.id, instance)}
                                >
                                    {tag.name}
                                </ExternalLink>
                            </ListItem>
                        ))}
                    </List>
                </Flex>
            </Tab>
            <Tab eventKey={2} title={<TabTitleText>Koji History</TabTitleText>}>
                <Flex className="pf-u-p-md" flex={{ default: 'flexNone' }}>
                    <FlexItem
                        style={{
                            height: '10em',
                            overflow: 'auto',
                        }}
                    >
                        <HistoryList history={build.history?.tag_listing} />
                    </FlexItem>
                </Flex>
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

interface HistoryListProps {
    history?: KojiBuildTagging[];
}

const HistoryList: React.FC<HistoryListProps> = (props) => {
    const { history } = props;
    if (_.isNil(history)) return null;
    const lines: TagActionHistoryType[] = [];
    history.forEach((e) => {
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
        <List component={ListComponent.ol} type={OrderType.number}>
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

interface HistoryListEntryProps {
    entry: TagActionHistoryType;
}

const HistoryListEntry: React.FC<HistoryListEntryProps> = (props) => {
    const {
        entry: { action, active, person_name, tag_name, time },
    } = props;
    const eventTimeLocal = moment.unix(time).local();
    const eventTimeWithTz = eventTimeLocal.format('YYYY-MM-DD, HH:mm');
    const shift = eventTimeLocal.format('ZZ');
    const flag = active ? '[still active]' : '';
    return (
        <div style={{ whiteSpace: 'nowrap' }}>
            {eventTimeWithTz} {shift} {action} {tag_name} by {person_name}{' '}
            {flag}
        </div>
    );
};

interface ArtifactDetailedInfoProps {
    artifact: Artifact;
}

export function ArtifactDetailedInfo({ artifact }: ArtifactDetailedInfoProps) {
    if (['brew-build', 'koji-build', 'koji-build-cs'].includes(artifact.type)) {
        return (
            <>
                <ArtifactDetailedInfoKojiBuild
                    key={artifact.aid}
                    artifact={artifact}
                />
            </>
        );
    } else {
        return <></>;
    }
}
