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
    ArtifactMBS,
    ArtifactRPM,
    KojiBuildInfo,
    KojiInstanceType,
    koji_instance,
} from '../../artifact';
import {
    ArtifactsDetailedInfoKojiTask,
    ArtifactsDetailedInfoKojiTaskData,
} from '../../queries/Artifacts';
import {
    ErrataLinkedAdvisoriesReply,
    LinkedErrataAdvisories,
} from '../../queries/Errata';
import {
    mkCommitHashFromSource,
    mkLinkKojiWebBuildId,
    mkLinkKojiWebUserId,
    mkLinkPkgsDevelFromSource,
} from '../../utils/artifactUtils';
import { secondsToTimestampWithTz } from '../../utils/timeUtils';
import {
    ErrataAutomation,
    HistoryList,
    LimitWithScroll,
    LinkedAdvisories,
    LoadingData,
    TagsList,
} from '../ArtifactDetailedInfo';
import { ExternalLink } from '../ExternalLink';

interface BuildMetadataProps {
    build: KojiBuildInfo;
    instance: KojiInstanceType;
}

function BuildMetadata(props: BuildMetadataProps) {
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

    return (
        <DescriptionList
            className={classNames(
                'pf-u-px-xl',
                'pf-u-py-lg',
                styles['buildInfo'],
            )}
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

interface BuildInfoProps {
    artifact: ArtifactMBS | ArtifactRPM;
}

export function BuildInfo(props: BuildInfoProps) {
    const { artifact } = props;
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
    const { loading: loadingAdvisories, data: dataAdvisories } =
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
                <BuildMetadata build={build} instance={kojiInstance} />
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
                    <TagsList build={build} instance={kojiInstance} />
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
                <LoadingData show={loadingAdvisories} />
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
