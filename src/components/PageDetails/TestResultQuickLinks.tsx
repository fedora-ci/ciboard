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
import { Button, DrawerPanelBody, Flex } from '@patternfly/react-core';
import { useContext } from 'react';

import { ExternalLink } from '../ExternalLink';
import { SelectedTestContext } from './contexts';
import { ExternalLinkAltIcon, FileAltIcon } from '@patternfly/react-icons';

export function TestResultQuickLinks(_props: {}) {
    const selectedTest = useContext(SelectedTestContext);

    if (!selectedTest) return null;

    const { logsUrl, runDetailsUrl } = selectedTest;

    if (_.isEmpty(logsUrl) && _.isEmpty(runDetailsUrl)) return null;

    return (
        <DrawerPanelBody className="pf-u-py-md">
            <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
                {runDetailsUrl && (
                    <Button
                        component={ExternalLink}
                        href={runDetailsUrl}
                        icon={<ExternalLinkAltIcon />}
                        size="sm"
                    >
                        Run details
                    </Button>
                )}
                {logsUrl && (
                    <Button
                        component={ExternalLink}
                        href={logsUrl}
                        icon={<FileAltIcon />}
                        size="sm"
                        variant="secondary"
                    >
                        Logs
                    </Button>
                )}
            </Flex>
        </DrawerPanelBody>
    );
}
