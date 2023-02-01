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

import { useState } from 'react';
import {
    Badge,
    CardBody,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Tab,
    Tabs,
    TabTitleText,
} from '@patternfly/react-core';
import classNames from 'classnames';

import styles from '../../custom.module.css';
import { ExternalLink } from '../ExternalLink';

interface BuildMetadataProps {
    buildId: number;
    buildTime: string;
    commit: string;
    commitTime: string;
    committerEmail?: string;
    committerName?: string;
    owner: string;
}

function BuildMetadata(props: BuildMetadataProps) {
    const items = [
        {
            label: 'Build ID',
            value: <ExternalLink href="#">{props.buildId}</ExternalLink>,
        },
        {
            label: 'Git commit',
            value: (
                <ExternalLink
                    className={styles['buildInfoCommitHash']}
                    href="#"
                >
                    {props.commit}
                </ExternalLink>
            ),
        },
        {
            label: 'Build owner',
            value: <ExternalLink href="#">{props.owner}</ExternalLink>,
        },
        {
            label: 'Committer',
            value: (
                <>
                    {props.committerName || 'n/a'}
                    &nbsp;&lt;
                    {props.committerEmail || 'n/a'}
                    &gt;
                </>
            ),
        },
        {
            label: 'Build completed',
            value: props.buildTime,
            className: styles['buildInfoTimestamp'],
        },
        {
            label: 'Commit time',
            value: props.commitTime,
            className: styles['buildInfoTimestamp'],
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

export function BuildInfo(_props: {}) {
    const [activeTabKey, setActiveTabKey] = useState('summary');

    // TODO: Replace with real data.
    const buildProps = {
        buildId: 2181999,
        buildTime: '2022-09-16 10:27 +02:00',
        commit: '81bf54a75572bddc61e6b0b250b4fb45c5aa9856',
        commitTime: '2022-09-16 09:12 +02:00',
        committerEmail: 'mgrabovs@redhat.com',
        committerName: 'Matěj Grabovský',
        owner: 'mgrabovs',
    };

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
                <BuildMetadata {...buildProps} />
            </Tab>
            <Tab
                eventKey="tags"
                title={
                    // TODO: Replace with real tags count.
                    <TabTitleText>
                        Active tags <Badge isRead>116</Badge>
                    </TabTitleText>
                }
            >
                <CardBody>
                    {/* TODO: List really active tags. See `TagsList` in `ArtifactDetailedInfo.tsx`. */}
                    Currently active Koji tags for this build will be listed
                    here.
                </CardBody>
            </Tab>
            <Tab
                eventKey="history"
                title={<TabTitleText>Tagging history</TabTitleText>}
            >
                <CardBody>
                    {/* TODO: List real tagging history. See `HistoryList` in `ArtifactDetailedInfo.tsx`. */}
                    Koji tagging history will be displayed here.
                </CardBody>
            </Tab>
            <Tab
                eventKey="advisories"
                title={
                    // TODO: Replace with real advisories count.
                    <TabTitleText>
                        Related advisories <Badge isRead>14</Badge>
                    </TabTitleText>
                }
            >
                <CardBody>
                    {/* TODO: List real advisories. See `LinkedAdvisories` in `ArtifactDetailedInfo.tsx`. */}
                    Advisories (errata) related to this build will be listed
                    here.
                </CardBody>
            </Tab>
        </Tabs>
    );
}
