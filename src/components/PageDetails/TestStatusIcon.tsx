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

import { CSSProperties } from 'react';
import {
    GhostIcon,
    HandPaperIcon,
    InfoCircleIcon,
    InProgressIcon,
    CheckCircleIcon,
    HourglassHalfIcon,
    QuestionCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
} from '@patternfly/react-icons';

import { TestStatus } from './types';
import { Icon, IconComponentProps } from '@patternfly/react-core';

type IconSize = IconComponentProps['size'];

export interface TestStatusIconProps {
    isWaived?: boolean;
    size?: IconSize;
    /**
     * String indicating the status/outcome of the test.
     * Examples: 'pass', 'failed', 'error', 'info'.
     */
    status: TestStatus;
    /** Additional styling for the icon. */
    style?: CSSProperties;
}

export function TestStatusIcon({
    isWaived,
    size,
    status,
    style,
}: TestStatusIconProps) {
    <Icon size="sm"></Icon>;
    const commonIconProps = {
        size: size || ('sm' as IconSize),
        style,
    };

    // Waived status takes precedence over everything else.
    if (isWaived)
        return (
            <Icon {...commonIconProps}>
                <HandPaperIcon
                    className="pf-v5-u-warning-color-100"
                    title="Test failed but has been waived"
                />
            </Icon>
        );
    // Regular statuses follow.
    if (status === 'error')
        return (
            <Icon {...commonIconProps}>
                <ExclamationTriangleIcon
                    className="pf-v5-u-warning-color-100"
                    title="Failed because of an infrastructure problem"
                />
            </Icon>
        );
    if (status === 'failed')
        return (
            <Icon {...commonIconProps}>
                <ExclamationCircleIcon
                    className="pf-v5-u-danger-color-100"
                    title="Failed because one or more test cases failed"
                />
            </Icon>
        );
    if (status === 'info')
        return (
            <Icon {...commonIconProps}>
                <InfoCircleIcon
                    className="pf-v5-u-info-color-100"
                    title="This result is informative"
                />
            </Icon>
        );
    if (status === 'missing')
        return (
            <Icon {...commonIconProps}>
                <GhostIcon
                    className="pf-v5-u-color-200"
                    title="Results for this test are missing"
                />
            </Icon>
        );
    if (status === 'passed')
        return (
            <Icon {...commonIconProps}>
                <CheckCircleIcon
                    className="pf-v5-u-success-color-100"
                    title="Test passed"
                />
            </Icon>
        );
    if (status === 'queued')
        return (
            <Icon {...commonIconProps}>
                <HourglassHalfIcon
                    className="pf-v5-u-color-200"
                    title="Test has been queued but hasn't run yet"
                />
            </Icon>
        );
    if (status === 'running')
        return (
            <Icon {...commonIconProps}>
                <InProgressIcon
                    className="pf-v5-u-color-200"
                    title="Test is currently running"
                />
            </Icon>
        );

    // This should never happen.
    console.error(`Unknown test status '${status}'`);
    return (
        <Icon {...commonIconProps}>
            <QuestionCircleIcon className="pf-v5-u-color-100" />
        </Icon>
    );
}
