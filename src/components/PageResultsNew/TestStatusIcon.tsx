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
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon,
    GhostIcon,
    HandPaperIcon,
    HourglassHalfIcon,
    IconSize,
    InfoCircleIcon,
    InProgressIcon,
    QuestionCircleIcon,
} from '@patternfly/react-icons';

import { TestStatus } from './types';

export interface TestStatusIconProps {
    isWaived?: boolean;
    size?: IconSize | keyof typeof IconSize;
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
    const commonIconProps = {
        size: size || ('sm' as IconSize),
        style,
    };

    // Waived status takes precedence over everything else.
    if (isWaived)
        return (
            <HandPaperIcon
                className="pf-u-warning-color-100"
                title="Test failed but has been waived"
                {...commonIconProps}
            />
        );
    // Regular statuses follow.
    if (status === 'error')
        return (
            <ExclamationTriangleIcon
                className="pf-u-warning-color-100"
                title="Failed because of an infrastructure problem"
                {...commonIconProps}
            />
        );
    if (status === 'failed')
        return (
            <ExclamationCircleIcon
                className="pf-u-danger-color-100"
                title="Failed because one or more test cases failed"
                {...commonIconProps}
            />
        );
    if (status === 'info')
        return (
            <InfoCircleIcon
                className="pf-u-info-color-100"
                title="This result is informative"
                {...commonIconProps}
            />
        );
    if (status === 'missing')
        return (
            <GhostIcon
                className="pf-u-color-200"
                title="Results for this test are missing"
                {...commonIconProps}
            />
        );
    if (status === 'passed')
        return (
            <CheckCircleIcon
                className="pf-u-success-color-100"
                title="Test passed"
                {...commonIconProps}
            />
        );
    if (status === 'queued')
        return (
            <HourglassHalfIcon
                className="pf-u-color-200"
                title="Test has been queued but hasn't run yet"
                {...commonIconProps}
            />
        );
    if (status === 'running')
        return (
            <InProgressIcon
                className="pf-u-color-200"
                title="Test is currently running"
                {...commonIconProps}
            />
        );

    // This should never happen.
    console.error(`Unknown test status '${status}'`);
    return (
        <QuestionCircleIcon className="pf-u-color-100" {...commonIconProps} />
    );
}
