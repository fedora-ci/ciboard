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
    Tab,
    Flex,
    Text,
    List,
    Tabs,
    Spinner,
    ListItem,
    FlexItem,
    OrderType,
    TabsProps,
    TextContent,
    TabTitleText,
    ListComponent,
} from '@patternfly/react-core';
import {
    mkLinkBrewWebTagId,
    mkLinkBrewWebUserId,
    mkLinkBrewWebBuildId,
    mkLinkPkgsDevelFromSource,
} from '../utils/artifactUtils';

import styles from '../custom.module.css';

import { ArtifactsDetailedInfoBrewTask } from '../queries/Artifacts';
import { DB, koji_instance, TabClickHandlerType } from '../types';

const artifactDashboardUrl = (artifact: DB.ArtifactType) => {
    return `${window.location.origin}/#/artifact/${artifact.type}/aid/${artifact.aid}`;
};

/**
 * Different artifact types have different detailed info.
 */
interface ArtifactDetailedInfoBrewBuildProps {
    artifact: DB.ArtifactType;
}
const ArtifactDetailedInfoKojiBuild: React.FC<ArtifactDetailedInfoBrewBuildProps> =
    (props) => {
        const { artifact } = props;
        const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
        const handleTabClick: TabClickHandlerType = (_event, tabIndex) => {
            setActiveTabKey(tabIndex);
        };
        const {
            loading: loadingCurrentState,
            error: errorCurrentState,
            data: dataBrewTask,
        } = useQuery(ArtifactsDetailedInfoBrewTask, {
            variables: {
                task_id: _.toNumber(artifact.aid),
                instance: koji_instance(artifact.type),
            },
            errorPolicy: 'all',
            notifyOnNetworkStatusChange: true,
        });
        if (loadingCurrentState) {
            return (
                <>
                    Loading <Spinner size="md" />
                </>
            );
        }
        const haveData =
            !loadingCurrentState &&
            dataBrewTask &&
            !_.isEmpty(dataBrewTask.brew_task.builds);
        /** XXX: display errors */
        const haveErrorNoData =
            !loadingCurrentState && errorCurrentState && !haveData;
        if (!haveData) {
            /** No addititinal info */
            return <></>;
        }
        const build = _.get(dataBrewTask, 'brew_task.builds.0');
        /** build time */
        const b_time = moment.unix(build.completion_ts).local();
        const build_time = b_time.format('YYYY-MM-DD, HH:mm');
        const build_zone_shift = b_time.format('ZZ');
        /** commit time */
        const c_time = moment
            .unix(build.commit_obj?.committer_date_seconds)
            .local();
        var commit_time = 'n/a';
        var commit_zone_shift = 'n/a';
        if (c_time.isValid()) {
            commit_time = c_time.format('YYYY-MM-DD, HH:mm');
            commit_zone_shift = c_time.format('ZZ');
        }
        const element = (
            <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
                <Tab
                    eventKey={0}
                    title={<TabTitleText>BuildInfo</TabTitleText>}
                >
                    <div className="example-border1">
                        <Flex className="pf-u-m-lg">
                            <Flex
                                flexWrap={{ default: 'nowrap' }}
                                /** XXX was: inlineFlex */
                                flex={{ default: 'flexNone' }}
                            >
                                <Flex
                                    direction={{ default: 'column' }}
                                    alignSelf={{
                                        default: 'alignSelfStretch',
                                    }}
                                    spacer={{ default: 'spacer3xl' }}
                                >
                                    <Flex flexWrap={{ default: 'nowrap' }}>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                BuildID:
                                            </FlexItem>
                                        </Flex>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                <a
                                                    href={mkLinkBrewWebBuildId(
                                                        build.build_id,
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {build.build_id}
                                                </a>
                                            </FlexItem>
                                        </Flex>
                                    </Flex>
                                    <Flex flexWrap={{ default: 'nowrap' }}>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                Build owner:
                                            </FlexItem>
                                        </Flex>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                <a
                                                    href={mkLinkBrewWebUserId(
                                                        build.owner_id,
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    {build.owner_name}
                                                </a>
                                            </FlexItem>
                                        </Flex>
                                    </Flex>
                                    <Flex flexWrap={{ default: 'nowrap' }}>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                Build completed:
                                            </FlexItem>
                                        </Flex>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                <Flex>
                                                    <FlexItem className="pf-u-p-0 pf-u-m-0">
                                                        <TextContent>
                                                            <Text
                                                                style={{
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                    fontFamily:
                                                                        'var(--pf-global--FontFamily--monospace)',
                                                                    fontSize:
                                                                        'x-small',
                                                                }}
                                                                component="small"
                                                            >
                                                                {build_time}
                                                            </Text>
                                                        </TextContent>
                                                    </FlexItem>
                                                    <FlexItem className="pf-u-p-0 pf-u-m-0">
                                                        <TextContent>
                                                            <Text
                                                                component="small"
                                                                style={{
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                    fontFamily:
                                                                        'var(--pf-global--FontFamily--monospace)',
                                                                    fontSize:
                                                                        '0.5em',
                                                                }}
                                                            >
                                                                {
                                                                    build_zone_shift
                                                                }
                                                            </Text>
                                                        </TextContent>
                                                    </FlexItem>
                                                </Flex>
                                            </FlexItem>
                                        </Flex>
                                    </Flex>
                                </Flex>
                                <Flex
                                    direction={{ default: 'column' }}
                                    alignSelf={{
                                        default: 'alignSelfStretch',
                                    }}
                                >
                                    <Flex flexWrap={{ default: 'nowrap' }}>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                Dist-git commit:
                                            </FlexItem>
                                        </Flex>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                <a
                                                    href={mkLinkPkgsDevelFromSource(
                                                        build.source,
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    link
                                                </a>
                                            </FlexItem>
                                        </Flex>
                                    </Flex>
                                    <Flex flexWrap={{ default: 'nowrap' }}>
                                        <Flex>
                                            <FlexItem>
                                                <div className="pf-u-text-nowrap">
                                                    Committer:
                                                </div>
                                            </FlexItem>
                                        </Flex>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                {build.commit_obj
                                                    ?.committer_name || 'n/a'}
                                                &nbsp;&lt;
                                                {build.commit_obj
                                                    ?.committer_email || 'n/a'}
                                                &gt;
                                            </FlexItem>
                                        </Flex>
                                    </Flex>
                                    <Flex flexWrap={{ default: 'nowrap' }}>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                Commit time:
                                            </FlexItem>
                                        </Flex>
                                        <Flex>
                                            <FlexItem className="pf-u-text-nowrap">
                                                <Flex>
                                                    <FlexItem className="pf-u-p-0 pf-u-m-0">
                                                        <TextContent>
                                                            <Text
                                                                style={{
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                    fontFamily:
                                                                        'var(--pf-global--FontFamily--monospace)',
                                                                    fontSize:
                                                                        'x-small',
                                                                }}
                                                                component="small"
                                                            >
                                                                {commit_time}
                                                            </Text>
                                                        </TextContent>
                                                    </FlexItem>
                                                    <FlexItem className="pf-u-p-0 pf-u-m-0">
                                                        <TextContent>
                                                            <Text
                                                                component="small"
                                                                style={{
                                                                    whiteSpace:
                                                                        'nowrap',
                                                                    fontFamily:
                                                                        'var(--pf-global--FontFamily--monospace)',
                                                                    fontSize:
                                                                        '0.5em',
                                                                }}
                                                            >
                                                                {
                                                                    commit_zone_shift
                                                                }
                                                            </Text>
                                                        </TextContent>
                                                    </FlexItem>
                                                </Flex>
                                            </FlexItem>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Flex>
                    </div>
                </Tab>
                <Tab
                    eventKey={1}
                    title={<TabTitleText>Active Brew Tags</TabTitleText>}
                >
                    {/** XXX: Was: inlineFlex */}
                    <Flex flex={{ default: 'flexNone' }}>
                        <FlexItem
                            style={{
                                height: '143px',
                                overflow: 'auto',
                            }}
                        >
                            <List
                                component={ListComponent.ol}
                                type={OrderType.number}
                            >
                                {_.map(build.tags, (tag) => {
                                    return (
                                        <ListItem>
                                            <a
                                                href={mkLinkBrewWebTagId(
                                                    tag.id,
                                                )}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {tag.name}
                                            </a>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </FlexItem>
                    </Flex>
                </Tab>
                <Tab
                    eventKey={2}
                    title={<TabTitleText>Brew History</TabTitleText>}
                >
                    {/** XXX: Was: inlineFlex */}
                    <Flex flex={{ default: 'flexNone' }}>
                        <FlexItem
                            style={{
                                height: '143px',
                                overflow: 'auto',
                            }}
                        >
                            <HistoryList history={build.history} />
                        </FlexItem>
                    </Flex>
                </Tab>
            </Tabs>
        );
        return element;
    };

/**
 * "tag_name": "rhel-8.5.0-candidate",
 * "active": null,
 * "creator_name": "jenkins/baseos-jenkins.rhev-ci-vms.eng.rdu2.redhat.com",
 * "create_ts": 1620283840.18954,
 * "creator_id": 2863,
 * "revoke_ts": 1621935173.47965,
 * "revoker_name": "astepano",
 * "revoker_id": 2951
 *
 * Create a list similar:
 *
 * brew list-history --build hostname-3.20-7.el8
 * Thu May  6 07:39:55 2021 hostname-3.20-7.el8 tagged into rhel-8.5.0-gate by pzhukov
 * Thu May  6 08:50:40 2021 hostname-3.20-7.el8 untagged from rhel-8.5.0-gate by jenkins/baseos-jenkins.rhev-ci-vms.eng.rdu2.redhat.com
 */
interface HistoryListProps {
    history: {
        tag_listing: Array<KojiBuildTagType>;
    };
}

type TagActionHistoryType = {
    time: number;
    action: string;
    active: boolean;
    tag_name: string;
    person_id: number;
    person_name: string;
};

type KojiBuildTagType = {
    active: boolean;
    build_state: number;
    build_id: number;
    create_event: number;
    create_ts: number;
    creator_id: number;
    creator_name: string;
    epoch: string;
    name: string;
    release: string;
    revoke_event: string;
    revoke_ts: number;
    revoker_id: number;
    revoker_name: string;
    tag_name: string;
    tag_id: number;
};

const HistoryList: React.FC<HistoryListProps> = (props) => {
    const {
        history: { tag_listing },
    } = props;
    const lines: Array<TagActionHistoryType> = [];
    _.forEach(tag_listing, (e) => {
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
                time: e.revoke_ts,
                tag_name: e.tag_name,
                person_id: e.revoker_id,
                person_name: e.revoker_name,
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
        entry: { action, active, time, tag_name, person_id, person_name },
    } = props;
    const event_time = moment.unix(time).local();
    const local_time = event_time.format('YYYY-MM-DD, HH:mm');
    const shift = event_time.format('ZZ');
    const flag = active ? '[still active]' : '';
    return (
        <>
            `${local_time} ${shift} ${action} ${tag_name} by ${person_name} $
            {flag}`
        </>
    );
};

interface ArtifactDetailedInfoProps {
    artifact: DB.ArtifactType;
}
const ArtifactDetailedInfo: React.FC<ArtifactDetailedInfoProps> = (props) => {
    const { artifact } = props;
    if (['brew-build', 'koji-build', 'koji-buil-cs'].includes(artifact.type)) {
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
};

export default ArtifactDetailedInfo;
