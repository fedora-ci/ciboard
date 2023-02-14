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
 * Format a timestamp as a date and time with time zone offset.
 * @param seconds Number of seconds since the Unix epoch.
 * @returns Formatted timestamp as a string.
 */
export function secondsToTimestampWithTz(seconds: number) {
    const localTime = moment.unix(seconds).local();
    return localTime.format(TIMESTAMP_WITH_TZ_FORMAT);
}
