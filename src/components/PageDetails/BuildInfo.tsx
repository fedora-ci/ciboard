/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
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

import * as _ from 'lodash';
import { useState } from 'react';
import {
    Alert,
    Badge,
    Bullseye,
    CardBody,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    EmptyState,
    EmptyStateBody,
    EmptyStateIcon,
    List,
    ListComponent,
    ListItem,
    OrderType,
    Spinner,
    Tab,
    Tabs,
    TabTitleText,
    Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useQuery } from '@apollo/client';
import classNames from 'classnames';

import styles from '../../custom.module.css';
import {
    Artifact,
    ArtifactMBS,
    ArtifactRPM,
    KojiBuildInfo,
    KojiInstanceType,
    MbsBuildInfo,
    isArtifactMBS,
    isArtifactRPM,
    koji_instance,
} from '../../artifact';
import {
    ArtifactsDetailedInfoKojiTask,
    ArtifactsDetailedInfoKojiTaskData,
    ArtifactsDetailedInfoModuleBuild,
    ArtifactsDetailedInfoModuleBuildData,
} from '../../queries/Artifacts';
import {
    ErrataLinkedAdvisoriesReply,
    LinkedErrataAdvisories,
} from '../../queries/Errata';
import {
    mkCommitHashFromSource,
    mkLinkFileInGit,
    mkLinkKojiWebBuildId,
    mkLinkKojiWebTask,
    mkLinkKojiWebUserId,
    mkLinkMbsBuild,
    mkLinkPkgsDevelFromSource,
} from '../../utils/artifactUtils';
import {
    secondsToTimestampWithTz,
    timestampToTimestampWithTz,
} from '../../utils/timeUtils';
import {
    ErrataAutomation,
    HistoryList,
    LimitWithScroll,
    LinkedAdvisories,
    LoadingData,
    TagsList,
} from '../ArtifactDetailedInfo';
import { ExternalLink } from '../ExternalLink';

interface BuildMetadataMbsProps {
    build: MbsBuildInfo;
    instance: KojiInstanceType;
}

function BuildMetadataMbs(props: BuildMetadataMbsProps) {
    const { build, instance } = props;

    const moduleName = build.name;

    const buildTimeWithTz = build.time_completed
        ? timestampToTimestampWithTz(build.time_completed)
        : 'n/a';
    let commitTimeWithTz = 'n/a';
    if (build.commit) {
        commitTimeWithTz = secondsToTimestampWithTz(
            build.commit.committer_date_seconds,
        );
    }

    const buildWebUrl = mkLinkMbsBuild(build.id, instance);
    const buildIdCell =
        (buildWebUrl && (
            <ExternalLink href={buildWebUrl}>{build.id}</ExternalLink>
        )) ||
        build.id.toString();

    const gitCommitLink = !_.isEmpty(build.scmurl) && (
        <ExternalLink
            className={styles['commitHash']}
            href={mkLinkPkgsDevelFromSource(build.scmurl!, instance)}
        >
            {mkCommitHashFromSource(build.scmurl!)}
        </ExternalLink>
    );

    const modulemdLink = !_.isEmpty(build.scmurl) && (
        <ExternalLink
            href={mkLinkFileInGit(
                moduleName,
                'modules',
                // Let's assume the Git URL is correct for now.
                mkCommitHashFromSource(build.scmurl!)!,
                `${moduleName}.yaml`,
                instance,
            )}
        >
            {moduleName}.yaml
        </ExternalLink>
    );

    const items = [
        {
            label: 'Build ID',
            value: buildIdCell,
        },
        {
            label: 'Git commit',
            value: gitCommitLink,
        },
        {
            label: 'Modulemd',
            value: modulemdLink,
        },
        {
            label: 'Build owner',
            value: (
                <ExternalLink href={mkLinkKojiWebUserId(build.owner, instance)}>
                    {build.owner}
                </ExternalLink>
            ),
        },
        {
            label: 'Committer',
            value: (
                <>
                    {build.commit?.committer_name || 'n/a'}
                    &nbsp;&lt;
                    {build.commit?.committer_email || 'n/a'}
                    &gt;
                </>
            ),
        },
        {
            // Intentionally left blank for alignment.
        },
        {
            label: 'Build completed',
            value: buildTimeWithTz,
            className: styles['timestamp'],
        },
        {
            label: 'Commit time',
            value: commitTimeWithTz,
            className: styles['timestamp'],
        },
    ];

    const descListClassName = classNames(
        'pf-u-px-lg',
        'pf-u-py-md',
        styles['buildInfo'],
    );

    return (
        <DescriptionList
            className={descListClassName}
            columnModifier={{ default: '1Col', lg: '3Col' }}
            isAutoColumnWidths
            isCompact
            isHorizontal
        >
            {items.map(({ className, label, value }, index) =>
                value ? (
                    <DescriptionListGroup key={index}>
                        <DescriptionListTerm>{label}</DescriptionListTerm>
                        <DescriptionListDescription className={className}>
                            {value}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                ) : (
                    <DescriptionListGroup>
                        {/* Intentionally left blank */}
                    </DescriptionListGroup>
                ),
            )}
        </DescriptionList>
    );
}

