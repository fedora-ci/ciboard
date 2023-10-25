/*
 * This file is part of ciboard

 * Copyright (c) 2022 Andrei Stepanov <astepano@redhat.com>
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

export const MetadataRawListQuery = gql`
    query MetadataRawListQuery {
        metadataRaw {
            _id
            priority
            testcaseName
            productVersion
            testcaseNameIsRegex
        }
    }
`;

export const MetadataRawQuery = gql`
    query MetadataRawQuery($_id: String) {
        metadataRaw(_id: $_id) {
            _id
            payload
            priority
            testcaseName
            productVersion
            testcaseNameIsRegex
        }
    }
`;

export const MetadataQuery = gql`
    query MetadataQuery($testcaseName: String!, $productVersion: String) {
        metadataConsolidated(
            testcaseName: $testcaseName
            productVersion: $productVersion
        ) {
            payload
        }
    }
`;
