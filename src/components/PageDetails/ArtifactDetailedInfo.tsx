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
import {
    List,
    Flex,
    Alert,
    Spinner,
    FlexItem,
    ListItem,
    OrderType,
    HelperText,
    ListComponent,
    HelperTextItem,
    HelperTextItemProps,
} from '@patternfly/react-core';
import {
    Td,
    Th,
    Tr,
    Tbody,
    Thead,
    Table /* data-codemods */,
} from '@patternfly/react-table';

import styles from '../../custom.module.css';
import { config, mappingDatagrepperUrl } from '../../config';
import {
    getMsgId,
    getAType,
    getEtaMsgBody,
    getAEtaChildren,
    ErrataAutomationBugCiStatus,
} from '../../types';
import {
    Artifact,
    AChildEtaMsg,
    KojiBuildTag,
    KojiInstance,
    KojiBuildTagging,
    ErrataLinkedAdvisory,
} from '../../types';
import { LinkifyNewTab, mkLinkKojiWebTagId } from '../../utils/utils';
import { ExternalLink } from '../ExternalLink';
import { secondsToTimestampWithTz } from '../../utils/timeUtils';

export interface LoadingDataProps {
    show: boolean;
}

export const LoadingData: React.FC<LoadingDataProps> = (props) => {
    const { show } = props;
    if (!show) {
        return null;
    }
    return (
        <Flex className="pf-v5-u-p-lg">
            <FlexItem>
                <Spinner className="pf-v5-u-mr-md" size="md" /> Loading build
                info…
            </FlexItem>
        </Flex>
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
            className="pf-v5-u-font-size-sm"
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
        <Table aria-label="Simple table" variant="compact" borders={false}>
            <Thead>
                <Tr>
                    <Th>Product name</Th>
                    <Th>Status</Th>
                    <Th>Name</Th>
                </Tr>
            </Thead>
            <Tbody>{advs}</Tbody>
        </Table>
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
            <Flex className="pf-v5-u-p-lg">
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
            <Table
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
            </Table>
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
            className="pf-v5-u-font-size-sm"
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

export const LimitWithScroll = (props: React.PropsWithChildren) => {
    const { children } = props;
    return (
        <Flex className="pf-v5-u-p-md">
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