interface BuildMetadataRpmProps {
    build: KojiBuildInfo;
    instance: KojiInstanceType;
}

function BuildMetadataRpm(props: BuildMetadataRpmProps) {
    const { build, instance } = props;

    const buildTimeWithTz = secondsToTimestampWithTz(build.completion_ts);
    let commitTimeWithTz = 'n/a';
    if (build.commit_obj) {
        commitTimeWithTz = secondsToTimestampWithTz(
            build.commit_obj.committer_date_seconds,
        );
    }

    const items = [
        {
            label: 'Build ID',
            value: (
                <ExternalLink
                    href={mkLinkKojiWebBuildId(build.build_id, instance)}
                >
                    {build.build_id}
                </ExternalLink>
            ),
        },
        {
            label: 'Git commit',
            value: (
                <ExternalLink
                    className={styles['commitHash']}
                    href={mkLinkPkgsDevelFromSource(build.source, instance)}
                >
                    {mkCommitHashFromSource(build.source)}
                </ExternalLink>
            ),
        },
        {
            label: 'Build owner',
            value: (
                <ExternalLink
                    href={mkLinkKojiWebUserId(build.owner_id, instance)}
                >
                    {build.owner_name}
                </ExternalLink>
            ),
        },
        {
            label: 'Committer',
            value: (
                <>
                    {build.commit_obj?.committer_name || 'n/a'}
                    &nbsp;&lt;
                    {build.commit_obj?.committer_email || 'n/a'}
                    &gt;
                </>
            ),
        },
        {
            label: 'Build completed',
            value: buildTimeWithTz,
            className: styles['timestamp'],
        },
        {
            label: 'Commit time',
            value: commitTimeWithTz,
            className: styles['timestamp'],
        },
    ];

    const descListClassName = classNames(
        'pf-u-px-lg',
        'pf-u-py-md',
        styles['buildInfo'],
    );

    return (
        <DescriptionList
            className={descListClassName}
            columnModifier={{ default: '1Col', lg: '2Col' }}
            isAutoColumnWidths
            isCompact
            isHorizontal
        >
            {items.map(({ className, label, value }, index) => (
                <DescriptionListGroup key={index}>
                    <DescriptionListTerm>{label}</DescriptionListTerm>
                    <DescriptionListDescription className={className}>
                        {value}
                    </DescriptionListDescription>
                </DescriptionListGroup>
            ))}
        </DescriptionList>
    );
}

function BuildInfoEmpty(_props: {}) {
    return (
        <CardBody>
            <Alert
                isInline
                isPlain
                title="No build information available"
                variant="info"
            ></Alert>
        </CardBody>
    );
}

