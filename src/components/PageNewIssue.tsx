/*
 * This file is part of ciboard

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
    Grid,
    Title,
    Stack,
    CardBody,
    GridItem,
    StackItem,
    CardHeader,
    Spinner,
} from '@patternfly/react-core';
import { useQuery } from '@apollo/client';

import { config } from '../config';
import { PageCommon } from './PageCommon';
import WaiverdbInfoQuery from '../queries/WaiverdbInfo';
import WaiverdbPermissionsQuery from '../queries/WaiverdbPermissions';
import {
    Table,
    TableBody,
    TableHeader,
    TableVariant,
} from '@patternfly/react-table';
import { TableRowsType } from '../utils/artifactsTable';

const mkSeparatedList = (
    elements: Array<string>,
    separator: JSX.Element = <>', '</>,
) => {
    if (_.isNil(elements)) return null;
    const ret = _.reduce<string, (string | JSX.Element)[]>(
        elements,
        (acc, el) => {
            if (_.size(acc) === 0) {
                acc.push(el);
                return acc;
            }
            acc.push(separator);
            acc.push(el);
            return acc;
        },
        [],
    );
    return <>{ret}</>;
};

const Help = () => (
    <Grid hasGutter>
        <GridItem span={6}>
            <Card isHoverable>
                <CardHeader>
                    <Title headingLevel="h3" size="2xl">
                        BaseOS
                    </Title>
                </CardHeader>
                <CardBody>
                    <Stack>
                        <StackItem>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12404&issuetype=2&priority=3&labels=BaseOS-CI&description=Component:%0A%0AWhat+to+do:%0A%0ANotes:&summary=Change+of+configuration+for&components=18485&labels=user_request&labels=user_request_new"
                            >
                                Request config change
                            </a>
                        </StackItem>
                        <StackItem>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12404&issuetype=1&priority=3&labels=BaseOS-CI&labels=user_request&labels=user_request_new"
                            >
                                New item
                            </a>
                        </StackItem>
                        <StackItem>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://projects.engineering.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12404&issuetype=2&priority=3&labels=BaseOS-CI&labels=user_request&labels=user_request_new"
                            >
                                New RFE
                            </a>
                        </StackItem>
                    </Stack>
                </CardBody>
            </Card>
        </GridItem>
        <GridItem span={6}>
            <Card isHoverable className="pf-u-h-100">
                <CardHeader>
                    <Title headingLevel="h3" size="2xl">
                        OSCI
                    </Title>
                </CardHeader>
                <CardBody>
                    <Stack>
                        <StackItem></StackItem>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://issues.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12325047&issuetype=1&priority=3&labels=user_request&labels=user_request"
                        >
                            New bug
                        </a>
                        <StackItem>
                            <a
                                target="_blank"
                                rel="noopener noreferrer"
                                href="https://issues.redhat.com/secure/CreateIssueDetails!init.jspa?pid=12325047&issuetype=6&priority=3&labels=user_request&labels=user_request_new"
                            >
                                New RFE
                            </a>
                        </StackItem>
                    </Stack>
                </CardBody>
            </Card>
        </GridItem>
        <GridItem span={6}>
            <WaiverdbPermissions />
        </GridItem>
        <GridItem span={6}>
            <WaiverdbInfo />
        </GridItem>
    </Grid>
);

const WaiverdbInfo: React.FC = () => {
    const { loading, error, data } = useQuery(WaiverdbInfoQuery);
    var info = { version: '', auth_method: '' };
    if (loading) {
        return <Spinner />;
    }
    if (_.isError(error)) {
        return <StackItem>{error.message}</StackItem>;
    }
    info = data.waiver_db_info;
    return (
        <Card>
            <CardHeader>
                <Title headingLevel="h3" size="2xl">
                    WaiverDB Info
                </Title>
            </CardHeader>
            <CardBody>
                <Stack hasGutter>
                    <StackItem>Version: {info.version}</StackItem>
                    <StackItem>Auth method: {info.auth_method}</StackItem>
                </Stack>
            </CardBody>
        </Card>
    );
};

type WaiverDBPermissionType = {
    name: string;
    description: string;
    maintainers: Array<string>;
    testcases: Array<string>;
    users?: Array<string>;
    groups?: Array<string>;
};

const WaiverdbPermissions = () => {
    const { loading, error, data } = useQuery(WaiverdbPermissionsQuery);
    const rows: TableRowsType = [];
    const mkRow = (permission: WaiverDBPermissionType) => {
        const patterns = mkSeparatedList(permission.testcases, <br />);
        const users = mkSeparatedList(permission.users || [], <br />);
        const groups = mkSeparatedList(permission.groups || [], <br />);
        return {
            cells: [patterns, <>{users}</>, <>{groups}</>],
        };
    };
    if (loading) {
        return <Spinner />;
    }
    if (_.isError(error)) {
        return <StackItem>{error.message}</StackItem>;
    }
    const perms = data.waiver_db_permissions as Array<WaiverDBPermissionType>;
    _.forEach(perms, (permission) => rows.push(mkRow(permission)));
    const columns = [
        { title: 'Test case patterns' },
        { title: 'Users' },
        { title: 'Groups' },
    ];
    return (
        <Card>
            <CardHeader>
                <Title headingLevel="h3" size="2xl">
                    WaiverDB Permissions
                </Title>
            </CardHeader>
            <CardBody>
                <>
                    <Table
                        aria-label="Table WaiverDB config"
                        variant={TableVariant.compact}
                        borders={true}
                        cells={columns}
                        rows={rows}
                    >
                        <TableHeader />
                        <TableBody />
                    </Table>
                </>
            </CardBody>
        </Card>
    );
};

const PageNewIssue = () => {
    return (
        <PageCommon
            title={`Report issue | ${config.defaultTitle}`}
        >
            <Help />
        </PageCommon>
    );
};

export default PageNewIssue;
