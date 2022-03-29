import { gql } from '@apollo/client';

export default gql`
    mutation WaiverdbNew(
        $subject_type: String!,
        $subject_identifier: String!,
        $testcase: String!,
        $waived: Boolean!,
        $product_version: String!,
        $comment: String!
    ) {
        waiver_db_new(
            subject_type: $subject_type,
            subject_identifier: $subject_identifier,
            testcase: $testcase,
            waived: $waived,
            product_version: $product_version,
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
