/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021, 2022 Andrei Stepanov <astepano@redhat.com>
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
import {
    Card,
    CardBody,
    CardHeader,
    Flex,
    List,
    ListItem,
    Spinner,
    Text,
    TextContent,
    Title,
} from '@patternfly/react-core';
import {
    ICell,
    IRow,
    Table,
    TableBody,
    TableHeader,
    TableVariant,
} from '@patternfly/react-table';
import { useQuery } from '@apollo/client';

import { config } from '../config';
import { PageCommon } from './PageCommon';
import { ExternalLink } from './ExternalLink';
import WaiverdbInfoQuery from '../queries/WaiverdbInfo';
import WaiverdbPermissionsQuery from '../queries/WaiverdbPermissions';
import { mkSeparatedList } from '../utils/artifactsTable';

interface WaiverDbInfo {
    auth_method: string;
    version: string;
}

interface WaiverDbInfoQueryResult {
    waiver_db_info: WaiverDbInfo;
}

interface WaiverDbPermission {
    name: string;
    description: string;
    maintainers: string[];
    testcases: string[];
    users?: string[];
    groups?: string[];
}

interface WaiverDbPermissionsQueryResult {
    waiver_db_permissions: WaiverDbPermission[];
}

function WaiverDbPermissions() {
    const { loading, error, data } = useQuery<WaiverDbPermissionsQueryResult>(
        WaiverdbPermissionsQuery,
    );
    const mkRow = (permission: WaiverDbPermission) => {
        const patterns = mkSeparatedList(permission.testcases, <br />);
        const users = mkSeparatedList(permission.users || [], <br />);
        const groups = mkSeparatedList(permission.groups || [], <br />);
        const row: IRow = { cells: [patterns, <>{users}</>, <>{groups}</>] };
        return row;
    };
    if (loading) {
        return <Spinner size="md" />;
    }
    if (_.isError(error)) {
        return <div className="pf-u-danger-color-100">{error.message}</div>;
    }
    const perms = data!.waiver_db_permissions as WaiverDbPermission[];
    const rows: IRow[] = _.map(perms, (permission) => mkRow(permission));
    const columns: ICell[] = [
        { title: 'Test case patterns' },
        { title: 'Users' },
        { title: 'Groups' },
    ];
    return (
        <Table
            aria-label="Table of current WaiverDB permissions"
            borders
            cells={columns}
            rows={rows}
            variant={TableVariant.compact}
        >
            <TableHeader />
            <TableBody />
        </Table>
    );
}

function WaiverDbInfoSummary() {
    const { loading, error, data } =
        useQuery<WaiverDbInfoQueryResult>(WaiverdbInfoQuery);
    if (loading) {
        return <Spinner size="md" />;
    }
    if (_.isError(error)) {
        return <div className="pf-u-danger-color-100">{error.message}</div>;
    }
    const info = data!.waiver_db_info;
    return (
        <TextContent>
            <Text>
                WaiverDB version: {info.version}. Auth method:{' '}
                {info.auth_method}.
            </Text>
        </TextContent>
    );
}

const WaiverDbCard: React.FC<{}> = () => (
    <Card>
        <CardHeader>
            <Title headingLevel="h3" size="2xl">
                WaiverDB permissions
            </Title>
        </CardHeader>
        <CardBody>
            <WaiverDbInfoSummary />
            <WaiverDbPermissions />
        </CardBody>
    </Card>
);

const BaseOsCard: React.FC<{}> = () => (
    <Card>
        <CardHeader>
            <Title headingLevel="h3" size="2xl">
                BaseOS
            </Title>
        </CardHeader>
        <CardBody>
            <List>
                <ListItem>
                    <ExternalLink href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12404&issuetype=2&priority=3&labels=BaseOS-CI&description=Component:%0A%0AWhat+to+do:%0A%0ANotes:&summary=Change+of+configuration+for&components=18485&labels=user_request&labels=user_request_new">
                        Request config change
                    </ExternalLink>
                </ListItem>
                <ListItem>
                    <ExternalLink href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12404&issuetype=1&priority=3&labels=BaseOS-CI&labels=user_request&labels=user_request_new">
                        New item
                    </ExternalLink>
                </ListItem>
                <ListItem>
                    <ExternalLink href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12404&issuetype=2&priority=3&labels=BaseOS-CI&labels=user_request&labels=user_request_new">
                        New RFE
                    </ExternalLink>
                </ListItem>
            </List>
        </CardBody>
    </Card>
);

const OsciCard: React.FC<{}> = () => (
    <Card className="pf-u-h-100">
        <CardHeader>
            <Title headingLevel="h3" size="2xl">
                OSCI
            </Title>
        </CardHeader>
        <CardBody>
            <List>
                <ListItem>
                    <ExternalLink href="https://issues.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12325047&issuetype=1&components=12339807&priority=3&labels=user_request&labels=osci-dashboard">
                        File a CI Dashboard bug
                    </ExternalLink>
                </ListItem>
                <ListItem>
                    <ExternalLink href="https://issues.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12325047&issuetype=1&priority=3&labels=user_request&labels=user_request">
                        File an OSCI bug
                    </ExternalLink>
                </ListItem>
                <ListItem>
                    <ExternalLink href="https://issues.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12325047&issuetype=6&priority=3&labels=user_request&labels=user_request_new">
                        File an OSCI RFE
                    </ExternalLink>
                </ListItem>
            </List>
        </CardBody>
    </Card>
);

export function PageNewIssue() {
    return (
        <PageCommon title={`Report issue | ${config.defaultTitle}`}>
            <Flex
                direction={{ default: 'column', md: 'row' }}
                spaceItems={{ default: 'spaceItemsLg' }}
            >
                <Flex
                    direction={{ default: 'column' }}
                    flex={{ default: 'flexDefault', md: 'flex_1' }}
                    spaceItems={{ default: 'spaceItemsLg' }}
                >
                    <OsciCard />
                    <BaseOsCard />
                </Flex>
                <Flex flex={{ default: 'flexDefault', md: 'flex_2' }}>
                    <WaiverDbCard />
                </Flex>
            </Flex>
        </PageCommon>
    );
}
