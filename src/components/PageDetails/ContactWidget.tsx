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
import * as React from 'react';
import { useQuery } from '@apollo/client';
import {
    Alert,
    Bullseye,
    Spinner,
    Text,
    TextContent,
} from '@patternfly/react-core';
import { UsersIcon } from '@patternfly/react-icons';

import { ExternalLink } from '../ExternalLink';
import { CiContact } from './types';
import { MetadataQuery } from '../../queries/Metadata';
import { MetadataQueryResult } from '../MetadataInfo';

function mkSeparatedListNatural(
    elements: React.ReactNode[],
    separator: React.ReactNode = ', ',
    lastSeparator: React.ReactNode = ' and ',
) {
    if (_.isNil(elements)) return null;
    return elements.reduce(
        (acc, el, i) =>
            acc === null ? (
                <>{el}</>
            ) : (
                <>
                    {acc}
                    {i === elements.length - 1 ? lastSeparator : separator}
                    {el}
                </>
            ),
        null,
    );
}

export interface ContactWidgetProps {
    contact?: CiContact;
}

export function ContactWidget({ contact }: ContactWidgetProps) {
    if (!contact || !contact?.team) return null;

    let contactLinks: JSX.Element[] = [];

    if (contact.slackChannelUrl) {
        contactLinks.push(
            <ExternalLink
                className="pf-u-font-weight-bold"
                href={contact.slackChannelUrl}
            >
                via Slack
            </ExternalLink>,
        );
    }
    if (contact.gchatRoomUrl) {
        contactLinks.push(
            <ExternalLink
                className="pf-u-font-weight-bold"
                href={contact.gchatRoomUrl}
            >
                via Chat
            </ExternalLink>,
        );
    }
    if (contact.email) {
        contactLinks.push(
            <>
                via email at{' '}
                <ExternalLink
                    className="pf-u-font-weight-bold"
                    href={`mailto:${contact.email}`}
                >
                    {contact.email}
                </ExternalLink>
            </>,
        );
    }

    let reachOutText = contactLinks.length ? (
        <>
            If you need help with this test, you can reach out to the team{' '}
            {mkSeparatedListNatural(contactLinks, ', ', ' or ')}.
        </>
    ) : null;

    return (
        <Alert
            customIcon={<UsersIcon />}
            isInline
            title={`Test owned by ${contact.team}`}
            variant="info"
        >
            <TextContent>
                <Text>
                    This test result is provided by the <b>{contact.team}</b>{' '}
                    team. {reachOutText}
                </Text>
            </TextContent>
        </Alert>
    );
}

export interface MissingTestContactWidgetProps {
    productVersion?: string;
    testcaseName?: string;
}

export function MissingTestContactWidget(props: MissingTestContactWidgetProps) {
    const variables: any = { testcase_name: props.testcaseName };
    if (!_.isNil(props.productVersion)) {
        variables.product_version = props.productVersion;
    }

    const { data, loading } = useQuery<MetadataQueryResult>(MetadataQuery, {
        variables,
        errorPolicy: 'all',
        /* need to re-fetch each time when user press save/back button */
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        skip: _.isEmpty(props.testcaseName),
    });

    const metadataContact = data?.metadata_consolidated.payload?.contact;
    const haveData = !loading && !_.isEmpty(metadataContact);

    if (loading) {
        return (
            <Alert
                customIcon={<UsersIcon />}
                isInline
                title="Loading contact info…"
                variant="info"
            >
                <Bullseye>
                    <Spinner size="lg" />
                </Bullseye>
            </Alert>
        );
    }

    if (!haveData) {
        return (
            <Alert
                customIcon={<UsersIcon />}
                isInline
                title="No contact information available"
                variant="warning"
            >
                Unfortunately, we were unable to obtain any ownership or contact
                information for this test. Who owns or maintains it remains a
                mystery.
            </Alert>
        );
    }

    let contact: CiContact = {
        docsUrl: metadataContact.docs,
        email: metadataContact.email,
        gchatRoomUrl: metadataContact.gchat_room_url,
        name: metadataContact.name,
        reportIssueUrl: metadataContact.report_issue_url,
        slackChannelUrl: metadataContact.slack_channel_url,
        team: metadataContact.team,
        url: metadataContact.url,
    };

    return <ContactWidget contact={contact} />;
}
