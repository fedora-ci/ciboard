import { gql } from '@apollo/client';

export default gql`
    query {
        waiver_db_permissions {
            testcases
            users
            groups
        }
    }
`;
