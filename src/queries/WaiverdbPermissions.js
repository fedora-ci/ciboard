import { gql } from '@apollo/client';

export default gql`
    query {
        waiverDbPermissions {
            testcases
            users
            groups
        }
    }
`;
