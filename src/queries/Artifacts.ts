/*
 * This file is part of ciboard

 * Copyright (c) 2021, 2022, 2023 Andrei Stepanov <astepano@redhat.com>
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
import {
    Artifact,
    KojiTaskInfo,
    MbsBuildInfo,
    ComponentMapping,
} from '../types';

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
        custom_metadata {
            payload
        }
    }
`;

const mainFragment = gql`
    fragment MainFragment on ArtifactType {
        _id
        aid
        type
        payload
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

const commitInfoFragment = gql`
    fragment CommitInfoFragment on CommitObject {
        committer_date_seconds
        committer_email
        committer_name
    }
`;

const tagHistoryFragment = gql`
    fragment TagHistoryFragment on KojiHistoryType {
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
`;

export interface ArtifactsDetailedInfoKojiTaskData {
    kojiTask?: KojiTaskInfo;
}

export const ArtifactsDetailedInfoKojiTask = gql`
    query ArtifactsDetailedInfoKojiBuild(
        $task_id: Int!
        $koji_instance: KojiInstanceInputType
        $distgit_instance: DistGitInstanceInputType
    ) {
        kojiTask(task_id: $task_id, instance: $koji_instance) {
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
                    ...TagHistoryFragment
                }
                commit_obj(instance: $distgit_instance) {
                    ...CommitInfoFragment
                }
            }
        }
    }
    ${commitInfoFragment}
    ${tagHistoryFragment}
`;

export interface ArtifactsDetailedInfoModuleBuildData {
    mbsBuild?: MbsBuildInfo;
}

export const ArtifactsDetailedInfoModuleBuild = gql`
    query ArtifactsDetailedInfoModuleBuild(
        $build_id: Int!
        $mbs_instance: MbsInstanceInputType
        $koji_instance: KojiInstanceInputType
        $distgit_instance: DistGitInstanceInputType
    ) {
        mbsBuild(build_id: $build_id, instance: $mbs_instance) {
            commit(instance: $distgit_instance) {
                ...CommitInfoFragment
            }
            id
            name
            owner
            scmurl
            tag_history(instance: $koji_instance) {
                ...TagHistoryFragment
            }
            tags(instance: $koji_instance) {
                id
                name
            }
            tasks {
                id
                nvr
            }
            time_completed
        }
    }
    ${commitInfoFragment}
    ${tagHistoryFragment}
`;

export interface ArtifactsCompleteQueryData {
    artifacts: {
        hits_info: any;
        hits: Artifact[];
    };
}

export const ArtifactsShallowQuery = gql`
    query ArtifactsComplete(
        $sortBy: String
        $artTypes: [String]
        $newerThen: String
        $queryString: String
        $paginationSize: Int
        $paginationFrom: Int
    ) {
        artifacts(
            sortBy: $sortBy
            artTypes: $artTypes
            newerThen: $newerThen
            queryString: $queryString
            paginationSize: $paginationSize
            paginationFrom: $paginationFrom
        ) {
            hits {
                hit_info
                hit_source
            }
            hits_info
        }
    }
`;

/*
 */

export const ArtifactsGreenwaveQuery = gql`
    query ArtifactsComplete(
        $sortBy: String
        $artTypes: [String]
        $newerThen: String
        $queryString: String
        $paginationSize: Int
        $paginationFrom: Int
    ) {
        artifacts(
            sortBy: $sortBy
            artTypes: $artTypes
            newerThen: $newerThen
            queryString: $queryString
            paginationSize: $paginationSize
            paginationFrom: $paginationFrom
        ) {
            hits_info
            hits {
                hit_info
                hit_source
                greenwaveDecision {
                    results
                    waivers
                    summary
                    policies_satisfied
                    satisfied_requirements
                    unsatisfied_requirements
                }
            }
        }
    }
`;

export const ArtifactsCompleteQuery = gql`
    query ArtifactsComplete(
        $sortBy: String
        $artTypes: [String]
        $newerThen: String
        $queryString: String
        $paginationSize: Int
        $paginationFrom: Int
    ) {
        artifacts(
            sortBy: $sortBy
            artTypes: $artTypes
            newerThen: $newerThen
            queryString: $queryString
            paginationSize: $paginationSize
            paginationFrom: $paginationFrom
        ) {
            hits_info
            hits {
                hit_info
                hit_source
                children {
                    hits_info
                    hits {
                        hit_info
                        hit_source
                    }
                }
                greenwaveDecision {
                    results
                    waivers
                    summary
                    policies_satisfied
                    satisfied_requirements
                    unsatisfied_requirements
                }
            }
        }
    }
`;

export const ArtifactsListByFiltersQuery = gql`
    query ArtifactsListByFiltersQuery1(
        $limit: Int
        $atype: String!
        $aid_offset: String
        $dbFieldName1: String
        $dbFieldValues1: [String]
        $dbFieldName2: String
        $dbFieldValues2: [String]
        $options: ArtifactsOptionsInputType
    ) {
        artifacts(
            atype: $atype
            limit: $limit
            options: $options
            aid_offset: $aid_offset
            dbFieldName1: $dbFieldName1
            dbFieldValues1: $dbFieldValues1
            dbFieldName2: $dbFieldName2
            dbFieldValues2: $dbFieldValues2
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

export const PageGatingGetSSTTeams = gql`
    query PageGatingGetSSTTeams($product_id: Int) {
        sstInfo(product_id: $product_id)
    }
`;

export interface PageGatingArtifactsData {
    artifacts?: {
        has_next: boolean;
        artifacts: Artifact[] & {
            component_mapping: ComponentMapping;
        };
    };
}

export const PageGatingArtifacts = gql`
    query PageGatingArtifacts(
        $limit: Int
        $atype: String!
        $aid_offset: String
        $dbFieldName1: String
        $dbFieldValues1: [String]
        $dbFieldName2: String
        $dbFieldValues2: [String]
        $dbFieldName3: String
        $dbFieldValues3: [String]
        $dbFieldNameComponentMapping1: String
        $dbFieldValuesComponentMapping1: [String]
        $options: ArtifactsOptionsInputType
    ) {
        artifacts(
            atype: $atype
            limit: $limit
            options: $options
            aid_offset: $aid_offset
            dbFieldName1: $dbFieldName1
            dbFieldValues1: $dbFieldValues1
            dbFieldName2: $dbFieldName2
            dbFieldValues2: $dbFieldValues2
            dbFieldName3: $dbFieldName3
            dbFieldValues3: $dbFieldValues3
            dbFieldNameComponentMapping1: $dbFieldNameComponentMapping1
            dbFieldValuesComponentMapping1: $dbFieldValuesComponentMapping1
        ) {
            has_next
            artifacts {
                ...MainFragment
                ...StatesFragment
                component_mapping {
                    _updated
                    product_id
                    qa_contact
                    description
                    def_assignee
                    sst_team_name
                    component_name
                    qa_contact_name
                    def_assignee_name
                }
            }
        }
    }
    ${mainFragment}
    ${statesFragment}
`;
