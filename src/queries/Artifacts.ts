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

const stateEntryFragment = gql`
    fragment StateEntryFragment on StateType {
        broker_msg_body
        kai_state {
            stage
            state
            msg_id
            version
            thread_id
            timestamp
            test_case_name
        }
    }
`;

const mainFragment = gql`
    fragment MainFragment on ArtifactType {
        _id
        aid
        type
        payload {
            ... on ArtifactRPMBuildType {
                nvr
                uid
                branch
                issuer
                source
                scratch
                component
                comment_id
                repository
                commit_hash
                dependencies
                gate_tag_name
            }
            ... on ArtifactMBSBuildType {
                uid
                name
                nsvc
                stream
                context
                version
            }
            ... on ArtifactComposeType {
                compose_type
            }
        }
    }
`;

const statesFragment = gql`
    fragment StatesFragment on ArtifactType {
        _id
        states(onlyactual: true) {
            ...StateEntryFragment
        }
    }
    ${stateEntryFragment}
`;

/**
export const ArtifactsQuery = gql`
    query Artifacts(
        $atype: String!
        $limit: Int
        $aid_offset: String
        $regexs: [String]
        $dbFieldName: String
        $dbFieldValues: [String]
        $options: ArtifactsOptionsInputType
    ) {
        db_artifacts(
            atype: $atype
            limit: $limit
            regexs: $regexs
            options: $options
            aid_offset: $aid_offset
            dbFieldName: $dbFieldName
            dbFieldValues: $dbFieldValues
        ) {
            has_next
            artifacts {
                ...MainFragment
            }
        }
    }
    ${mainFragment}
`;
*/

export const ArtifactsStatesQuery = gql`
    query ArtifactsStates(
        $atype: String!
        $limit: Int
        $aid_offset: String
        $regexs: [String]
        $dbFieldName: String
        $dbFieldValues: [String]
        $options: ArtifactsOptionsInputType
    ) {
        db_artifacts(
            atype: $atype
            limit: $limit
            regexs: $regexs
            options: $options
            aid_offset: $aid_offset
            dbFieldName: $dbFieldName
            dbFieldValues: $dbFieldValues
        ) {
            has_next
            artifacts {
                ...StatesFragment
            }
        }
    }
    ${statesFragment}
`;

export const ArtifactsDetailedInfoKojiTask = gql`
    query ArtifactsDetailedInfoKojiBuild(
        $task_id: Int!
        $koji_instance: KojiInstanceInputType
        $distgit_instance: DistGitInstanceInputType
    ) {
        koji_task(task_id: $task_id, instance: $koji_instance) {
            builds(task_id: $task_id, instance: $koji_instance) {
                nvr
                name
                source
                release
                version
                build_id
                owner_id
                owner_name
                package_id
                completion_time
                completion_ts
                tags(instance: $koji_instance) {
                    name
                    id
                }
                history(instance: $koji_instance) {
                    tag_listing {
                        tag_name
                        tag_id
                        active
                        create_ts
                        creator_id
                        creator_name
                        revoke_ts
                        revoker_id
                        revoker_name
                    }
                }
                commit_obj(instance: $distgit_instance) {
                    committer_name
                    committer_email
                    committer_date_seconds
                    commit_message
                }
            }
        }
    }
`;

export const ArtifactsCompleteQuery = gql`
    query ArtifactsComplete(
        $limit: Int
        $atype: String!
        $aid_offset: String
        $regexs: [String]
        $dbFieldName: String
        $dbFieldValues: [String]
        $options: ArtifactsOptionsInputType
    ) {
        db_artifacts(
            atype: $atype
            limit: $limit
            regexs: $regexs
            options: $options
            aid_offset: $aid_offset
            dbFieldName: $dbFieldName
            dbFieldValues: $dbFieldValues
        ) {
            has_next
            artifacts {
                ...MainFragment
                ...StatesFragment
            }
        }
    }
    ${mainFragment}
    ${statesFragment}
`;

export const ArtifactsListByFiltersQuery1 = gql`
    query ArtifactsListByFiltersQuery1(
        $limit: Int
        $atype: String!
        $aid_offset: String
        $regexs: [String]
        $dbFieldName: String
        $dbFieldValues: [String]
        $options: ArtifactsOptionsInputType
    ) {
        db_artifacts(
            atype: $atype
            limit: $limit
            regexs: $regexs
            options: $options
            aid_offset: $aid_offset
            dbFieldName: $dbFieldName
            dbFieldValues: $dbFieldValues
        ) {
            has_next
            artifacts {
                ...MainFragment
                ...StatesFragment
            }
        }
    }
    ${mainFragment}
    ${statesFragment}
`;

/**
 *  Refetch states fragment. Need to find replaces, data, and write merge for it.
 * https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-arrays-of-non-normalized-objects
 */
/**
 * This query is used when need to fetch xunit for specific test-result.
 */
export const ArtifactsXunitQuery = gql`
    query ArtifactsXunitQuery(
        $atype: String!
        $limit: Int
        $aid_offset: String
        $regexs: [String]
        $msg_id: [String]
        $dbFieldName: String
        $dbFieldValues: [String]
        $options: ArtifactsOptionsInputType
    ) {
        db_artifacts(
            atype: $atype
            limit: $limit
            regexs: $regexs
            options: $options
            aid_offset: $aid_offset
            dbFieldName: $dbFieldName
            dbFieldValues: $dbFieldValues
        ) {
            has_next
            artifacts {
                ...StatesFragment
                states(onlyactual: true) {
                    kai_state {
                        msg_id
                    }
                    broker_msg_xunit(msg_id: $msg_id)
                }
            }
        }
    }
    ${statesFragment}
`;
