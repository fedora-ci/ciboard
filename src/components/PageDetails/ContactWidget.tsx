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
import React from 'react';
import { Text, Alert, TextContent } from '@patternfly/react-core';
import { UsersIcon } from '@patternfly/react-icons';

import { CiContact, CiTest } from './types';
import { ExternalLink } from '../ExternalLink';

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
                className="pf-v5-u-font-weight-bold"
                href={contact.slackChannelUrl}
            >
                via Slack
            </ExternalLink>,
        );
    }
    if (contact.gchatRoomUrl) {
        contactLinks.push(
            <ExternalLink
                className="pf-v5-u-font-weight-bold"
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
                    className="pf-v5-u-font-weight-bold"
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
    ciTest: CiTest;
}
