/*
 * This file is part of ciboard

 * Copyright (c) 2021 Andrei Stepanov <astepano@redhat.com>
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
} from '@patternfly/react-core';

import PageCommon from './PageCommon';

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
    </Grid>
);

const PageNewIssue = () => {
    return (
        <PageCommon>
            <Help />
        </PageCommon>
    );
};

export default PageNewIssue;
