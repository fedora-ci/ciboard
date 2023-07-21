/*
 * This file is part of ciboard
 *
 * Copyright (c) 2021, 2022 Andrei Stepanov <astepano@redhat.com>
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

import * as moment from 'moment';

const TIMESTAMP_WITH_TZ_FORMAT = 'YYYY-MM-DD HH:mm ZZ';

/**
 * Convert time in seconds to minutes or hours.
 * @param seconds Time in seconds.
 * @returns String in the format mm:ss, or hh:mm:ss if time is an hour or longer.
 */
export function humanReadableTime(seconds: number) {
    // TODO: Migrate away from the moment library.
    const duration = moment.duration(seconds, 'seconds');
    if (duration.hours() >= 1)
        return duration.format('hh:mm:ss', { trim: false });
    return duration.format('mm:ss', { trim: false });
}

/**
 * Format a timestamp as a date and time with time zone offset.
 * @param seconds Number of seconds since the Unix epoch.
 * @returns Formatted timestamp as a string.
 */
export function secondsToTimestampWithTz(seconds: number) {
    const localTime = moment.unix(seconds).local();
    return localTime.format(TIMESTAMP_WITH_TZ_FORMAT);
}

/**
 * Format a timestamp as a date and time with time zone offset.
 * @param timestamp Any timestamp parsable by the moment library.
 * Can be an ISO 8601 timestamp, e.g. 2022-12-21T02:30:50Z.
 * @returns Formatted timestamp as a string.
 */
export function timestampToTimestampWithTz(timestamp: string) {
    const localTime = moment.default(timestamp).local();
    return localTime.format(TIMESTAMP_WITH_TZ_FORMAT);
}