function BuildInfoError(props: { message: string }) {
    return (
        <Bullseye>
            <EmptyState variant="small">
                <EmptyStateIcon
                    className="pf-u-danger-color-100"
                    icon={ExclamationCircleIcon}
                />
                <Title headingLevel="h3" size="md">
                    Could not load build information
                </Title>
                <EmptyStateBody>{props.message}</EmptyStateBody>
            </EmptyState>
        </Bullseye>
    );
}

function BuildInfoLoading(_props: {}) {
    return (
        <Bullseye>
            <EmptyState variant="small">
                <EmptyStateIcon component={Spinner} variant="container" />
                <Title headingLevel="h3" size="md">
                    Loading build information…
                </Title>
            </EmptyState>
        </Bullseye>
    );
}

interface ModuleBuildComponentsProps {
    build?: MbsBuildInfo;
    instance: KojiInstanceType;
}

function ModuleBuildComponents(props: ModuleBuildComponentsProps) {
    const { build, instance } = props;

    if (_.isNil(build)) return null;

    return (
        <List
            className="pf-u-font-size-sm"
            component={ListComponent.ol}
            type={OrderType.number}
        >
            {_.map(build.tasks, (task) => (
                <ListItem key={task.nvr}>
                    {task.nvr}{' '}
                    {task.id && (
                        <ExternalLink
                            href={mkLinkKojiWebTask(task.id, instance)}
                        >
                            (task #{task.id})
                        </ExternalLink>
                    )}
                </ListItem>
            ))}
        </List>
    );
}

interface BuildInfoMbsProps {
    artifact: ArtifactMBS;
}

function BuildInfoMbs({ artifact }: BuildInfoMbsProps) {
    const [activeTabKey, setActiveTabKey] = useState('summary');

    const instance = koji_instance(artifact.type);

    /*
     * Fetch available information about the build -- NVR, commit and build time,
     * source URL, build owner, tags and tagging history, and gating status (if
     * available).
     */
    const { data, error, loading } =
        useQuery<ArtifactsDetailedInfoModuleBuildData>(
            ArtifactsDetailedInfoModuleBuild,
            {
                variables: {
                    build_id: Number(artifact.aid),
                    distgit_instance: instance,
                    koji_instance: instance,
                    mbs_instance: instance,
                },
                errorPolicy: 'all',
            },
        );

    if (loading) {
        return <BuildInfoLoading />;
    }

    if (error) {
        return <BuildInfoError message={error.message} />;
    }

    const build = data?.mbs_build;

    if (!build) {
        return <BuildInfoEmpty />;
    }

    // Show different tab set for module builds (Components instead of 2× errata)
    return (
        <Tabs
            className="pf-u-pt-sm"
            activeKey={activeTabKey}
            inset={{ default: 'insetLg' }}
            onSelect={(_event, tabIndex) => {
                setActiveTabKey(tabIndex.toString());
            }}
        >
            <Tab
                eventKey="summary"
                title={<TabTitleText>Build summary</TabTitleText>}
            >
                <BuildMetadataMbs build={build} instance={instance} />
            </Tab>
            <Tab
                eventKey="components"
                title={<TabTitleText>Components</TabTitleText>}
            >
                <LimitWithScroll>
                    <ModuleBuildComponents build={build} instance={instance} />
                </LimitWithScroll>
            </Tab>
            {!_.isNil(build.tags) && (
                <Tab
                    eventKey="tags"
                    title={
                        <TabTitleText>
                            Active tags{' '}
                            <Badge isRead>{build.tags.length}</Badge>
                        </TabTitleText>
                    }
                >
                    <LimitWithScroll>
                        <TagsList instance={instance} tags={build.tags} />
                    </LimitWithScroll>
                </Tab>
            )}
            <Tab
                eventKey="history"
                title={<TabTitleText>Tagging history</TabTitleText>}
            >
                <LimitWithScroll>
                    <HistoryList history={build.tag_history?.tag_listing} />
                </LimitWithScroll>
            </Tab>
            <Tab
                eventKey="errata automation"
                title={<TabTitleText>Errata automation</TabTitleText>}
            >
                <LimitWithScroll>
                    <ErrataAutomation artifact={artifact} />
                </LimitWithScroll>
            </Tab>
        </Tabs>
    );
}

interface BuildInfoRpmProps {
    artifact: ArtifactRPM;
}

function BuildInfoRpm({ artifact }: BuildInfoRpmProps) {
    const [activeTabKey, setActiveTabKey] = useState('summary');

    const kojiInstance = koji_instance(artifact.type);

    /*
     * Fetch available information about the build -- NVR, commit and build time,
     * source URL, build owner, tags and tagging history, and gating status (if
     * available).
     */
    const { data, error, loading } =
        useQuery<ArtifactsDetailedInfoKojiTaskData>(
            ArtifactsDetailedInfoKojiTask,
            {
                variables: {
                    distgit_instance: kojiInstance,
                    koji_instance: kojiInstance,
                    task_id: Number(artifact.aid),
                },
                errorPolicy: 'all',
            },
        );

    // Fetch information on related advisories (errata).
    const { data: dataAdvisories, loading: loadingAdvisories } =
        useQuery<ErrataLinkedAdvisoriesReply>(LinkedErrataAdvisories, {
            variables: {
                nvrs: [artifact.payload.nvr],
            },
            errorPolicy: 'all',
        });

    if (loading) {
        return <BuildInfoLoading />;
    }

    if (error) {
        return <BuildInfoError message={error.message} />;
    }

    const build = data?.koji_task?.builds?.[0];

    if (!build) {
        return <BuildInfoEmpty />;
    }

    const advisoryCount =
        dataAdvisories?.teiid_et_linked_advisories?.length || 0;

    return (
        <Tabs
            className="pf-u-pt-sm"
            activeKey={activeTabKey}
            inset={{ default: 'insetLg' }}
            onSelect={(_event, tabIndex) => {
                setActiveTabKey(tabIndex.toString());
            }}
        >
            <Tab
                eventKey="summary"
                title={<TabTitleText>Build summary</TabTitleText>}
            >
                <BuildMetadataRpm build={build} instance={kojiInstance} />
            </Tab>
            <Tab
                eventKey="tags"
                title={
                    <TabTitleText>
                        Active tags <Badge isRead>{build.tags.length}</Badge>
                    </TabTitleText>
                }
            >
                <LimitWithScroll>
                    <TagsList instance={kojiInstance} tags={build.tags} />
                </LimitWithScroll>
            </Tab>
            <Tab
                eventKey="history"
                title={<TabTitleText>Tagging history</TabTitleText>}
            >
                <LimitWithScroll>
                    <HistoryList history={build.history?.tag_listing} />
                </LimitWithScroll>
            </Tab>
            <Tab
                eventKey="errata automation"
                title={<TabTitleText>Errata automation</TabTitleText>}
            >
                <LimitWithScroll>
                    <ErrataAutomation artifact={artifact} />
                </LimitWithScroll>
            </Tab>
            {advisoryCount > 0 && (
                <Tab
                    eventKey="advisories"
                    title={
                        <TabTitleText>
                            Related advisories{' '}
                            <Badge isRead>{advisoryCount}</Badge>
                        </TabTitleText>
                    }
                >
                    <LoadingData show={loadingAdvisories} />
                    <LimitWithScroll>
                        <LinkedAdvisories
                            linkedAdvisories={
                                dataAdvisories?.teiid_et_linked_advisories
                            }
                        />
                    </LimitWithScroll>
                </Tab>
            )}
        </Tabs>
    );
}

export interface BuildInfoProps {
    artifact: Artifact;
}

export function BuildInfo({ artifact }: BuildInfoProps) {
    if (isArtifactMBS(artifact)) return <BuildInfoMbs artifact={artifact} />;
    if (isArtifactRPM(artifact)) return <BuildInfoRpm artifact={artifact} />;
    return <BuildInfoEmpty />;
}
