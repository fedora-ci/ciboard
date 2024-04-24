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
import { Artifact, MetadataRaw, KojiTaskInfo, MbsBuildInfo } from '../types';

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

/**
 * Fetch koji-tags, koji-histroy for Koji task
 */
export const ArtifactsDetailedInfoKojiTask = gql`
    query ArtifactsDetailedInfoKojiTask(
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
                completion_ts
                completion_time
                tags(instance: $koji_instance) {
                    id
                    name
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

/**
 * Fetch koji-tags, koji-histroy for Module build
 */
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

/**
 * Used for generic artifact search on main page, without gating status
 * Next: ArtifactsSearchSlowQuery2
 */
export const ArtifactsSearchFastQuery1 = gql`
    query ArtifactsComplete(
        $sortBy: String
        $artTypes: [String]
        $newerThen: String
        $queryString: String
        $doDeepSearch: Boolean
        $paginationSize: Int
        $paginationFrom: Int
    ) {
        artifacts(
            sortBy: $sortBy
            artTypes: $artTypes
            newerThen: $newerThen
            queryString: $queryString
            doDeepSearch: $doDeepSearch
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

/**
 * Used for generic artifact search on main page, with gating status
 * Prev: ArtifactsSearchFastQuery1
 */
export const ArtifactsSearchSlowQuery2 = gql`
    query ArtifactsComplete(
        $sortBy: String
        $artTypes: [String]
        $newerThen: String
        $queryString: String
        $doDeepSearch: Boolean
        $paginationSize: Int
        $paginationFrom: Int
    ) {
        artifacts(
            sortBy: $sortBy
            artTypes: $artTypes
            newerThen: $newerThen
            queryString: $queryString
            doDeepSearch: $doDeepSearch
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

export interface ArtifactsCompleteQueryData {
    artifacts: {
        hits_info: any;
        hits: Artifact[];
    };
    metadataRaw: MetadataRaw[];
}

/**
 * Specific artifact need to show
 * Metadata is required for all tests. This will help to show dependency between tests.
 */
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
                children(onlyActual: true) {
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
        metadataRaw {
            _id
            payload
            priority
            testcaseName
            productVersion
            testcaseNameIsRegex
        }
    }
`;
