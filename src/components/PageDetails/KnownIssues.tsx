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
import { List, ListItem } from '@patternfly/react-core';
import {
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    InfoCircleIcon,
} from '@patternfly/react-icons';

import './index.css';
import { MetadataKnownIssue } from '../../types';
import { LinkifyNewTab } from '../../utils/utils';

interface KnownIssueIconProps {
    severity: MetadataKnownIssue['severity'];
}

function KnownIssueIcon({ severity }: KnownIssueIconProps) {
    if (severity === 'blocker' || severity === 'critical')
        return (
            <ExclamationCircleIcon
                className="pf-u-danger-color-100"
                title={`${severity} issue`}
            />
        );
    if (severity === 'major' || severity === 'normal')
        return (
            <ExclamationTriangleIcon
                className="pf-u-warning-color-100"
                title={`${severity} issue`}
            />
        );

    return (
        <InfoCircleIcon className="pf-u-info-color-100" title="minor issue" />
    );
}

export interface KnownIssuesProps {
    issues?: MetadataKnownIssue[];
}

export function KnownIssues(props: KnownIssuesProps) {
    const { issues } = props;

    if (_.isEmpty(issues)) return null;

    const items = issues?.map((issue, index) => {
        let title: undefined | string;

        if (issue.status === 'fixed') title = 'This issue has been fixed.';
        if (issue.status === 'irrelevant')
            title = 'This issue is not relevant for this test.';

        return (
            <ListItem className={issue.status} key={index} title={title}>
                <KnownIssueIcon severity={issue.severity} />{' '}
                <LinkifyNewTab>{issue.info}</LinkifyNewTab> ({issue.status})
            </ListItem>
        );
    });

    return <List className="knownIssuesList">{items}</List>;
}
