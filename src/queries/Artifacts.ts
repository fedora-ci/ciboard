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

import { gql } from '@apollo/client';

const currentStateEntryFragment = gql`
    fragment CurrentStateEntryFragment on StateType {
        note
        docs
        type
        label
        state
        stage
        msg_id
        reason
        status
        string
        version
        category
        issue_url
        namespace
        thread_id
        processed
        generated_at
        recipients
        test_case_name
        error {
            reason
            issue_url
        }
        ci {
            irc
            url
            name
            team
            email
        }
        run {
            log
            url
            debug
            rebuild
            log_raw
            log_stream
            trigger_rebuild
            additional_info {
                module
                actual_module
                additional_info
            }
        }
        test {
            type
            docs
            note
            result
            category
            namespace
        }
        origin {
            reason
            creator
        }
        contact {
            irc
            url
            docs
            name
            team
            email
            version
        }
        artifact {
            id
            nvr
            type
            branch
            issuer
            source
            scratch
            component
        }
        pipeline {
            id
            name
            build
            stage
        }
        system {
            os
            label
            provider
            architecture
        }
        timestamp
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

const currentStateFragment = gql`
    fragment CurrentStateFragment on ArtifactType {
        _id
        current_state {
            error {
                ...CurrentStateEntryFragment
            }
            queued {
                ...CurrentStateEntryFragment
            }
            waived {
                ...CurrentStateEntryFragment
            }
            running {
                ...CurrentStateEntryFragment
            }
            complete {
                ...CurrentStateEntryFragment
            }
        }
    }
    ${currentStateEntryFragment}
`;

const gatingDecisionFragment = gql`
    fragment GatingDecisionFragment on ArtifactType {
        _id
        gating_decision {
            policies_satisfied
            unsatisfied_requirements {
                item {
                    item
                    type
                }
                type
                testcase
                scenario
                subject_type
                subject_identifier
            }
            satisfied_requirements {
                type
                result_id
                testcase
                subject_type
                subject_identifier
            }
            results {
                href
                id
                note
                outcome
                ref_url
                submit_time
                groups
                testcase {
                    href
                    name
                    ref_url
                }
                data {
                    brew_task_id
                    category
                    ci_email
                    ci_irc
                    ci_name
                    ci_team
                    ci_url
                    component
                    issuer
                    item
                    log
                    publisher_id
                    rebuild
                    recipients
                    scratch
                    system_os
                    system_provider
                    type
                }
            }
            waivers {
                id
                comment
                product_version
                proxied_by
                subject {
                    item
                    type
                }
                subject_identifier
                subject_type
                testcase
                timestamp
                username
                waived
            }
            summary
        }
    }
`;

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
//                ...GatingDecisionFragment
//    ${gatingDecisionFragment}

export const ArtifactsCurrentStateQuery = gql`
    query ArtifactsCurrentState(
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
                ...CrentStateFragment
            }
        }
    }
    ${currentStateFragment}
`;

export const ArtifactsDetailedInfoBrewTask = gql`
    query ArtifactsDetailedInfoBrewBuild($task_id: Int!) {
        brew_task(task_id: $task_id) {
            builds {
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
                tags {
                    name
                    id
                }
                history {
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
                commit_obj {
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
                ...CurrentStateFragment
                ...GatingDecisionFragment
            }
        }
    }
    ${mainFragment}
    ${currentStateFragment}
    ${gatingDecisionFragment}
`;

const currentStateFragmentCut1 = gql`
    fragment CurrentStateFragmentCut1 on ArtifactType {
        _id
        current_state {
            complete {
                kai_state {
                    stage
                    msg_id
                    version
                }
            }
        }
    }
`;

/**
            complete {
                stage
                status
                state
                test {
                    type
                    result
                }
            }
*/

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
                ...CurrentStateFragmentCut1
            }
        }
    }
    ${mainFragment}
    ${currentStateFragmentCut1}
`;
//                ...GatingDecisionFragment
//    ${gatingDecisionFragment}

// Refetch current state fragment. Need to find replaces, data, and write merge for it.
// https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-arrays-of-non-normalized-objects
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
                ...CurrentStateFragment
                current_state {
                    error {
                        msg_id
                        xunit(msg_id: $msg_id)
                    }
                    queued {
                        msg_id
                        xunit(msg_id: $msg_id)
                    }
                    waived {
                        msg_id
                        xunit(msg_id: $msg_id)
                    }
                    running {
                        msg_id
                        xunit(msg_id: $msg_id)
                    }
                    complete {
                        msg_id
                        xunit(msg_id: $msg_id)
                    }
                }
            }
        }
    }
    ${currentStateFragment}
`;
