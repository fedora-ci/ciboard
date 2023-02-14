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

import { secondsToTimestampWithTz } from './timeUtils';

test('zero time converts correctly', () => {
    const unixTimestamp = 0;
    const timestampWithTz = '1970-01-01 01:00 +0100';
    expect(secondsToTimestampWithTz(unixTimestamp)).toEqual(timestampWithTz);
});

test('non-zero time converts correctly', () => {
    const unixTimestamp = 1675159583;
    const timestampWithTz = '2023-01-31 11:06 +0100';
    expect(secondsToTimestampWithTz(unixTimestamp)).toEqual(timestampWithTz);
});

test('non-zero DST time converts correctly', () => {
    const unixTimestamp = 1686719691;
    const timestampWithTz = '2023-06-14 07:14 +0200';
    expect(secondsToTimestampWithTz(unixTimestamp)).toEqual(timestampWithTz);
});
