/*
 * This file is part of ciboard
 *
 * Copyright (c) 2023 Matěj Grabovský <mgrabovs@redhat.com>
 * Copyright (c) 2023 Andrei Stepanov <astepano@redhat.com>
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
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import classNames from 'classnames';
import {
    Tab,
    Tabs,
    List,
    Alert,
    Badge,
    Spinner,
    ListItem,
    Bullseye,
    CardBody,
    OrderType,
    EmptyState,
    TabTitleText,
    ListComponent,
    EmptyStateBody,
    EmptyStateIcon,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
    EmptyStateHeader,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import {
    TagsList,
    HistoryList,
    LoadingData,
    LimitWithScroll,
    ErrataAutomation,
    LinkedAdvisories,
} from './ArtifactDetailedInfo';
import { ExternalLink } from '../ExternalLink';
import styles from '../../custom.module.css';
import {
    Artifact,
    ArtifactMbs,
    ArtifactRpm,
    KojiInstance,
    MbsBuildInfo,
    kojiInstance,
    KojiBuildInfo,
    isArtifactMbs,
    isArtifactRpm,
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
    mkLinkMbsBuild,
    mkLinkFileInGit,
    mkLinkKojiWebTask,
    mkLinkKojiWebUserId,
    mkLinkKojiWebBuildId,
    mkCommitHashFromSource,
    mkLinkPkgsDevelFromSource,
} from '../../utils/utils';
import {
    secondsToTimestampWithTz,
    timestampToTimestampWithTz,
} from '../../utils/timeUtils';

interface BuildMetadataMbsProps {
    build: MbsBuildInfo;
    instance: KojiInstance;
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
        'pf-v5-u-px-lg',
        'pf-v5-u-py-md',
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
    instance: KojiInstance;
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
        'pf-v5-u-px-lg',
        'pf-v5-u-py-md',
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
            <EmptyState variant="sm">
                <EmptyStateHeader
                    titleText="Could not load build information"
                    icon={
                        <EmptyStateIcon
                            className="pf-v5-u-danger-color-100"
                            icon={ExclamationCircleIcon}
                        />
                    }
                    headingLevel="h3"
                />
                <EmptyStateBody>{props.message}</EmptyStateBody>
            </EmptyState>
        </Bullseye>
    );
}

function BuildInfoLoading(_props: {}) {
    return (
        <Bullseye>
            <EmptyState variant="sm">
                <EmptyStateHeader
                    titleText="Loading build information…"
                    icon={<EmptyStateIcon icon={Spinner} />}
                    headingLevel="h3"
                />
            </EmptyState>
        </Bullseye>
    );
}

interface ModuleBuildComponentsProps {
    build?: MbsBuildInfo;
    instance: KojiInstance;
}

function ModuleBuildComponents(props: ModuleBuildComponentsProps) {
    const { build, instance } = props;

    if (_.isNil(build)) return null;

    return (
        <List
            className="pf-v5-u-font-size-sm"
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
    artifact: ArtifactMbs;
}
const BuildInfoMbs: React.FunctionComponent<BuildInfoMbsProps> = (props) => {
    const { artifact } = props;
    const { hit_source } = artifact;
    const [activeTabKey, setActiveTabKey] = useState('summary');
    const instance = kojiInstance(hit_source.aType);

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
                    build_id: Number(artifact.hit_source.mbsId),
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

    const build = data?.mbsBuild;

    if (!build) {
        return <BuildInfoEmpty />;
    }

    // Show different tab set for module builds (Components instead of 2× errata)
    return (
        <Tabs
            className="pf-v5-u-pt-sm"
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
};

interface BuildInfoRpmProps {
    artifact: ArtifactRpm;
}
const BuildInfoRpm: React.FunctionComponent<BuildInfoRpmProps> = (props) => {
    const { artifact } = props;
    const { hit_source } = artifact;
    const [activeTabKey, setActiveTabKey] = useState('summary');

    const kojiInst = kojiInstance(artifact.hit_source.aType);

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
                    distgit_instance: kojiInst,
                    koji_instance: kojiInst,
                    task_id: _.toNumber(hit_source.taskId),
                },
                errorPolicy: 'all',
            },
        );

    // Fetch information on related advisories (errata).
    const { data: dataAdvisories, loading: loadingAdvisories } =
        useQuery<ErrataLinkedAdvisoriesReply>(LinkedErrataAdvisories, {
            variables: {
                nvrs: [artifact.hit_source.nvr],
            },
            errorPolicy: 'all',
        });

    if (loading) {
        return <BuildInfoLoading />;
    }

    if (error) {
        return <BuildInfoError message={error.message} />;
    }

    const build = data?.kojiTask?.builds?.[0];

    if (!build) {
        return <BuildInfoEmpty />;
    }

    const advisoryCount = dataAdvisories?.teiidEtLinkedAdvisories?.length || 0;

    return (
        <Tabs
            className="pf-v5-u-pt-sm"
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
                <BuildMetadataRpm build={build} instance={kojiInst} />
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
                    <TagsList instance={kojiInst} tags={build.tags} />
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
                                dataAdvisories?.teiidEtLinkedAdvisories
                            }
                        />
                    </LimitWithScroll>
                </Tab>
            )}
        </Tabs>
    );
};

export interface BuildInfoProps {
    artifact: Artifact;
}

export function BuildInfo({ artifact }: BuildInfoProps) {
    if (isArtifactMbs(artifact)) return <BuildInfoMbs artifact={artifact} />;
    if (isArtifactRpm(artifact)) return <BuildInfoRpm artifact={artifact} />;
    return <BuildInfoEmpty />;
}
