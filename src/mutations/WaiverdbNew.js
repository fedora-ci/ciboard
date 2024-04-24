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

import { gql } from '@apollo/client';

export default gql`
    mutation WaiverdbNew(
        $subject_type: String!
        $subject_identifier: String!
        $testcase: String!
        $waived: Boolean!
        $product_version: String!
        $comment: String!
    ) {
        waiver_db_new(
            subject_type: $subject_type
            subject_identifier: $subject_identifier
            testcase: $testcase
            waived: $waived
            product_version: $product_version
            comment: $comment
        ) {
            id
            waived
            comment
            username
            testcase
            timestamp
            proxied_by
            subject_type
            subject {
                type
                item
            }
            product_version
            subject_identifier
        }
    }
`;
